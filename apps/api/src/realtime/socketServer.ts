import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "node:http";
import {
  createMessage,
  markChatRead,
  getChatParticipantIds,
  getUserChatIds,
} from "../services/messagingService.js";
import { notifyMessageRecipients } from "../services/pushNotificationService.js";
import {
  getAccessTokenFromSocket,
  verifyAccessToken,
} from "../services/authTokenService.js";
import { createCorsOriginValidator } from "../config/env.js";
import type { LeaveRequestDTO } from "../services/leaveRequestService.js";

interface ServerToClientEvents {
  "message:new": (message: Record<string, unknown>) => void;
  "message:read": (data: { chatId: string; userId: string; lastReadAt: string }) => void;
  "chat:bumped": (data: { chatId: string; lastMessageAt: string }) => void;
  "chat:changed": (data: { chatId: string }) => void;
  "attendance:changed": (data: {
    workPointId: string;
    workerId?: string;
    attendanceId?: string;
    changedAt: string;
  }) => void;
  "leave-request:changed": (data: {
    action: "created" | "approved" | "rejected" | "canceled";
    leaveRequest: LeaveRequestDTO;
    changedAt: string;
  }) => void;
  "presence:online": (data: { userId: string }) => void;
  "presence:offline": (data: { userId: string }) => void;
  typing: (data: { chatId: string; userId: string; isTyping: boolean }) => void;
}

interface ClientToServerEvents {
  "message:send": (data: {
    chatId: string;
    body: string;
    replyToId?: string;
    attachmentUrl?: string;
    attachmentName?: string;
    attachmentType?: string;
    clientNonce?: string;
  }) => void;
  "message:typing": (data: { chatId: string; isTyping: boolean }) => void;
  "chat:read": (data: { chatId: string }) => void;
  "chat:join": (data: { chatId: string }) => void;
}

// In-memory presence: userId → Set of socketIds
const onlineUsers = new Map<string, Set<string>>();
let ioInstance:
  | SocketIOServer<ClientToServerEvents, ServerToClientEvents>
  | null = null;

export function initSocketServer(httpServer: HttpServer) {
  const isAllowedCorsOrigin = createCorsOriginValidator();
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin(origin, callback) {
        if (isAllowedCorsOrigin(origin)) {
          callback(null, true);
          return;
        }

        callback(null, false);
      },
      credentials: true,
    },
  });
  ioInstance = io;

  // Auth gate
  io.use(async (socket, next) => {
    const token = getAccessTokenFromSocket(
      socket.request.headers,
      socket.handshake.auth?.token,
    );

    if (!token) {
      return next(new Error("Unauthorized"));
    }

    try {
      const verified = await verifyAccessToken(token);
      socket.data.userId = verified.userId;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.data.userId as string | undefined;
    if (!userId) return socket.disconnect();

    // Track presence
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId)!.add(socket.id);

    // Join personal room and all chat rooms
    socket.join(`user:${userId}`);
    const chatIds = await getUserChatIds(userId);
    for (const chatId of chatIds) {
      socket.join(`chat:${chatId}`);
    }

    // Notify others that this user is online
    io.emit("presence:online", { userId });

    // ── message:send ───────────────────────────────────────────────
    socket.on("message:send", async (data) => {
      try {
        const message = await createMessage(
          data.chatId,
          userId,
          data.body,
          {
            replyToId: data.replyToId,
            attachmentUrl: data.attachmentUrl,
            attachmentName: data.attachmentName,
            attachmentType: data.attachmentType,
            clientNonce: data.clientNonce,
          }
        );

        // Broadcast to everyone in the chat room
        io.to(`chat:${data.chatId}`).emit("message:new", message as unknown as Record<string, unknown>);
        void notifyMessageRecipients(message).catch((error) => {
          console.error("[push] message notification error:", error);
        });

        // Notify participants who aren't in this room (sidebar bump)
        const participantIds = await getChatParticipantIds(data.chatId);
        const bumpPayload = {
          chatId: data.chatId,
          lastMessageAt: message.createdAt,
        };
        for (const pid of participantIds) {
          if (pid !== userId) {
            io.to(`user:${pid}`).emit("chat:bumped", bumpPayload);
          }
        }
      } catch (err) {
        console.error("[socket] message:send error:", err);
      }
    });

    // ── message:typing ─────────────────────────────────────────────
    socket.on("message:typing", (data) => {
      socket.to(`chat:${data.chatId}`).emit("typing", {
        chatId: data.chatId,
        userId,
        isTyping: data.isTyping,
      });
    });

    // ── chat:read ──────────────────────────────────────────────────
    socket.on("chat:read", async (data) => {
      try {
        await markChatRead(data.chatId, userId);
        const now = new Date().toISOString();
        socket.to(`chat:${data.chatId}`).emit("message:read", {
          chatId: data.chatId,
          userId,
          lastReadAt: now,
        });
      } catch (err) {
        console.error("[socket] chat:read error:", err);
      }
    });

    // ── chat:join ──────────────────────────────────────────────────
    socket.on("chat:join", (data) => {
      socket.join(`chat:${data.chatId}`);
    });

    // ── disconnect ─────────────────────────────────────────────────
    socket.on("disconnect", () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit("presence:offline", { userId });
        }
      }
    });
  });

  return io;
}

export function isUserOnline(userId: string): boolean {
  return (onlineUsers.get(userId)?.size ?? 0) > 0;
}

export async function emitChatChanged(
  chatId: string,
  extraUserIds: string[] = [],
): Promise<void> {
  if (!ioInstance) return;

  const participantIds = await getChatParticipantIds(chatId);
  for (const userId of participantIds) {
    ioInstance.in(`user:${userId}`).socketsJoin(`chat:${chatId}`);
    ioInstance.to(`user:${userId}`).emit("chat:changed", { chatId });
  }

  for (const userId of extraUserIds) {
    if (participantIds.includes(userId)) continue;
    ioInstance.in(`user:${userId}`).socketsLeave(`chat:${chatId}`);
    ioInstance.to(`user:${userId}`).emit("chat:changed", { chatId });
  }
}

export function emitAttendanceChanged(
  payload: {
    workPointId: string;
    workerId?: string;
    attendanceId?: string;
    changedAt: string;
  },
  userIds: string[],
): void {
  if (!ioInstance) return;

  for (const userId of new Set(userIds)) {
    ioInstance.to(`user:${userId}`).emit("attendance:changed", payload);
  }
}

export function emitLeaveRequestChanged(
  payload: {
    action: "created" | "approved" | "rejected" | "canceled";
    leaveRequest: LeaveRequestDTO;
    changedAt: string;
  },
  userIds: string[],
): void {
  if (!ioInstance) return;

  for (const userId of new Set(userIds)) {
    ioInstance.to(`user:${userId}`).emit("leave-request:changed", payload);
  }
}

import { prisma } from "../../database/prisma.js";
import type { ChatType } from "../../database/generated/prisma/enums.js";
import { normalizeMessageAttachmentUrl } from "../utils/messagingAttachments.js";

export type MessagePayload = {
  id: string;
  chatId: string;
  senderId: string;
  senderUsername: string;
  body: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
  replyToId?: string;
  replyTo?: { id: string; body: string; senderUsername: string };
  createdAt: string;
  editedAt?: string;
  clientNonce?: string;
};

export type ChatListItem = {
  id: string;
  type: ChatType;
  name: string;
  workPointId?: string;
  lastMessage?: {
    id: string;
    body: string;
    senderId: string;
    senderUsername: string;
    createdAt: string;
    attachmentName?: string;
  };
  lastMessageAt?: string;
  unreadCount: number;
  participants: { id: string; username: string }[];
  otherUserId?: string;
};

export async function listChatsForUser(
  userId: string,
  _companyId: string,
): Promise<ChatListItem[]> {
  const participants = await prisma.chatParticipant.findMany({
    where: { userId },
    include: {
      chat: {
        include: {
          participants: {
            include: { user: { select: { id: true, username: true } } },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { sender: { select: { id: true, username: true } } },
          },
        },
      },
    },
    orderBy: { chat: { lastMessageAt: { sort: "desc", nulls: "last" } } },
  });

  const items = await Promise.all(
    participants.map(async (p) => {
      const chat = p.chat;
      const lastMsg = chat.messages[0];

      const unreadCount = await prisma.message.count({
        where: {
          chatId: chat.id,
          senderId: { not: userId },
          createdAt: { gt: p.lastReadAt ?? new Date(0) },
        },
      });

      let name = chat.name;
      let otherUserId: string | undefined;
      if (chat.type === "DIRECT") {
        const other = chat.participants.find((pp) => pp.userId !== userId);
        name = other?.user.username ?? "Unknown";
        otherUserId = other?.userId;
      }

      return {
        id: chat.id,
        type: chat.type,
        name: name ?? "Group Chat",
        workPointId: chat.workPointId ?? undefined,
        lastMessage: lastMsg
          ? {
              id: lastMsg.id,
              body: lastMsg.body,
              senderId: lastMsg.senderId,
              senderUsername: lastMsg.sender.username,
              createdAt: lastMsg.createdAt.toISOString(),
              attachmentName: lastMsg.attachmentName ?? undefined,
            }
          : undefined,
        lastMessageAt: chat.lastMessageAt?.toISOString(),
        unreadCount,
        participants: chat.participants.map((pp) => ({
          id: pp.userId,
          username: pp.user.username,
        })),
        otherUserId,
      } satisfies ChatListItem;
    })
  );

  return items;
}

export async function getChatMessages(
  chatId: string,
  userId: string,
  cursor?: string,
  limit = 30
) {
  const participant = await prisma.chatParticipant.findUnique({
    where: { chatId_userId: { chatId, userId } },
  });
  if (!participant) throw new Error("Not a participant of this chat");

  const messages = await prisma.message.findMany({
    where: {
      chatId,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    include: {
      sender: { select: { id: true, username: true } },
      replyTo: {
        include: { sender: { select: { id: true, username: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
  });

  const hasMore = messages.length > limit;
  const items = hasMore ? messages.slice(0, limit) : messages;
  const nextCursor = hasMore
    ? items[items.length - 1].createdAt.toISOString()
    : undefined;

  return {
    messages: items.reverse().map(toMessagePayload),
    nextCursor,
    hasMore,
  };
}

export async function findOrCreateDirectChat(
  userId: string,
  otherUserId: string,
  companyId: string,
): Promise<{ id: string; isNew: boolean }> {
  if (userId === otherUserId) throw new Error("Cannot chat with yourself");

  const otherUser = await prisma.user.findFirst({
    where: { id: otherUserId, companyId },
    select: { id: true },
  });
  if (!otherUser) throw new Error("User not found");

  // Find existing direct chat between these two users
  const existing = await prisma.chat.findFirst({
    where: {
      companyId,
      type: "DIRECT",
      participants: {
        every: { userId: { in: [userId, otherUserId] } },
      },
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: otherUserId } } },
      ],
    },
    select: { id: true },
  });

  if (existing) return { id: existing.id, isNew: false };

  const chat = await prisma.chat.create({
    data: {
      companyId,
      type: "DIRECT",
      participants: {
        create: [{ userId }, { userId: otherUserId }],
      },
    },
    select: { id: true },
  });

  return { id: chat.id, isNew: true };
}

export async function createMessage(
  chatId: string,
  senderId: string,
  body: string,
  opts: {
    replyToId?: string;
    attachmentUrl?: string;
    attachmentName?: string;
    attachmentType?: string;
    clientNonce?: string;
  } = {}
): Promise<MessagePayload> {
  const attachmentUrl = normalizeMessageAttachmentUrl(opts.attachmentUrl);
  const participant = await prisma.chatParticipant.findUnique({
    where: { chatId_userId: { chatId, userId: senderId } },
  });
  if (!participant) throw new Error("Not a participant of this chat");

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        chatId,
        senderId,
        body,
        replyToId: opts.replyToId,
        attachmentUrl,
        attachmentName: opts.attachmentName,
        attachmentType: opts.attachmentType,
      },
      include: {
        sender: { select: { id: true, username: true } },
        replyTo: {
          include: { sender: { select: { id: true, username: true } } },
        },
      },
    }),
    prisma.chat.update({
      where: { id: chatId },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  return { ...toMessagePayload(message), clientNonce: opts.clientNonce };
}

export async function markChatRead(
  chatId: string,
  userId: string
): Promise<void> {
  await prisma.chatParticipant.update({
    where: { chatId_userId: { chatId, userId } },
    data: { lastReadAt: new Date() },
  });
}

export async function getOrCreateWorkPointChat(
  workPointId: string
): Promise<string> {
  const existing = await prisma.chat.findUnique({
    where: { workPointId },
    select: { id: true },
  });
  if (existing) return existing.id;

  const workPoint = await prisma.workPoint.findUnique({
    where: { id: workPointId },
    select: { companyId: true, name: true },
  });

  if (!workPoint) {
    throw new Error("Work point not found");
  }

  const chat = await prisma.chat.create({
    data: {
      companyId: workPoint.companyId,
      type: "WORKPOINT",
      workPointId,
      name: workPoint?.name ?? "Work Point Chat",
    },
    select: { id: true },
  });

  return chat.id;
}

export async function getWorkPointChatId(
  workPointId: string,
): Promise<string | null> {
  const chat = await prisma.chat.findUnique({
    where: { workPointId },
    select: { id: true },
  });

  return chat?.id ?? null;
}

export async function addParticipantToChat(
  chatId: string,
  userId: string
): Promise<void> {
  await prisma.chatParticipant.upsert({
    where: { chatId_userId: { chatId, userId } },
    create: { chatId, userId },
    update: {},
  });
}

export async function removeParticipantFromChat(
  chatId: string,
  userId: string
): Promise<void> {
  await prisma.chatParticipant.deleteMany({
    where: { chatId, userId },
  });
}

export async function getChatParticipantIds(chatId: string): Promise<string[]> {
  const participants = await prisma.chatParticipant.findMany({
    where: { chatId },
    select: { userId: true },
  });
  return participants.map((p) => p.userId);
}

export async function getUserChatIds(userId: string): Promise<string[]> {
  const participants = await prisma.chatParticipant.findMany({
    where: { userId },
    select: { chatId: true },
  });
  return participants.map((p) => p.chatId);
}

export async function listAllUsers(excludeUserId: string, companyId: string) {
  return prisma.user.findMany({
    where: { companyId, id: { not: excludeUserId } },
    select: { id: true, username: true, email: true, role: true },
    orderBy: { username: "asc" },
  });
}

function toMessagePayload(message: {
  id: string;
  chatId: string;
  senderId: string;
  sender: { id: string; username: string };
  body: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentType: string | null;
  replyToId: string | null;
  replyTo: {
    id: string;
    body: string;
    senderId: string;
    sender: { id: string; username: string };
  } | null;
  createdAt: Date;
  editedAt: Date | null;
}): MessagePayload {
  return {
    id: message.id,
    chatId: message.chatId,
    senderId: message.senderId,
    senderUsername: message.sender.username,
    body: message.body,
    attachmentUrl: message.attachmentUrl ?? undefined,
    attachmentName: message.attachmentName ?? undefined,
    attachmentType: message.attachmentType ?? undefined,
    replyToId: message.replyToId ?? undefined,
    replyTo: message.replyTo
      ? {
          id: message.replyTo.id,
          body: message.replyTo.body,
          senderUsername: message.replyTo.sender.username,
        }
      : undefined,
    createdAt: message.createdAt.toISOString(),
    editedAt: message.editedAt?.toISOString(),
  };
}

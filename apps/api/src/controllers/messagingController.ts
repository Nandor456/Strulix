import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types/AuthRequest.js";
import {
  listChatsForUser,
  getChatMessages,
  findOrCreateDirectChat,
  createMessage,
  markChatRead,
  listAllUsers,
} from "../services/messagingService.js";
import { emitChatChanged } from "../realtime/socketServer.js";

export async function listChatsController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.auth!.userId;
    const chats = await listChatsForUser(userId);
    res.json(chats);
  } catch (err) {
    next(err);
  }
}

export async function getMessagesController(
  req: AuthenticatedRequest<{ chatId: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.auth!.userId;
    const { chatId } = req.params;
    const cursor = req.query.cursor as string | undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const result = await getChatMessages(chatId, userId, cursor, limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function createDirectChatController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.auth!.userId;
    const { userId: otherUserId } = req.body as { userId: string };
    const result = await findOrCreateDirectChat(userId, otherUserId);
    if (result.isNew) {
      void emitChatChanged(result.id).catch((err) => {
        console.error("emitChatChanged error:", err);
      });
    }
    res.status(result.isNew ? 201 : 200).json({ chatId: result.id });
  } catch (err) {
    next(err);
  }
}

export async function sendMessageController(
  req: AuthenticatedRequest<{ chatId: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.auth!.userId;
    const { chatId } = req.params;
    const { body, replyToId, attachmentUrl, attachmentName, attachmentType, clientNonce } =
      req.body as {
        body: string;
        replyToId?: string;
        attachmentUrl?: string;
        attachmentName?: string;
        attachmentType?: string;
        clientNonce?: string;
      };

    const message = await createMessage(chatId, userId, body, {
      replyToId,
      attachmentUrl,
      attachmentName,
      attachmentType,
      clientNonce,
    });

    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
}

export async function markReadController(
  req: AuthenticatedRequest<{ chatId: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.auth!.userId;
    const { chatId } = req.params;
    await markChatRead(chatId, userId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function uploadAttachmentController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const file = req.file as Express.Multer.File | undefined;
    if (!file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    res.json({
      attachmentUrl: `/uploads/messaging/${file.filename}`,
      attachmentName: file.originalname,
      attachmentType: file.mimetype,
    });
  } catch (err) {
    next(err);
  }
}

export async function listUsersController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.auth!.userId;
    const users = await listAllUsers(userId);
    res.json(users);
  } catch (err) {
    next(err);
  }
}

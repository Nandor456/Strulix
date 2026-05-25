import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types/AuthRequest.js";
import {
  deletePushDeviceForUser,
  upsertPushDevice,
  type PushPlatform,
} from "../services/pushDeviceService.js";

export async function registerPushDeviceController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.auth!.userId;
    const { token, platform } = req.body as {
      token: string;
      platform: PushPlatform;
    };
    await upsertPushDevice({ userId, token, platform });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function unregisterPushDeviceController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.auth!.userId;
    const { token } = req.body as { token: string };
    await deletePushDeviceForUser(userId, token);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

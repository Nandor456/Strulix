import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../database/prisma.js";
import { log } from "console";
import {
  AuthTokenError,
  getAccessTokenFromRequest,
  verifyAccessToken,
} from "../services/authTokenService.js";

export async function ensureAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = getAccessTokenFromRequest(req);
  if (!token) {
    log("Unauthorized access attempt. No access token.");
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const verified = await verifyAccessToken(token);
    req.auth = { userId: verified.userId, tokenId: verified.jti };
    next();
  } catch (error) {
    if (error instanceof AuthTokenError) {
      log("Unauthorized access attempt. Invalid access token.");
      return res.status(401).json({ error: "Unauthorized" });
    }
    next(error);
  }
}

export function ensureRole(...allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

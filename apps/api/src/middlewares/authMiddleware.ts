import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../database/prisma.js";
import { log } from "console";
import {
  AuthTokenError,
  getAccessTokenFromRequest,
  verifyAccessToken,
} from "../services/authTokenService.js";
import { isBillingActive } from "../services/billingService.js";

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
    const user = await prisma.user.findUnique({
      where: { id: verified.userId },
      select: {
        id: true,
        role: true,
        companyId: true,
        company: { select: { billingStatus: true } },
      },
    });

    if (!user) {
      log("Unauthorized access attempt. User no longer exists.");
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.auth = {
      userId: verified.userId,
      role: user.role,
      companyId: user.companyId,
      companyBillingStatus: user.company.billingStatus,
      tokenId: verified.jti,
    };
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
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.auth?.role;
    if (!role) return res.status(401).json({ error: "Unauthorized" });

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

export function ensureActiveBillingForWrites(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const billingStatus = req.auth?.companyBillingStatus;
  if (!billingStatus) return res.status(401).json({ error: "Unauthorized" });

  if (!isBillingActive(billingStatus)) {
    return res.status(402).json({
      error: "Billing is required to continue.",
      code: "billing_required",
    });
  }

  next();
}

import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../../database/prisma.js";
import { revokeRefreshTokensForUser } from "./authTokenService.js";
import {
  buildPasswordResetEmail,
  sendEmail,
} from "./emailService.js";

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

export class PasswordResetError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
  }
}

export function normalizePasswordResetEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getPasswordResetExpiresAt(now = new Date()) {
  return new Date(now.getTime() + PASSWORD_RESET_TTL_MS);
}

export function canUsePasswordResetToken(params: {
  expiresAt: Date;
  usedAt: Date | null;
  now?: Date;
}) {
  return !params.usedAt && params.expiresAt > (params.now ?? new Date());
}

export function buildPasswordResetUrl(token: string) {
  const baseUrl = (
    process.env.FRONTEND_BASE_URL?.trim() ||
    process.env.APP_BASE_URL?.trim() ||
    "http://localhost:5173"
  ).replace(/\/$/, "");
  const params = new URLSearchParams({ token });
  return `${baseUrl}/reset-password?${params.toString()}`;
}

function generatePasswordResetToken() {
  return randomBytes(32).toString("base64url");
}

export async function requestPasswordReset(emailInput: string) {
  const email = normalizePasswordResetEmail(emailInput);
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, username: true },
  });

  if (!user) return { ok: true };

  const token = generatePasswordResetToken();
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });

    await tx.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashPasswordResetToken(token),
        expiresAt: getPasswordResetExpiresAt(now),
      },
    });
  });

  try {
    await sendEmail(
      buildPasswordResetEmail({
        email: user.email,
        username: user.username,
        resetUrl: buildPasswordResetUrl(token),
      }),
    );
  } catch (error) {
    console.error("Failed to send password reset email:", error);
  }

  return { ok: true };
}

export async function resetPassword(tokenInput: string, password: string) {
  const token = tokenInput.trim();
  const tokenHash = hashPasswordResetToken(token);
  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date();
  let resetUserId: string | null = null;

  await prisma.$transaction(async (tx) => {
    const resetToken = await tx.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
      },
    });

    if (
      !resetToken ||
      !canUsePasswordResetToken({
        expiresAt: resetToken.expiresAt,
        usedAt: resetToken.usedAt,
        now,
      })
    ) {
      throw new PasswordResetError("Password reset link is invalid or expired.");
    }

    await tx.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: now },
    });

    await tx.user.update({
      where: { id: resetToken.userId },
      data: { password: passwordHash },
    });
    resetUserId = resetToken.userId;
  });

  if (resetUserId) {
    await revokeRefreshTokensForUser(resetUserId);
  }

  return { ok: true };
}

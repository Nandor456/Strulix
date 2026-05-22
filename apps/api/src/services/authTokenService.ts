import { createHash, randomUUID } from "node:crypto";
import type { IncomingHttpHeaders } from "node:http";
import type { CookieOptions, Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "../../database/prisma.js";

export const ACCESS_TOKEN_COOKIE = "bp_access_token";
export const REFRESH_TOKEN_COOKIE = "bp_refresh_token";

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
const JWT_ISSUER = "buildpulse";
const encoder = new TextEncoder();

type TokenUse = "access" | "refresh";

type VerifiedToken = {
  userId: string;
  jti: string;
};

type BuiltToken = {
  token: string;
  jti: string;
  jtiHash: string;
  expiresAt: Date;
};

export class AuthTokenError extends Error {
  statusCode = 401;
}

function getRequiredSecret(name: "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET") {
  const secret = process.env[name];
  if (!secret) {
    throw new Error(`${name} is required`);
  }
  return encoder.encode(secret);
}

function secretForTokenUse(tokenUse: TokenUse) {
  return getRequiredSecret(
    tokenUse === "access" ? "JWT_ACCESS_SECRET" : "JWT_REFRESH_SECRET",
  );
}

function ttlForTokenUse(tokenUse: TokenUse) {
  return tokenUse === "access"
    ? ACCESS_TOKEN_TTL_SECONDS
    : REFRESH_TOKEN_TTL_SECONDS;
}

function hashTokenId(jti: string) {
  return createHash("sha256").update(jti).digest("hex");
}

function expiresAtForTtl(ttlSeconds: number) {
  return new Date(Date.now() + ttlSeconds * 1000);
}

function baseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...baseCookieOptions(),
    maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
  });
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...baseCookieOptions(),
    maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_TOKEN_COOKIE, baseCookieOptions());
  res.clearCookie(REFRESH_TOKEN_COOKIE, baseCookieOptions());
}

export function parseCookieHeader(cookieHeader: string | undefined) {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  for (const part of cookieHeader.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;

    const name = part.slice(0, index).trim();
    const rawValue = part.slice(index + 1).trim();
    if (!name) continue;

    try {
      cookies[name] = decodeURIComponent(rawValue);
    } catch {
      cookies[name] = rawValue;
    }
  }

  return cookies;
}

export function getCookieValue(
  cookieHeader: string | undefined,
  cookieName: string,
) {
  return parseCookieHeader(cookieHeader)[cookieName];
}

export function getBearerToken(authorization: string | undefined) {
  if (!authorization) return undefined;
  const [scheme, token] = authorization.split(/\s+/, 2);
  if (scheme?.toLowerCase() !== "bearer" || !token) return undefined;
  return token;
}

export function getAccessTokenFromRequest(req: Request) {
  return (
    getCookieValue(req.headers.cookie, ACCESS_TOKEN_COOKIE) ??
    getBearerToken(req.headers.authorization)
  );
}

export function getRefreshTokenFromRequest(req: Request) {
  const body = req.body as { refreshToken?: unknown } | undefined;
  const bodyToken =
    typeof body?.refreshToken === "string" ? body.refreshToken : undefined;

  return (
    getCookieValue(req.headers.cookie, REFRESH_TOKEN_COOKIE) ??
    bodyToken ??
    getBearerToken(req.headers.authorization)
  );
}

export function getAccessTokenFromSocket(
  headers: IncomingHttpHeaders,
  socketAuthToken: unknown,
) {
  const authorization = Array.isArray(headers.authorization)
    ? headers.authorization[0]
    : headers.authorization;
  const cookie = Array.isArray(headers.cookie)
    ? headers.cookie[0]
    : headers.cookie;

  return (
    getCookieValue(cookie, ACCESS_TOKEN_COOKIE) ??
    getBearerToken(authorization) ??
    (typeof socketAuthToken === "string" ? socketAuthToken : undefined)
  );
}

async function signToken(userId: string, tokenUse: TokenUse, jti: string) {
  const ttlSeconds = ttlForTokenUse(tokenUse);

  return new SignJWT({ tokenUse })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(JWT_ISSUER)
    .setSubject(userId)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
    .sign(secretForTokenUse(tokenUse));
}

async function buildToken(userId: string, tokenUse: TokenUse): Promise<BuiltToken> {
  const jti = randomUUID();
  const ttlSeconds = ttlForTokenUse(tokenUse);

  return {
    token: await signToken(userId, tokenUse, jti),
    jti,
    jtiHash: hashTokenId(jti),
    expiresAt: expiresAtForTtl(ttlSeconds),
  };
}

async function verifyToken(token: string, tokenUse: TokenUse): Promise<VerifiedToken> {
  try {
    const { payload } = await jwtVerify(token, secretForTokenUse(tokenUse), {
      issuer: JWT_ISSUER,
    });
    const payloadTokenUse = (payload as { tokenUse?: unknown }).tokenUse;

    if (
      payloadTokenUse !== tokenUse ||
      typeof payload.sub !== "string" ||
      typeof payload.jti !== "string"
    ) {
      throw new AuthTokenError("Invalid token");
    }

    return { userId: payload.sub, jti: payload.jti };
  } catch (error) {
    if (error instanceof AuthTokenError) throw error;
    throw new AuthTokenError("Invalid token");
  }
}

export function verifyAccessToken(token: string) {
  return verifyToken(token, "access");
}

async function verifyRefreshToken(token: string) {
  return verifyToken(token, "refresh");
}

export async function issueAuthCookies(res: Response, userId: string) {
  const accessToken = await buildToken(userId, "access");
  const refreshToken = await buildToken(userId, "refresh");

  await prisma.refreshToken.create({
    data: {
      userId,
      jtiHash: refreshToken.jtiHash,
      expiresAt: refreshToken.expiresAt,
    },
  });

  setAuthCookies(res, accessToken.token, refreshToken.token);
}

export async function rotateRefreshToken(res: Response, refreshTokenValue: string) {
  const verified = await verifyRefreshToken(refreshTokenValue);
  const now = new Date();
  const accessToken = await buildToken(verified.userId, "access");
  const nextRefreshToken = await buildToken(verified.userId, "refresh");
  const currentJtiHash = hashTokenId(verified.jti);

  await prisma.$transaction(async (tx) => {
    const currentToken = await tx.refreshToken.findUnique({
      where: { jtiHash: currentJtiHash },
    });

    if (
      !currentToken ||
      currentToken.userId !== verified.userId ||
      currentToken.revokedAt ||
      currentToken.expiresAt <= now
    ) {
      throw new AuthTokenError("Invalid refresh token");
    }

    const createdToken = await tx.refreshToken.create({
      data: {
        userId: verified.userId,
        jtiHash: nextRefreshToken.jtiHash,
        expiresAt: nextRefreshToken.expiresAt,
      },
    });

    await tx.refreshToken.update({
      where: { id: currentToken.id },
      data: {
        revokedAt: now,
        replacedByTokenId: createdToken.id,
      },
    });
  });

  setAuthCookies(res, accessToken.token, nextRefreshToken.token);
}

export async function revokeRefreshToken(refreshTokenValue: string | undefined) {
  if (!refreshTokenValue) return;

  try {
    const verified = await verifyRefreshToken(refreshTokenValue);
    await prisma.refreshToken.updateMany({
      where: {
        jtiHash: hashTokenId(verified.jti),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  } catch (error) {
    if (error instanceof AuthTokenError) return;
    throw error;
  }
}

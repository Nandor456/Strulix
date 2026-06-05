import type { Request, Response } from "express";
import {
  register,
  RegistrationError,
  validateCredentials,
} from "../services/authService.js";
import {
  PasswordResetError,
  requestPasswordReset,
  resetPassword,
} from "../services/passwordResetService.js";
import { log } from "node:console";
import { getUserById } from "../services/userService.js";
import type { AuthenticatedRequest } from "../types/AuthRequest.js";
import {
  AuthTokenError,
  clearAuthCookies,
  getRefreshTokenFromRequest,
  issueAuthCookies,
  revokeRefreshToken,
  rotateRefreshToken,
} from "../services/authTokenService.js";

export async function registerController(req: Request, res: Response) {
  const { username, email, password, companyName, token } = req.body as {
    username: string;
    email: string;
    password: string;
    companyName?: string;
    token?: string;
  };
  try {
    const user = await register(username, email, password, companyName, token);
    await issueAuthCookies(res, user.id);
    res.status(201).json({ id: user.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed";
    const status = err instanceof RegistrationError ? err.statusCode : 400;
    res.status(status).json({ error: message });
  }
}

export async function loginController(req: Request, res: Response) {
  try {
    log("Login attempt for username:", req.body.username);
    const { username, password } = req.body as {
      username: string;
      password: string;
    };
    const user = await validateCredentials(username, password);
    if (!user) {
      return res.status(401).json({ error: "Incorrect username or password" });
    }
    await issueAuthCookies(res, user.id);
    log("Login successful for user:", user.id);

    res.json({ id: user.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed";
    res.status(500).json({ error: message });
  }
}

export async function forgotPasswordController(req: Request, res: Response) {
  const { email } = req.body as { email: string };
  try {
    await requestPasswordReset(email);
    res.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Password reset failed";
    res.status(500).json({ error: message });
  }
}

export async function resetPasswordController(req: Request, res: Response) {
  const { token, password } = req.body as { token: string; password: string };
  try {
    await resetPassword(token, password);
    res.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Password reset failed";
    const status = error instanceof PasswordResetError ? error.statusCode : 500;
    res.status(status).json({ error: message });
  }
}

export async function refreshController(req: Request, res: Response) {
  const refreshToken = getRefreshTokenFromRequest(req);
  if (!refreshToken) {
    clearAuthCookies(res);
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await rotateRefreshToken(res, refreshToken);
    res.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthTokenError) {
      clearAuthCookies(res);
      return res.status(401).json({ error: "Unauthorized" });
    }

    const message = error instanceof Error ? error.message : "Refresh failed";
    res.status(500).json({ error: message });
  }
}

export async function logoutController(req: Request, res: Response) {
  try {
    await revokeRefreshToken(getRefreshTokenFromRequest(req));
  } catch (error) {
    console.error("Failed to revoke refresh token during logout:", error);
  }

  clearAuthCookies(res);
  res.status(204).send();
}

export async function meController(req: AuthenticatedRequest, res: Response) {
  const user = await getUserById(req.auth!.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user });
}

import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPasswordResetUrl,
  canUsePasswordResetToken,
  hashPasswordResetToken,
  normalizePasswordResetEmail,
} from "../src/services/passwordResetService.js";

test("password reset email addresses are normalized", () => {
  assert.equal(
    normalizePasswordResetEmail("  USER@Example.COM "),
    "user@example.com",
  );
});

test("password reset tokens are accepted only when unused and unexpired", () => {
  const now = new Date("2026-06-01T12:00:00.000Z");

  assert.equal(
    canUsePasswordResetToken({
      expiresAt: new Date("2026-06-01T12:30:00.000Z"),
      usedAt: null,
      now,
    }),
    true,
  );
  assert.equal(
    canUsePasswordResetToken({
      expiresAt: new Date("2026-06-01T12:30:00.000Z"),
      usedAt: new Date("2026-06-01T12:05:00.000Z"),
      now,
    }),
    false,
  );
  assert.equal(
    canUsePasswordResetToken({
      expiresAt: now,
      usedAt: null,
      now,
    }),
    false,
  );
});

test("password reset links use the frontend base URL and token query", () => {
  const previousFrontendBaseUrl = process.env.FRONTEND_BASE_URL;
  process.env.FRONTEND_BASE_URL = "https://app.buildpulse.test/";

  try {
    assert.equal(
      buildPasswordResetUrl("abc 123"),
      "https://app.buildpulse.test/reset-password?token=abc+123",
    );
  } finally {
    if (previousFrontendBaseUrl === undefined) {
      delete process.env.FRONTEND_BASE_URL;
    } else {
      process.env.FRONTEND_BASE_URL = previousFrontendBaseUrl;
    }
  }
});

test("password reset tokens are hashed before storage", () => {
  const first = hashPasswordResetToken("token");
  const second = hashPasswordResetToken("token");

  assert.equal(first, second);
  assert.notEqual(first, "token");
  assert.equal(first.length, 64);
});

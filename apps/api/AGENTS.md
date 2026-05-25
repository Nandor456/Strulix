
# BuildPulse API (apps/api)

This is a concise, implementation-accurate guide for the backend so agents do not have to infer behavior.

## Overview

- Base path: `/api`
- Auth: JWT cookie auth with short-lived access cookies and rotating refresh tokens
- Role-based access: invitations and worker account edits are `ADMIN`-only; workpoint, worker assignment, and workpoint attendance admin routes allow `ADMIN` and `LEADER`
- Real-time: Socket.IO with JWT auth and chat events
- File uploads: `/uploads` static (messaging attachments)

## Runtime and environment

- Env loading: `NODE_ENV=development` loads `.env.development`; `NODE_ENV=production` loads `.env.production`; `.env` is a shared fallback if present
- Required env: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, plus either `DATABASE_URL` or the `DB_*` variables needed to build it
- Production should set `FRONTEND_BASE_URL`, `APP_BASE_URL`, and `CORS_ALLOWED_ORIGINS`
- Optional env: `PORT` (default 4000), `ATTENDANCE_TIMEZONE`, `AUTH_COOKIE_SAME_SITE`, SMTP vars for mail
- CORS uses `CORS_ALLOWED_ORIGINS`/`FRONTEND_BASE_URL` and still allows localhost origins outside production
- If the frontend calls the API from a different site in production, set `AUTH_COOKIE_SAME_SITE=none` so auth cookies can be sent cross-site
- Refresh tokens are stored hashed in Postgres

## Errors and validation

- Requests are validated with Zod. When validation is used, handlers receive parsed/coerced values.
- Central error handler returns JSON `{ error: string }` with status code.
- Auth errors: 401, forbidden: 403, not found: 404, conflicts: 409.

## Auth routes

`POST /api/auth/register`
- Body: `{ username, email, password, token? }`
- First user becomes `ADMIN`. Subsequent users must use a valid invitation token.
- Response: `{ id }` and auth cookies set.

`POST /api/auth/login`
- Body: `{ username, password }`
- Response: `{ id }` and auth cookies set.

`POST /api/auth/refresh`
- Rotates the refresh token and sets fresh auth cookies.
- Response: `{ ok: true }`

`POST /api/auth/logout`
- Revokes the active refresh token when possible and clears auth cookies.

## Invitation routes (ADMIN)

`GET /api/invitations`
- Returns `{ invitations: InvitationDTO[] }`

`POST /api/invitations`
- Body: `{ email, role }`
- Sends invitation email with `inviteUrl` (`/register?token=...&email=...`).

`DELETE /api/invitations/:id`
- Revokes an invitation.

InvitationDTO fields:
`{ id, email, role, status, expiresAt, acceptedAt, revokedAt, createdAt, inviteUrl }`

## Attendance routes

User routes:

`POST /api/attendance/checkin`
- Body: `{ qrToken, lat, lng }`
- Returns a scan result for `CHECK_IN`, `CHECK_OUT`, or `ALREADY_COMPLETED`.
- QR attendance enforces the worker's one-time scan location within 100m of the workpoint coordinates; missing workpoint coordinates reject the scan.

`GET /api/attendance/me/daily?year=YYYY&month=M`
`GET /api/attendance/me/monthly?year=YYYY&month=M`

Admin routes:

`GET /api/attendance/workpoint/:id?from=YYYY-MM-DD&to=YYYY-MM-DD`
- Returns list of attendance records.

`POST /api/attendance/workpoint/:id/manual`
- Body: `{ workerId, date: "YYYY-MM-DD", checkedInAt?, checkedOutAt? }`

`PATCH /api/attendance/:id/checkout`
- Body: `{ checkedOutAt: ISO datetime }`

`DELETE /api/attendance/:id`

`GET /api/attendance/workpoint/:id/qr`
- Returns `{ qrToken, qrPng }` for the workpoint.

`POST /api/attendance/workpoint/:id/qr/rotate`
- Rotates QR token and returns `{ qrToken, qrPng }`.

`GET /api/attendance/workpoint/:id/export?from=YYYY-MM-DD&to=YYYY-MM-DD`
- Returns an Excel file with attendance + summary sheets.

## Work point and worker routes

User routes:
`GET /api/workpoints/me`
- Returns workpoints assigned to the current authenticated user.

Admin/leader workpoint routes:
`GET /api/workpoints`
`POST /api/workpoints`
`GET /api/workpoints/:id`
`PUT /api/workpoints/:id`
`DELETE /api/workpoints/:id`

Worker assignment routes:
`GET /api/workers`
`GET /api/workpoints/:id/workers`
`POST /api/workpoints/:id/workers`
`DELETE /api/workpoints/:id/workers/:workerId`
`PUT /api/workers/:workerId`
`DELETE /api/workers/:workerId`

## Messaging routes (authenticated)

`GET /api/messaging/chats`
- List chats for the current user.

`POST /api/messaging/chats/direct`
- Body: `{ userId }`
- Creates or finds a direct chat. Returns `{ chatId }`.

`GET /api/messaging/chats/:chatId/messages?cursor=ISO&limit=1..100`
- Paginates messages; returns `{ messages, nextCursor, hasMore }`.

`POST /api/messaging/chats/:chatId/messages`
- Body: `{ body, replyToId?, attachmentUrl?, attachmentName?, attachmentType?, clientNonce? }`

`POST /api/messaging/chats/:chatId/read`
- Marks chat read.

`POST /api/messaging/chats/:chatId/attachment` (multipart form)
- Field: `file`
- Returns `{ attachmentUrl, attachmentName, attachmentType }`

`GET /api/messaging/users`
- Lists other users for chat creation.

## Socket.IO events

Socket auth uses the access JWT cookie, bearer token, or socket auth token. Unauthenticated sockets are rejected.

Client -> server:
- `message:send` `{ chatId, body, replyToId?, attachmentUrl?, attachmentName?, attachmentType?, clientNonce? }`
- `message:typing` `{ chatId, isTyping }`
- `chat:read` `{ chatId }`
- `chat:join` `{ chatId }`

Server -> client:
- `message:new` (MessagePayload)
- `message:read` `{ chatId, userId, lastReadAt }`
- `chat:bumped` `{ chatId, lastMessageAt }`
- `chat:changed` `{ chatId }`
- `attendance:changed` `{ workPointId, workerId?, attendanceId?, changedAt }`
- `presence:online` `{ userId }`
- `presence:offline` `{ userId }`
- `typing` `{ chatId, userId, isTyping }`


## Maintaining this file

When you discover useful, reusable project information, update this `AGENTS.md` file.

Add information only if it helps future Codex sessions, such as:
- how to run the app
- how to run tests
- project architecture
- important folder conventions
- common commands
- environment/setup notes
- recurring errors and fixes

Do not add temporary task details, secrets, personal notes, or guesses.
Keep updates short and factual.

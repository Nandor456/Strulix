
# BuildPulse API (apps/api)

This is a concise, implementation-accurate guide for the backend so agents do not have to infer behavior.

## Overview

- Base path: `/api`
- Auth: JWT cookie auth with short-lived access cookies and rotating refresh tokens
- Tenancy: each user belongs to exactly one company; authenticated app data is scoped by `companyId`; accepted subcontractor access lets a subcontractor company's `WORKER` and `LEADER` users attend owner-company workpoints without joining that owner company
- Role-based access: invitations, workpoint management, worker/leader account edits, and workpoint attendance operator routes allow `ADMIN` and `LEADER`; attendance time edit routes are `ADMIN`-only; `LEADER` workpoint-scoped access is limited to assigned workpoints, where assignment means the workpoint workers relation or attendance history
- Real-time: Socket.IO with JWT auth and chat events
- File uploads: `/uploads/messaging` is static for messaging attachments; worker documents are stored under `private/worker-documents` and streamed through authenticated `/api/worker-documents/:documentId/file`; workpoint documents are stored under `private/workpoint-documents` and streamed through authenticated `/api/workpoint-documents/:documentId/file`

## Runtime and environment

- Env loading: `NODE_ENV=development` loads `.env.development`; `NODE_ENV=production` loads `.env.production`; `.env` is a shared fallback if present
- Required env: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, plus either `DATABASE_URL` or the `DB_*` variables needed to build it
- Production should set `FRONTEND_BASE_URL`, `APP_BASE_URL`, and `CORS_ALLOWED_ORIGINS`
- Optional env: `PORT` (default 4000), `ATTENDANCE_TIMEZONE`, `AUTH_COOKIE_SAME_SITE`, `FIREBASE_SERVICE_ACCOUNT_JSON`, SMTP vars for mail
- Stripe billing env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `STRIPE_TAX_ENABLED=true`
- CORS uses `CORS_ALLOWED_ORIGINS`/`FRONTEND_BASE_URL` and still allows localhost origins outside production
- If the frontend calls the API from a different site in production, set `AUTH_COOKIE_SAME_SITE=none` so auth cookies can be sent cross-site
- Refresh tokens are stored hashed in Postgres
- Mobile message push notifications use Firebase Admin SDK when `FIREBASE_SERVICE_ACCOUNT_JSON` is set; without it, push sending is skipped

## Errors and validation

- Requests are validated with Zod. When validation is used, handlers receive parsed/coerced values.
- Central error handler returns JSON `{ error: string }` with status code.
- Auth errors: 401, forbidden: 403, not found: 404, conflicts: 409.

## Auth routes

`POST /api/auth/register`
- Body: `{ username, email, password, companyName?, token? }`
- Without `token`, creates a new company and its sole `ADMIN` only outside production; `companyName` is required.
- With `token`, joins the invitation's company as `LEADER` or `WORKER`; `companyName` is ignored.
- Response: `{ id }` and auth cookies set.

`POST /api/auth/login`
- Body: `{ username, password }`
- Response: `{ id }` and auth cookies set.

`POST /api/auth/refresh`
- Rotates the refresh token and sets fresh auth cookies.
- Response: `{ ok: true }`

`POST /api/auth/logout`
- Revokes the active refresh token when possible and clears auth cookies.

`POST /api/auth/forgot-password`
- Body: `{ email }`
- Always returns `{ ok: true }` and sends a password reset email when the address belongs to a user.

`POST /api/auth/reset-password`
- Body: `{ token, password }`
- Consumes a valid reset token, updates the password, and revokes active refresh tokens for that user.

## Billing routes

`POST /api/billing/company-signup/checkout`
- Starts Stripe Checkout for `{ username, email, password, companyName }`.

`POST /api/billing/company-signup/complete`
- Finalizes paid company/admin signup after Checkout with `{ sessionId }` and sets auth cookies.

`POST /api/billing/webhook`
- Stripe webhook endpoint mounted with a raw request body.

`GET /api/billing/status` (ADMIN)
- Returns company billing status and seat counts.

`POST /api/billing/portal` (ADMIN)
- Creates a Stripe Customer Portal session.

Operational write routes return `402 { code: "billing_required" }` unless company billing is `ACTIVE` or `TRIALING`.

## Invitation routes (ADMIN/LEADER)

`GET /api/invitations`
- Returns `{ invitations: InvitationDTO[] }`

`POST /api/invitations`
- Body: `{ email, role }` where role is `WORKER` or `LEADER`; companies cannot invite another `ADMIN`
- Sends invitation email with `inviteUrl` (`/register?token=...&email=...`).

`DELETE /api/invitations/:id`
- Revokes an invitation.

InvitationDTO fields:
`{ id, email, role, status, expiresAt, acceptedAt, revokedAt, createdAt, inviteUrl }`

## Attendance routes

User routes:

`POST /api/attendance/checkin`
- Body: `{ qrToken, lat, lng, monitoringPlatform? }`
- Returns a scan result for `CHECK_IN`, `CHECK_OUT`, or `ALREADY_COMPLETED`, including attendance monitoring metadata when relevant.
- QR attendance is for `WORKER` and `LEADER` users, enforces the user's one-time scan location within 200m of same-company or accepted subcontractor workpoint coordinates, and automatically associates the user with the workpoint on successful scans. Missing workpoint coordinates reject the scan.
- Native mobile check-ins (`ios`/`android`) start hourly attendance location monitoring. Web or unsupported check-ins remain allowed but create a `MONITORING_UNAVAILABLE` review alert instead of auto-closing attendance.

`GET /api/attendance/me/daily?year=YYYY&month=M`
`GET /api/attendance/me/monthly?year=YYYY&month=M`
`GET /api/attendance/me/open`
- Returns the current worker's open attendances with monitoring status and next checkpoint schedule.

`POST /api/attendance/location-checks`
- Body: `{ attendanceId, dueAt, capturedAt, lat, lng }`
- Accepts worker-owned mobile checkpoint samples for active attendance. Hourly due times must align to `checkedInAt + n hours`; outside-radius samples create review alerts and do not auto-checkout the worker.

Admin/leader routes:

`GET /api/attendance/workpoint/:id?from=YYYY-MM-DD&to=YYYY-MM-DD`
- Returns list of attendance records.

`GET /api/attendance/live-follow?limit=5`
- ADMIN aggregate live snapshot for all company workpoints; LEADER sees only assigned workpoints. Includes current open check-ins, latest activity, recent check-in/check-out events, and active/inactive/warning status.

`POST /api/attendance/workpoint/:id/manual`
- Body: `{ workerId, date: "YYYY-MM-DD", checkedInAt?, checkedOutAt? }`
- Manual attendance accepts any same-company `WORKER` or `LEADER` and automatically associates that user with the workpoint after a successful record creation.
- Manual attendance also accepts `WORKER` or `LEADER` users from accepted subcontractor companies; external wages are hidden in owner-company reporting.

`PATCH /api/attendance/:id/checkout` (ADMIN)
- Body: `{ checkedOutAt: ISO datetime }`

`PATCH /api/attendance/:id/times` (ADMIN)
- Body: `{ checkedInAt: ISO datetime, checkedOutAt: ISO datetime | null }`

`DELETE /api/attendance/:id`

`GET /api/attendance/workpoint/:id/qr`
- Returns `{ qrToken, qrPng }` for the workpoint.

`POST /api/attendance/workpoint/:id/qr/rotate`
- Rotates QR token and returns `{ qrToken, qrPng }`.

`GET /api/attendance/workpoint/:id/export?from=YYYY-MM-DD&to=YYYY-MM-DD`
- Returns an Excel file with attendance + summary sheets.

`GET /api/attendance/location-alerts`
- ADMIN lists company alerts; LEADER lists only alerts for assigned/history workpoints. Supports optional status/workpoint filters.

`PATCH /api/attendance/location-alerts/:id/review`
- Body: `{ outcome: "VALID" | "INVALID", note? }`
- Marks an open attendance location alert reviewed by an ADMIN or scoped LEADER.

## Work point and worker routes

User routes:
`GET /api/workpoints/me`
- Returns workpoints associated with the current authenticated user through check-in/manual attendance.

Admin/leader workpoint routes:
`GET /api/workpoints`
`POST /api/workpoints`
`GET /api/workpoints/:id`
`PUT /api/workpoints/:id`
`DELETE /api/workpoints/:id`

Worker roster routes:
`GET /api/workers`
`GET /api/workpoints/:id/workers`
`GET /api/workpoints/:id/attendance-workers`
`PUT /api/workers/:workerId`
`DELETE /api/workers/:workerId`

Worker roster/document routes include both `WORKER` and `LEADER` users; route names and payload fields keep historical `worker` naming for API compatibility.

## Subcontractor routes (ADMIN/LEADER unless noted)

`GET /api/subcontractors`
`POST /api/subcontractors` with `{ invitedAdminEmail }`
`DELETE /api/subcontractors/:id`
`GET /api/subcontractors/incoming` (ADMIN)
`POST /api/subcontractors/accept` (ADMIN) with `{ token }`

Subcontractor invitations target the registered admin email of another company. Accepted access is company-wide for current and future owner-company workpoints; revocation removes subcontractor worker assignments/chat participants but preserves attendance history.

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

## Push notification routes (authenticated)

`POST /api/push/devices`
- Body: `{ token, platform }` where `platform` is `ios` or `android`
- Upserts the current user's FCM device token.

`DELETE /api/push/devices`
- Body: `{ token }`
- Removes the current user's FCM device token.

## Leave request routes

Worker/leader request routes:
- `GET /api/leave-requests/my`
- `POST /api/leave-requests` with `{ type: "VACATION" | "SICK", startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD" }`
- `DELETE /api/leave-requests/:id` cancels the current user's own `PENDING` request.

Admin/leader review routes:
- `GET /api/leave-requests`
- `PATCH /api/leave-requests/:id/approve`
- `PATCH /api/leave-requests/:id/reject`

Leave requests reject past dates, reversed ranges, self-review, and overlaps with the same user's `PENDING` or `APPROVED` requests.

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
- `attendance-location-alert:changed` `{ alertId, attendanceId, workPointId, workerId, type, status, changedAt }`
- `leave-request:changed` `{ action, leaveRequest, changedAt }`
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

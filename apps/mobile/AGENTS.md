# BuildPulse Mobile (apps/mobile)

## Overview

- Framework: Flutter app using Material 3
- Entry: `lib/main.dart` creates `ApiClient`, `BuildPulseApi`, `AuthController`, `MessagingController`, `PushNotificationsController`, `ThemeController`, and `LanguageController`, then injects app state through `AppScope`
- Routing: `go_router` in `lib/core/app_router.dart`
- Feature folders under `lib/`: `auth`, `attendance`, `documents`, `invitations`, `messaging`, `worker_home`, `workers`, `workpoints`
- Shared app infrastructure lives under `lib/core/`
- Mobile localization lives in `lib/core/i18n.dart`; prefer `context.l10n.t(...)` for user-facing copy and keep formatter locale sync through `configureFormatters(...)`

## API and auth

- API base URL comes from `.env.{mode}.{platform}` via `flutter_dotenv` and falls back to `http://localhost:4000/api`
- Debug/profile loads `.env.dev.{platform}`; release loads `.env.prod.{platform}`
- Android emulators should usually use `http://10.0.2.2:4000/api` in `.env.dev.android`
- `ApiClient` uses Dio with persisted cookies, automatically attempts `/auth/refresh` on one unauthorized response, and clears cookies if refresh fails
- Relative `/uploads/...` URLs are resolved against the API origin in `lib/core/app_config.dart`
- Message push notifications use Firebase Cloud Messaging on iOS/Android; add platform Firebase config files before production builds
- Worker QR attendance uses `mobile_scanner` for camera scanning and `geolocator` for a one-time current location sent with `/attendance/checkin`; do not add background location tracking

## Commands

- `flutter run`
- `flutter analyze`
- `flutter test`

## Conventions

- Prefer adding shared models, formatters, widgets, config, and API helpers under `lib/core/`
- Keep feature-specific UI and controllers inside the matching feature folder under `lib/`
- Do not edit generated or ephemeral directories such as `.dart_tool/` or `build/`

## Maintaining this file

When mobile-specific setup, commands, architecture, routing, or folder conventions change, update this file in the same task so future Codex sessions stay accurate.

Keep updates short, factual, and reusable. Do not add temporary notes, guesses, or secrets.

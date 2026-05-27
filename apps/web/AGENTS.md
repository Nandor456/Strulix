# BuildPulse Web (apps/web)

## Overview

- Framework: React 19 + Vite + TypeScript (ESM)
- Styling: Tailwind CSS v4 via @tailwindcss/vite in vite.config.ts
- Entry: src/main.tsx mounts App into #root, imports src/index.css, and wraps the app with `I18nProvider`, `ThemeProvider`, `TooltipProvider`, `AuthProvider`, and `MessagingSocketProvider`
- API access defaults to same-origin `/api` in the browser; Vite proxies `/api`, `/socket.io`, and `/uploads` to the backend in dev
- Env loading: Vite mode files are used normally (`.env.development`, `.env.production`); `VITE_API_PROXY_TARGET` is read in `vite.config.ts` and `VITE_API_BASE_URL` is read in browser code
- Worker QR attendance uses `@zxing/browser` for camera scanning and the browser Geolocation API for a one-time scan location; production needs HTTPS for camera/geolocation
- Web localization lives in `src/lib/i18n.ts` and `src/context/i18n-context.ts`; use `useI18n()` for copy/labels and `src/lib/format.ts` for locale-aware date, money, and size formatting
- Leave calendar lives at `/leave-calendar`; WORKER and LEADER can create requests, ADMIN and LEADER can review requests; live updates come through the existing socket provider via `leave-request:changed`

## Commands

- npm run dev: start Vite dev server (default port 5173)
- npm run build: type-check and build
- npm run preview: preview production build
- npm run lint: run ESLint


## Maintaining this file

Add only stable, reusable frontend details (architecture, conventions, commands).
Avoid temporary notes, guesses, or secrets.

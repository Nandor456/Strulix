# BuildPulse Web (apps/web)

## Overview

- Framework: React 19 + Vite + TypeScript (ESM)
- Styling: Tailwind CSS v4 via @tailwindcss/vite in vite.config.ts
- Entry: src/main.tsx mounts App into #root, imports src/index.css, and wraps the app with `I18nProvider`, `ThemeProvider`, `TooltipProvider`, `AuthProvider`, and `MessagingSocketProvider`
- Unauthenticated `/` shows the public landing page; `/register` allows direct unpaid company signup in development and is invite-only in production unless using paid signup at `/register?paid=1`; paid company signup completes at `/register/success?session_id=...`
- API access defaults to same-origin `/api` in the browser; Vite proxies `/api`, `/socket.io`, and `/uploads` to the backend in dev
- Env loading: Vite mode files are used normally (`.env.development`, `.env.production`); `VITE_API_PROXY_TARGET` is read in `vite.config.ts` and `VITE_API_BASE_URL` is read in browser code
- Public landing includes a Stripe signup CTA; `VITE_REQUEST_ACCESS_URL` is still available for request-access links
- Authenticated user settings live at `/settings`; admin billing management is inside Settings, while `/billing` redirects there for older links
- Worker QR attendance uses `@zxing/browser` for camera scanning and the browser Geolocation API for a one-time scan location; production needs HTTPS for camera/geolocation
- Cloudflare Pages deploys should use root `apps/web`, build command `npm run build`, output directory `dist`; explicit SPA route rewrites live in `public/_redirects`
- Web localization lives in `src/lib/i18n.ts` and `src/context/i18n-context.ts`; use `useI18n()` for copy/labels and `src/lib/format.ts` for locale-aware date, money, and size formatting
- Leave calendar lives at `/leave-calendar`; WORKER and LEADER can create requests, ADMIN and LEADER can review requests; live updates come through the existing socket provider via `leave-request:changed`
- Live Follow lives at `/live-follow` with a fullscreen TV route at `/live-follow/display`; ADMIN and LEADER only; attendance changes refresh through the existing socket provider plus polling fallback

## Commands

- npm run dev: start Vite dev server (default port 5173)
- npm run build: type-check and build
- npm run deploy:pages: build and deploy the `dist` output to Cloudflare Pages production (`main`) with Wrangler
- npm run preview: preview production build
- npm run lint: run ESLint


## Maintaining this file

Add only stable, reusable frontend details (architecture, conventions, commands).
Avoid temporary notes, guesses, or secrets.

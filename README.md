# ContentFlow

Flutter product app for the ContentFlow content pipeline.

The target architecture is:
- `Flutter` for the product UI
- `FastAPI` for the backend runtime
- `Clerk` for authentication
- existing database reused as the single source of truth
- `Astro` for marketing pages only

## Current Status

The migration away from the legacy JavaScript runtime is advanced but not fully finished.

What is already in place:
- real Clerk auth screen in Flutter
- Clerk session restore and bootstrap-driven entry gate
- website-driven web login handoff via `contentflow_site -> contentflow_lab -> contentflow_app`
- FastAPI-backed `projects`, `settings`, `creator-profile`, `personas`, and content/status flows
- real onboarding path that creates a workspace in FastAPI
- explicit demo mode separated from the authenticated flow
- centralized `401` handling instead of silent private-route mock fallbacks

What still blocks deleting the JavaScript app/runtime:
- real runtime verification of the Clerk flow is still pending
- OAuth channel connection flow is not finished
- publish metadata persistence is not finished in the backend
- Next.js decommission has not been validated end-to-end yet

## Product Flow

The intended entry gate is now:
- signed out -> Clerk auth
- signed in + no workspace -> onboarding
- signed in + workspace exists -> feed/dashboard

The decision should come from:
- a valid Clerk session
- real FastAPI bootstrap data

## Quick Start

Requirements:
- Flutter SDK available at `/home/claude/.flutter-sdk/bin/flutter` or on `PATH`
- Node.js to serve the built web app
- FastAPI backend running at `API_BASE_URL`

Run the web app with PM2/build script:

```bash
API_BASE_URL=https://api.winflowz.com \
CLERK_PUBLISHABLE_KEY=pk_test_xxx \
APP_SITE_URL=https://contentflow.winflowz.com \
APP_WEB_URL=https://app.contentflow.winflowz.com \
./pm2-web.sh
```

Build manually:

```bash
API_BASE_URL=https://api.winflowz.com \
CLERK_PUBLISHABLE_KEY=pk_test_xxx \
APP_SITE_URL=https://contentflow.winflowz.com \
APP_WEB_URL=https://app.contentflow.winflowz.com \
./build.sh
```

Build and serve locally:

```bash
API_BASE_URL=https://api.winflowz.com \
CLERK_PUBLISHABLE_KEY=pk_test_xxx \
APP_SITE_URL=https://contentflow.winflowz.com \
APP_WEB_URL=https://app.contentflow.winflowz.com \
./build.sh --serve
```

The static server serves `build/web` on port `3050` by default.

## Vercel Build

Vercel now builds the Flutter web bundle directly from this repo.

Required Vercel environment variables:

- `API_BASE_URL`
- `CLERK_PUBLISHABLE_KEY`
- `APP_SITE_URL`
- `APP_WEB_URL`

The Vercel project uses:

- [vercel.json](vercel.json)
- [scripts/vercel-install.sh](scripts/vercel-install.sh)
- [scripts/vercel-build.sh](scripts/vercel-build.sh)

`installCommand` downloads the Flutter SDK in the Vercel build environment and enables web support. `buildCommand` then runs `flutter build web` and injects `API_BASE_URL`, `CLERK_PUBLISHABLE_KEY`, `APP_SITE_URL`, and `APP_WEB_URL` through `--dart-define`.

If Doppler is connected to Vercel, those variables must be exposed to the Vercel build for the target environment. The Clerk publishable key is intentionally compiled into the frontend bundle.

Clerk runtime validation with optional Eruda console:

```bash
API_BASE_URL=https://api.winflowz.com \
CLERK_PUBLISHABLE_KEY=pk_test_xxx \
APP_SITE_URL=https://contentflow.winflowz.com \
APP_WEB_URL=https://app.contentflow.winflowz.com \
PORT=3050 \
./scripts/validate-clerk-runtime.sh
```

Then open `http://localhost:3050/entry?eruda=1` once to enable Eruda in the browser.

## Environment Variables

- `API_BASE_URL`
  FastAPI base URL injected into Flutter with `--dart-define`
- `CLERK_PUBLISHABLE_KEY`
  Clerk publishable key injected into Flutter with `--dart-define`
- `APP_SITE_URL`
  Marketing/auth website URL used by Flutter web for sign-in redirects
- `APP_WEB_URL`
  Public Flutter web URL used by the website handoff flow
- `PORT`
  Port used by `server.js` / `pm2-web.sh` / `build.sh --serve`

## Project Structure

- `lib/`
  Flutter application code
- `lib/providers/`
  Riverpod state: auth, bootstrap, settings, personas, content
- `lib/data/services/`
  FastAPI + Clerk integration
- `lib/presentation/screens/`
  Product screens: entry, auth, onboarding, feed, editor, settings, ritual, personas, angles
- `specs/`
  migration and integration specs
- `build.sh`
  web build helper
- `pm2-web.sh`
  build + serve helper for PM2/runtime usage
- `server.js`
  static SPA server for the Flutter web build

## Development Notes

- The app still supports a fixed demo workspace for product walkthroughs.
- Do not treat demo mode as the source of truth for authenticated users.
- Do not delete the legacy JavaScript app yet. The Flutter/FastAPI path is close, but final runtime validation is still pending.

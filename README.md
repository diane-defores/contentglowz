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
- ClerkJS web sign-in routes on the app domain (`/sign-in`, `/sso-callback`)
- Clerk session restore and bootstrap-driven entry gate
- FastAPI-backed `projects`, `settings`, `creator-profile`, `personas`, and content/status flows
- real onboarding path that creates a workspace in FastAPI
- degraded/offline mode with persisted cache, replay queue, and temp-ID reconciliation for supported flows
- explicit demo mode separated from the authenticated flow
- centralized `401` handling instead of silent private-route mock fallbacks

What still blocks deleting the JavaScript app/runtime:
- full runtime verification of the new ClerkJS web path is still pending
- native auth remains intentionally disabled until Clerk ships a stable Flutter SDK
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

## Offline / Degraded Mode

When FastAPI is unavailable, the app no longer kicks the user back to the entry screen.

What happens instead:
- the authenticated app shell stays accessible
- reads fall back to the last persisted cache when available
- stale data is surfaced through the global banner and Uptime screen
- supported backend mutations are queued locally and replayed automatically when FastAPI returns
- supported offline creates use temporary local IDs that are reconciled to real backend IDs after replay
- queued actions can be held in a dependency-wait state until an upstream temp-ID create has been reconciled
- list surfaces show sync status badges for supported entities:
  `Pending sync`, `Retrying sync`, `Sync paused`, `Waiting for dependency`, `Sync failed`

Persisted local stores:
- `offline_cache_v1` for read-through cached backend responses
- `offline_queue_v1` for queued backend mutations
- `offline_id_mappings_v1` for `tempId -> realId` reconciliation

Currently supported offline writes:
- projects: create, update
- settings: update, including `defaultProjectId`
- creator profile: save
- content: create from angle fallback, update, save body, transition, schedule
- personas: create, update
- affiliations: create, update
- ideas: update
- drip plans: create, update, schedule, activate, pause, resume, cancel
- text feedback: submit and review actions already covered by the queue layer

Currently blocked offline:
- publish actions to external platforms
- audio uploads / binary uploads
- destructive deletes
- drip import / cluster / execute-tick
- server-first flows that do not have a safe local representation yet

Notes:
- `dispatch-pipeline` itself is not replayed offline; the angles flow falls back to creating a local content record that enters the review queue.
- queue replay is triggered on app startup, when app access checks run again after startup, and on demand from the Uptime screen.
- queue entries blocked by unresolved dependencies stay local until the required `tempId -> realId` mapping exists.
- `401/403` pauses replay until the user signs in again.
- validation/business `4xx` errors move queued actions to manual review.
- Drip reads now only fallback to cache for real offline connectivity failures so malformed backend payloads stay visible.

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
FEEDBACK_ADMIN_EMAILS=admin@contentflow.app \
./pm2-web.sh
```

Build manually:

```bash
API_BASE_URL=https://api.winflowz.com \
CLERK_PUBLISHABLE_KEY=pk_test_xxx \
APP_SITE_URL=https://contentflow.winflowz.com \
APP_WEB_URL=https://app.contentflow.winflowz.com \
FEEDBACK_ADMIN_EMAILS=admin@contentflow.app \
./build.sh
```

Build and serve locally:

```bash
API_BASE_URL=https://api.winflowz.com \
CLERK_PUBLISHABLE_KEY=pk_test_xxx \
APP_SITE_URL=https://contentflow.winflowz.com \
APP_WEB_URL=https://app.contentflow.winflowz.com \
FEEDBACK_ADMIN_EMAILS=admin@contentflow.app \
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
- `FEEDBACK_ADMIN_EMAILS` (optional)

The Vercel project uses:

- [vercel.json](vercel.json)
- [scripts/vercel-install.sh](scripts/vercel-install.sh)
- [scripts/vercel-build.sh](scripts/vercel-build.sh)

`installCommand` downloads the Flutter SDK in the Vercel build environment and enables web support. `buildCommand` then runs `flutter build web` and injects `API_BASE_URL`, `CLERK_PUBLISHABLE_KEY`, `APP_SITE_URL`, `APP_WEB_URL`, and `FEEDBACK_ADMIN_EMAILS` through `--dart-define`.

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
  Marketing website URL kept for non-auth links and historical diagnostics
- `APP_WEB_URL`
  Public app URL used by the dedicated ClerkJS auth routes
- `FEEDBACK_ADMIN_EMAILS` (optional)
  Comma-separated allowlist compiled into the frontend only to show the feedback admin entry point
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
  migration, integration, and offline sync specs
- `build.sh`
  web build helper
- `pm2-web.sh`
  build + serve helper for PM2/runtime usage
- `server.js`
  static SPA server for the Flutter web build
- `web_auth/`
  ClerkJS auth pages and shared runtime copied into `build/web` after each build

## Development Notes

- The app still supports a fixed demo workspace for product walkthroughs.
- Do not treat demo mode as the source of truth for authenticated users.
- The legacy Clerk Flutter beta path has been archived to branch `legacy/clerk-flutter-beta-auth`.
- Offline sync reference: `specs/SPEC-offline-sync-v2.md`

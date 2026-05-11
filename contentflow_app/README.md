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
- ClerkJS web auth routes on the app domain (`/sign-in`, `/sign-up`, `/sso-callback`)
- Clerk session restore and bootstrap-driven entry gate
- FastAPI-backed `projects`, `settings`, `creator-profile`, `personas`, and content/status flows
- real onboarding path that creates a workspace in FastAPI
- multi-project UI with a dedicated `Projects` screen and a global current-project switcher
- degraded/offline mode with persisted cache, replay queue, and temp-ID reconciliation for supported flows
- explicit demo mode separated from the authenticated flow
- centralized `401` handling instead of silent private-route mock fallbacks

What still blocks deleting the JavaScript app/runtime:
- full runtime verification of the new ClerkJS web path is still pending
- native auth remains intentionally disabled until Clerk ships a stable Flutter SDK
- Next.js decommission has not been validated end-to-end yet

## Product Flow

The intended entry gate is now:
- signed out -> Clerk auth
- signed in + no workspace -> onboarding
- signed in + workspace exists -> feed/dashboard

The decision should come from:
- a valid Clerk session
- real FastAPI bootstrap data
- project selection settings persisted in `settings.projectSelectionMode` and `settings.defaultProjectId`

## Multi-Project Behavior

- The app resolves active project through a tri-state selection mode:
  - `auto`: prefer `defaultProjectId`, then fallback to the first active project
  - `selected`: only use `defaultProjectId` (no fallback)
  - `none`: intentionally no active project
- This state is persisted through `PATCH /api/settings` on `projectSelectionMode` + `defaultProjectId`.
- The `Projects` screen is the canonical place to:
  - list all projects
  - switch the current project
  - create a project
  - edit a project
  - archive/unarchive projects
- The project UI also surfaces backend-detected repository information when available:
  - framework detection
  - onboarding/analyze status
  - detected content directories
  - configured content/SEO/linking sources from backend settings

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
- settings: update, including `defaultProjectId` and `projectSelectionMode`
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
- capture media uploads / synced screen-capture library
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

## Android Device Capture

The Android app includes a local-only Capture surface for creator assets:
- screenshot capture saves a PNG in app-scoped storage
- screen recording saves an MP4 in app-scoped storage
- every capture asks for Android MediaProjection consent
- recording runs through a visible foreground service and stops at 5 minutes
- microphone audio is optional and off by default
- local captures can be previewed, discarded, or shared/exported by the user
- local captures can be linked to a content draft or attached to pending content
- backend asset records store metadata only (`local_only`) and never store Android local file paths

V1 does not upload capture files or replay binary uploads offline. The backend contract can track a local-only asset relationship for content, with `storage_uri` reserved for future cloud upload work. Web, iOS, internal audio capture, gallery save, trimming, and cloud sync are follow-up scopes.

Android-specific requirements:
- `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PROJECTION`, and `POST_NOTIFICATIONS` are required for the recording service path.
- `FOREGROUND_SERVICE_MICROPHONE` and `RECORD_AUDIO` are used only when the user enables microphone audio.
- Protected third-party screens can render black or partial captures when Android or the source app blocks capture.
- Android 14+ uses a fresh MediaProjection consent/token for every screenshot or recording session.
- When creating content from a capture, the app creates a manual content draft and links capture metadata to that content when FastAPI is reachable.

## Zernio / LATE Publishing

Publishing is server-owned and project-scoped:
- FastAPI reads `ZERNIO_API_KEY` or legacy `LATE_API_KEY` server-side only.
- Flutter never receives or sends a Zernio API key or `profileId`.
- Each ContentFlow project maps to a server-persisted Zernio profile.
- Connected accounts are stored as `ProjectPublishAccount` rows scoped to `userId + projectId + provider + platform + providerAccountId`.
- `/api/publish/accounts`, `/api/publish/connect/{platform}`, and `/api/publish/accounts/{account_id}` require `project_id`.
- `POST /api/publish` requires an owned `content_record_id` and validates every selected account mapping before calling Zernio.

Supported direct publish channels in this app are Twitter/X, LinkedIn, Instagram, YouTube, and TikTok. WordPress and Ghost remain excluded from Zernio auto-publish in this release and must show a clear unsupported-state message.

Manual verification checklist:
- Set `ZERNIO_API_KEY` on the FastAPI server.
- Create two projects for the same signed-in user.
- Connect a social account from Settings while Project A is active.
- Confirm Project B does not list or use Project A's account.
- Approve a publishable item and verify `ContentRecord.metadata.publish` includes `providerPostId`, `publishStatus`, `platformResults`, and recoverable error details for `partial` or `failed`.
- Try a forged `account_id` and confirm the backend returns `403` before any Zernio call.

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
- `SENTRY_DSN` (optional)
- `SENTRY_ENVIRONMENT` (optional)
- `SENTRY_RELEASE` (optional)
- `SENTRY_TRACES_SAMPLE_RATE` (optional, defaults to `0.0`)
- `SENTRY_SEND_DEFAULT_PII` (optional, defaults to `false`)
- `SENTRY_DEBUG` (optional, defaults to `false`)
- `FEEDBACK_ADMIN_EMAILS` (optional)

The Vercel project uses:

- [vercel.json](vercel.json)
- [scripts/vercel-install.sh](scripts/vercel-install.sh)
- [scripts/vercel-build.sh](scripts/vercel-build.sh)

`installCommand` downloads the Flutter SDK in the Vercel build environment and enables web support. `buildCommand` then runs `flutter build web` and injects `API_BASE_URL`, `CLERK_PUBLISHABLE_KEY`, `APP_SITE_URL`, `APP_WEB_URL`, build metadata, and Sentry settings through `--dart-define`.

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
- `SENTRY_DSN` (optional)
  Public Sentry DSN compiled into Flutter. When empty, Sentry stays disabled.
- `SENTRY_ENVIRONMENT` (optional)
  Sentry environment name. Defaults to the build environment.
- `SENTRY_RELEASE` (optional)
  Sentry release name. Defaults to `contentflow_app@BUILD_COMMIT_SHA` when omitted and a commit is available.
- `SENTRY_TRACES_SAMPLE_RATE` (optional)
  Transaction sample rate from `0.0` to `1.0`. Defaults to `0.0`.
- `SENTRY_SEND_DEFAULT_PII` (optional)
  Whether to send default PII to Sentry. Defaults to `false`.
- `SENTRY_DEBUG` (optional)
  Enables Sentry SDK debug logging during local troubleshooting. Defaults to `false`.
- `FEEDBACK_ADMIN_EMAILS` (optional)
  Comma-separated allowlist compiled into the frontend only to show the feedback admin entry point
- `ZERNIO_API_KEY` / `LATE_API_KEY`
  Server-only FastAPI secret for Zernio publishing. Never expose it to Flutter or Vercel frontend build defines.
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

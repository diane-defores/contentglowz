# ContentFlow Lab

Backend platform for ContentFlow, centered on FastAPI services and AI automation pipelines for content strategy, scheduling, analytics, and delivery support.

This repository hosts the product API used by:

- `contentflow_app` (Flutter application),
- `contentflow_site` (landing pages + auth handoff flow),
- internal research and operations tooling.

## Architecture

- FastAPI app in `api/` with domain routers (`/api/*` and `/a/*` for public analytics),
- AI/agent layer in `agents/` (CrewAI + PydanticAI),
- scheduler/service layer in `scheduler/`,
- persistence in Turso/SQLite-backed stores (`api/services/*`, `status/*`, `data/*`),
- dashboard/chat integrations where present in the repo (`chatbot/` may be optional per deployment profile).

## Backend Services and Domains

- Project/workspace CRUD and settings (`projects`, `settings`, `creator_profile`, `personas`, `idea_pool`, etc.)
- Content and editorial workflows (`content`, `drip`, `runs`, `templates`, `feedback`)
- SEO and research (`mesh`, `research`, `reels`, `psychology`)
- Statusing and observability (`status`, `analytics`, logs, jobs, cost)
- Auth/session exchange endpoints for Clerk web handoff (`/api/auth/web/*`, `/api/webhooks/clerk`)

## Quick Start

1. Install dependencies: `pip install -r requirements.lock`
2. Configure secrets with Doppler or `.env` fallback:
   - `doppler login`
   - `doppler setup` (`contentflow` project + `dev`)
3. Start API with Doppler:
   - `doppler run -- uvicorn api.main:app --reload --port 8000`
4. Health check:
   - `curl http://localhost:8000/health`
5. Open docs:
   - Swagger: `http://localhost:8000/docs`
   - Redoc: `http://localhost:8000/redoc`

## Deployment and Runtime Notes

- `api/main.py` includes startup/shutdown lifecycle hooks and background scheduler initialization.
- Sentry is initialized at API import time when `SENTRY_DSN` is set. `SENTRY_SEND_DEFAULT_PII` defaults to `false`, `SENTRY_TRACES_SAMPLE_RATE` defaults to `0.0`, and `/health` exposes only redacted Sentry status (`configured`, environment, release, dist).
- CORS and authentication middleware are configured for Flutter/site/dashboard clients.
- `render.yaml` and `ecosystem.config.cjs` are used for hosted/manual runtime setups.

## Google Search Console OAuth Setup

- Required env vars:
  - `GOOGLE_OAUTH_CLIENT_ID`
  - `GOOGLE_OAUTH_CLIENT_SECRET`
  - `GOOGLE_OAUTH_REDIRECT_URI` (optional override; fallback is router callback URL)
- Enable Google Search Console API in your Google Cloud project.
- Configure OAuth consent screen and add the callback:
  - `/api/search-console/oauth/callback`
- Search Console tokens are encrypted at rest and never returned by API responses.

## Recent API Direction

Primary concern of this repo is service reliability:

- startup resilience (`lifespan` startup checks, idempotent schema creation),
- background job cadence (`scheduler_service`),
- schema and migration safety (`idempotent ensure_*` calls on startup),
- secure handoff paths for web auth sessions used by the app entry flow.

## Unified Project Asset Library

Project assets are a backend-owned, project-scoped inventory for editor and
generation workflows. This is not a public DAM, marketplace, arbitrary URL
importer, or free provider playground.

Current backend routes are under `/api/projects/{project_id}/assets`:

- `GET /` lists owned project assets with supported filters (`media_kind`,
  `source`, `include_tombstoned`, `limit`, `offset`).
- `GET /{asset_id}` returns one owned asset with a client-safe
  `storage_descriptor`; raw `storage_uri` is not returned as client authority.
- `GET /{asset_id}/usage` returns active usage links.
- `GET /{asset_id}/events` returns the asset audit/history stream.
- `POST /{asset_id}/eligibility` checks whether a guided action can use an
  asset without mutating usage state.
- `POST /{asset_id}/select` creates a usage link after server-side asset and
  target ownership validation.
- `POST /{asset_id}/primary` creates a primary usage link and clears previous
  primary state for the same target and placement.
- `POST /clear-primary` clears primary state for a target and placement.
- `POST /{asset_id}/preview-refresh` returns a refreshed safe descriptor for
  the asset; it does not sign or upload binaries.
- `POST /{asset_id}/tombstone` blocks future reuse while preserving history.
- `POST /{asset_id}/restore` restores a tombstoned asset within the retained
  metadata window.
- `GET /cleanup-report` reports tombstones eligible for cleanup, degraded
  assets, and active assets missing storage metadata. Physical deletion is not
  enabled by default.

Security and retention rules:

- Every route requires Clerk auth and project ownership.
- Asset selection validates both the asset and target server-side before
  mutation; Flutter state is not a permission boundary.
- `local_only`, degraded, tombstoned, stale, foreign, or provider-temporary
  assets cannot be selected for publish/render/reference actions.
- Tombstoned assets keep readable provenance for the 30-day history window and
  are hidden from default list calls.
- Storage descriptors redact signed query tokens and provider URLs. Bunny
  upload/delete/signing remains owned by upload or media-generation features.

## AI Asset Understanding Guardrails

Asset understanding/tagging is asynchronous and suggestion-only. It helps users
find media; it does not auto-publish, auto-clear rights, or replace editor
decisions.

Setup and provider rules:

- BYOK is resolved first (user credential store), then optional platform
  fallback (`GEMINI_API_KEY` / `OPENAI_API_KEY`) when enabled.
- If no credential is available, jobs return `provider_not_configured` and
  assets stay usable without AI tags.
- `ffprobe`/`ffmpeg` should be available on workers for deterministic media
  inspection (duration/dimensions/audio presence, bounded sampling plans).

Default operational guardrails (env-overridable):

- `ASSET_UNDERSTANDING_MAX_IMAGE_BYTES` (25 MB),
- `ASSET_UNDERSTANDING_MAX_SOURCE_VIDEO_BYTES` (500 MB),
- `ASSET_UNDERSTANDING_MAX_SOURCE_VIDEO_SECONDS` (1800s),
- `ASSET_UNDERSTANDING_MAX_PROVIDER_VIDEO_SECONDS` (90s),
- `ASSET_UNDERSTANDING_MAX_PROVIDER_FRAMES` (180),
- `ASSET_UNDERSTANDING_MAX_AUDIO_SECONDS` (120s),
- `ASSET_UNDERSTANDING_CONCURRENCY_PER_PROJECT` (2),
- `ASSET_UNDERSTANDING_CONCURRENCY_PER_USER` (4),
- `ASSET_UNDERSTANDING_DAILY_PLATFORM_QUOTA_IMAGES/VIDEOS` (100/25),
- `ASSET_UNDERSTANDING_DAILY_BYOK_QUOTA_IMAGES/VIDEOS` (250/50).

Privacy, retention, and attribution:

- Treat software-demo media as potentially sensitive (PII/tokens/customer UI).
- Keep durable metadata minimal; avoid storing raw OCR dumps, full transcripts,
  and provider raw payloads as user-facing truth.
- Preserve attribution for external/social assets (`source_attribution`,
  creator/url/credit text). Unknown rights must surface warnings.
- AI tags are suggestions until user acceptance; low-confidence tags should not
  dominate recommendations.

## Image Robot AI Generation

Image Robot supports guided AI image generation through Black Forest Labs FLUX
without adding a free-form playground. The entrypoint remains the existing
profile workflow:

- `POST /api/images/generate-from-profile` accepts `image_provider=flux` via a
  system or custom profile and queues an async generation.
- Built-in Flux profiles cover blog hero, article section, social card, and
  thumbnail placements.
- `GET /api/images/generations?project_id=...` lists durable AI generation
  history; `GET /api/images/generations/{id}` returns one record.
- `GET/POST/PATCH/DELETE /api/images/references` manages approved project visual
  references. Flux receives only same-project approved references, capped at 8.
- Successful Flux outputs are downloaded from BFL's temporary signed result URL,
  uploaded to Bunny CDN, persisted in `ImageGeneration`, and registered as
  project assets with source `image_robot`.

Required environment:

- `BFL_API_KEY`
- optional `BFL_IMAGE_MODEL` (default `flux-2-pro`)
- optional `BFL_API_BASE_URL` (default `https://api.bfl.ai/v1`)
- optional `BFL_SAFETY_TOLERANCE` (default `2`, server-side only)

The startup lifecycle ensures `ImageGeneration` and `ImageReference` tables when
Turso is configured. If FLUX or Turso is not configured, the API returns an
explicit error instead of falling back to Robolly/OpenAI.

## Project Selection Contract

- Active project selection for a signed-in user is persisted in:
  - `UserSettings.projectSelectionMode` (`auto` | `selected` | `none`)
  - `UserSettings.defaultProjectId`
- `GET /api/me` and `GET /api/bootstrap` resolve project context from that pair:
  - `none` => no default project returned
  - `selected` => only the explicit `defaultProjectId` if it is still active
  - `auto` => explicit default first, then fallback to first active project
- `Project.isDefault` may still exist in stored rows for backward compatibility, but it is no longer treated as the source of truth for Flutter routing.
- Project create/update payloads now use canonical `source_url` (legacy `github_url`/`url` aliases remain accepted).
- Supported project routes used by the app:
  - `GET /api/projects`
  - `POST /api/projects`
  - `GET /api/projects/{id}`
  - `PATCH /api/projects/{id}`
  - `POST /api/projects/{id}/archive`
  - `POST /api/projects/{id}/unarchive`
  - `DELETE /api/projects/{id}`
  - `POST /api/projects/onboard`
  - `POST /api/projects/{id}/analyze`
  - `POST /api/projects/{id}/confirm`
- `DELETE /api/projects/{id}` now marks rows as deleted (`deletedAt`) rather than physically removing them.

## Project Analysis Data Exposed To Clients

- Project responses include `settings` with detected repo information when available:
  - `tech_stack`
  - `content_directories`
  - `config_overrides`
  - `onboarding_status`
  - `analytics_enabled`
- Flutter can use this to show detected framework, content folders, and configured content/SEO/linking sources without reimplementing repository analysis locally.

## Repository Pointers

- `api/` — API entry and route modules
- `api/routers/` — all FastAPI endpoints
- `api/services/` — domain/service/business logic
- `status/` — lifecycle, cost, and audit primitives
- `agents/` — CrewAI/PydanticAI pipelines
- `scheduler/` — periodic tasks and execution control
- `scripts/` — utilities for environment/setup flows
- `tests/` — validation scripts and unit coverage

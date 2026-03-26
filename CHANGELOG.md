# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog.

## [0.5.0] - 2026-03-26 — Unified Content Pipeline

### Added
- **Idea Pool** (backend): new SQLite table + CRUD API `/api/ideas` for aggregating content ideas from all sources (newsletters, SEO keywords, weekly ritual, competitor watch).
- **Source ingestion** (backend): `ingest_newsletter_inbox()` reads emails via IMAP, `ingest_seo_keywords()` generates keywords via Advertools, `ingest_weekly_ritual()` converts ritual entries — all feed the Idea Pool.
- **Enriched Angle Generation** (backend): Angle Strategist now accepts `seo_signals` and `trending_signals`, returns `priority_score` and `seo_keyword` per angle.
- **Pipeline Dispatch** (backend): `POST /api/psychology/dispatch-pipeline` replaces the static `render-extract` placeholder with real async content generation.
- **Short Content Agent** (backend): new CrewAI agent for TikTok/Reels/YouTube Shorts — generates hook, timed script, hashtags, CTA, visual notes.
- **Social Post Agent** (backend): new CrewAI agent for Twitter/LinkedIn/Instagram — generates platform-adapted posts with thread support.
- **Scheduler jobs** (backend): implemented `_run_seo_job`, `_run_article_job` (were stubs), added `_run_short_job`, `_run_social_job`, `_run_ingest_newsletters`, `_run_ingest_seo`.
- **Content Frequency Config** (backend + Flutter): user sets blog/month, newsletters/week, shorts/day, social/day — scheduler auto-creates jobs to match.
- **ContentType.short** in Flutter enum with parser, serializer, icon, and theme color.
- **Format-specific metadata** in Flutter: content cards and editor show SEO keyword, platform, duration, hashtags, narrative thread depending on content type.
- **Settings: Content Frequency section** with sliders for each format.
- Spec document: `specs/SPEC-content-pipeline-unification.md`.
- Flutter repo initialized and pushed to GitHub (`dianedef/my-robots-app`).

### Changed
- Angles screen now calls `POST /api/psychology/dispatch-pipeline` for real content generation (with fallback to old `createContentFromAngle`).
- `ApiService`: added `dispatchPipeline()` and `getPipelineStatus()` methods.
- Backend enums extended: `ContentType.SHORT`, `ContentType.SOCIAL_POST`, `SourceRobot.SHORT`, `SourceRobot.SOCIAL`.
- `render-extract` endpoint marked as deprecated.

### Removed
- Legacy Next.js chatbot (41 MB) — frontend fully replaced by Flutter.
- 5 empty/unused v0 prototypes and brainstorm directories.
- BMAD framework files.
- Root `package-lock.json`, `ecosystem.config.cjs` symlink, `SPEC-chatbot.md`, `SPEC-features.md`.

## [0.4.0] - 2026-03-25 — Auth & Workspace Migration

### Added
- FastAPI Clerk auth foundation with authenticated `/api/me` and `/api/bootstrap` endpoints.
- FastAPI user data endpoints for `/api/settings`, `/api/creator-profile`, and `/api/personas`.
- Shared ownership helpers in FastAPI for project-scoped content access.
- Flutter session and bootstrap models to route through a single auth/bootstrap layer.
- Headless Clerk auth service, config layer, and dedicated auth screen in Flutter.
- SharedPreferences-backed Clerk persistence for restoring the real Flutter session.
- FastAPI-backed Flutter creator profile model/provider.
- Publish account parsing from `/api/publish/accounts` with real Zernio/LATE account IDs.
- Technical specs for LATE integration and target architecture.

### Changed
- Settings publishing channels now show real connected account state.
- Approve to publish flow resolves connected accounts and returns user-facing result messages.
- FastAPI projects router uses authenticated user context instead of `default-user`.
- Flutter router, entry screen, onboarding, and Dio client depend on centralized session state.
- Demo onboarding flow locked to one pre-populated public repository.
- Onboarding creates a real workspace via FastAPI.
- FastAPI publish routes require auth, verify ownership, persist Zernio metadata.

### Fixed
- Scheduling API method aligned with FastAPI (POST → PATCH).
- Feed and editor publish snackbars reflect actual outcome.
- Project route ownership enforced in FastAPI.
- Authenticated routes no longer silently fall back to mock data.
- 401 responses invalidate session explicitly.

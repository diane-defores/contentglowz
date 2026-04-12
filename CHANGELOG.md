# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog.

## [2026-04-12]

### Changed
- Rebranded the Flutter app from `ContentFlowz` to `ContentFlow` across the app shell, entry/auth/settings copy, web metadata, Android package identifiers, and project documentation.
- Switched the default deployed API base URL from local development to `https://api.winflowz.com` in runtime config, PM2/Vercel build scripts, and README examples.

### Fixed
- Corrected the generated Android entrypoint/package path to match the renamed `com.contentflow.contentflow_app` namespace.
- Regenerated Flutter web output so the built assets, manifest, bootstrap metadata, and service worker version align with the current app identity.

## [0.7.0] - 2026-04-11 — Mobile UX Overhaul

### Changed
- **Bottom navigation redesigned**: replaced unusable 18-item horizontal scroll with a 5-tab bar (Feed, Schedule, History, Drip, More) + categorized bottom sheet for all other screens.
- **Entry screen responsive**: hero text scales from 28px→36px→48px based on viewport width; feature/step cards go full-width on mobile instead of fixed 320/350px.
- **Pain vs Flow section**: fixed `Expanded` inside `Column` crash on compact layout; now uses conditional Row/Column correctly.
- **Feed action buttons**: replaced `GestureDetector` with `Material` + `InkWell` for visible ripple touch feedback on mobile.
- **Content card footer**: swipe hints hide on screens narrower than 380px to prevent overflow; spacing tightened.
- **Settings frequency sliders**: stacks label/slider vertically on screens narrower than 360px instead of cramped horizontal layout.

### Fixed
- **Idea Pool action buttons**: increased touch targets from ~24px to 44px minimum height (WCAG 2.5.8 compliance).

## [0.6.0] - 2026-03-27 — DataForSEO Integration

### Added
- **DataForSEO API v3 client** (`dataforseo_client.py`): reusable HTTP client with Basic Auth for SERP, keywords, trends, competitors, search intent, domain rank.
- **DFS provider** (`dataforseo_provider.py`): DFSSERPAnalyzer, DFSTrendMonitor, DFSKeywordGapFinder, DFSRankingPatternExtractor — real data instead of mocks.
- **Level 1 — SEO keyword ingestion**: `ingest_seo_keywords()` rewritten with DFS `keyword_ideas` + `keyword_overview`. Each idea gets real volume, difficulty, CPC, intent, opportunity_score.
- **Level 2 — Idea enrichment**: new `enrich_ideas()` batch-enriches raw ideas via DFS `keyword_overview`, computes `priority_score`, transitions to status `enriched`.
- **Level 3 — Competitor intelligence**: new `ingest_competitor_watch()` uses DFS `domain_intersection` + `ranked_keywords` to find content gaps and competitor keywords.
- **Level 4 — SERP position tracking**: new `track_serp_positions()` checks Google rankings for published content, stores 90-day position history in content metadata.
- **SERP feedback loop**: `_evaluate_serp_feedback()` creates refresh ideas (source=`serp_feedback`) when content is never ranked, declining, or stuck on page 2.
- **Angle Strategist bridge**: optional step in `_run_article_job` (opt-in via `use_angle_strategist` config) that feeds enriched SEO data through the Angle Strategist before the SEO Crew.
- **3 new API endpoints**: `POST /api/ideas/enrich`, `POST /api/ideas/ingest/competitors`, `POST /api/ideas/track-serp`.
- **3 new scheduler job types**: `enrich_ideas`, `ingest_competitors`, `track_serp`.
- `DFS_CONFIG` in `research_config.py` with location, language, depth settings.
- `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD` in `.env.example`.

### Changed
- `research_tools.py` rewritten: SerpApi removed, DFS provider classes used directly. Same `@tool` wrappers for CrewAI agents.
- `_run_article_job` now passes `competitor_domains`, `sector`, `business_goals`, `brand_voice`, `target_audience`, `tone` to SEO Crew (were ignored before).
- Content record metadata now includes `target_keyword`, `seo_signals`, `source_idea_id` for SERP tracker traceability.
- `ingest_seo_keywords` default `max_keywords` raised from 30 to 50.

### Removed
- SerpApi dependency (`serpapi` package) and `SERP_API_KEY` from `.env.example`.
- Mock/hardcoded data in `TrendMonitor` (trend_score: 75.0) and `KeywordGapFinder` (search_volume: 1000).
- `SEO_PROVIDER` env var toggle (no longer needed, DFS is the only provider).

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
- Flutter repo initialized and pushed to GitHub (`dianedef/ContentFlow-app`).

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

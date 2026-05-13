# Changelog

All notable changes to the ContentFlow monorepo are documented here.

## [2026-05-13]

### Added
- Prepared the Flux AI Provider for Image Robot backend foundation with guided Flux profiles, project-scoped visual references, asynchronous generation history, Bunny CDN asset persistence, and Flutter API client models/methods.

### Security
- Hardened remote image ingestion and Flux output handling with authenticated project ownership, durable Bunny-only returned assets, private-network URL rejection, MIME checks, byte limits, and normalized provider errors.

## [2026-05-11]

### Added
- Added a project-scoped asset library backend surface for listing, usage history, events, eligibility checks, primary selection, tombstone/restore, preview refresh, and cleanup reporting.
- Added Flutter project asset models, API methods, Riverpod state, a reusable picker, and an editor entry point for linking eligible project assets to content placements.

### Fixed
- Enforced server-side target ownership, media-kind compatibility, safe storage descriptors, and stale active-project guards across asset selection and primary mutations.

### Changed
- Documented the asset library as a guided project workflow layer, not a public DAM or arbitrary media playground.

## [Unreleased]

### Removed
- Removed generated Flutter web build artifacts from Git tracking so Vercel owns `contentflow_app/build/web` generation during deployment.

### Added
- Added privacy capture planning artifacts for Android, Web, Windows, macOS, iOS, and Linux, plus shared contract, post-production review, and QA matrix documents.
- Added root monorepo task tracking and a site-specific tracker aligned with the ready Astro 6 migration spec.
- Added a ShipFlow master dashboard entry for ContentFlow.
- Added Android APK CI setup documentation and a Blacksmith-backed GitHub Actions workflow.
- Added baseline `shipflow_data/technical/` governance for `contentflow_app` and `contentflow_site`.
- Added baseline `shipflow_data/editorial/` governance for the public Astro site.

### Changed
- Reprioritized ContentFlow trackers so feedback production checks are no longer treated as the next blocking win after the admin allowlist was configured.
- Reconnected ContentFlow site and app Vercel auto-deploys to the organization monorepo and verified deployment from `main`.
- Reconciled the Flutter app tracker so the previously fixed light-mode contrast regression is marked done.
- Migrated `contentflow_site` tracking to Astro 6 completion and documented the site migration closure.
- Prioritized Vercel monorepo reconnect verification for the organization repository.
- Migrated global markdown governance artifacts to `shipflow_data/workflow/**`, updated durable-path pointers, and logged migration inventory/security/closure reports.
- Fixed ShipFlow frontmatter compliance for active root, app, and site documentation artifacts.
- Consolidated `contentflow_lab` agent guidance into `AGENT.md` and kept `AGENTS.md` as the compatibility symlink.

### Fixed
- Coalesced concurrent Flutter app access refreshes so Clerk restore sends one backend health/bootstrap pass for the same auth session.

# Changelog

All notable changes to the ContentFlow monorepo are documented here.

## [Unreleased]

### Removed
- Removed generated Flutter web build artifacts from Git tracking so Vercel owns `contentflow_app/build/web` generation during deployment.

### Added
- Added privacy capture planning artifacts for Android, Web, Windows, macOS, iOS, and Linux, plus shared contract, post-production review, and QA matrix documents.
- Added root monorepo task tracking and a site-specific tracker aligned with the ready Astro 6 migration spec.
- Added a ShipFlow master dashboard entry for ContentFlow.
- Added Android APK CI setup documentation and a Blacksmith-backed GitHub Actions workflow.
- Added baseline `docs/technical/` governance for `contentflow_app` and `contentflow_site`.
- Added baseline `docs/editorial/` governance for the public Astro site.

### Changed
- Reconnected ContentFlow site and app Vercel auto-deploys to the organization monorepo and verified deployment from `main`.
- Reconciled the Flutter app tracker so the previously fixed light-mode contrast regression is marked done.
- Migrated `contentflow_site` tracking to Astro 6 completion and documented the site migration closure.
- Prioritized Vercel monorepo reconnect verification for the organization repository.
- Fixed ShipFlow frontmatter compliance for active root, app, and site documentation artifacts.
- Consolidated `contentflow_lab` agent guidance into `AGENT.md` and kept `AGENTS.md` as the compatibility symlink.

### Fixed
- Coalesced concurrent Flutter app access refreshes so Clerk restore sends one backend health/bootstrap pass for the same auth session.

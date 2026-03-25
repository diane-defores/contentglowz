# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog.

## [Unreleased]

### Added
- Publish account parsing from `/api/publish/accounts` with real Zernio/LATE account IDs.
- Technical spec for finalizing the LATE/Zernio integration in `specs/late-integration-finalization.md`.
- Technical spec for the target Astro + Flutter + FastAPI + Clerk architecture in `specs/architecture-cible-fastapi-clerk-flutter.md`.
- FastAPI Clerk auth foundation with authenticated `/api/me` and `/api/bootstrap` endpoints.
- FastAPI user data endpoints for `/api/settings`, `/api/creator-profile`, and `/api/personas`.
- Shared ownership helpers in FastAPI for project-scoped content access.
- Flutter session and bootstrap models to route through a single auth/bootstrap layer.
- Headless Clerk auth service, config layer, and dedicated auth screen in Flutter.
- SharedPreferences-backed Clerk persistence for restoring the real Flutter session.
- FastAPI-backed Flutter creator profile model/provider.

### Changed
- Settings publishing channels now show real connected account state instead of hardcoded badges.
- Approve to publish flow now resolves connected accounts before publishing and returns user-facing result messages.
- FastAPI projects router now uses authenticated user context instead of `default-user`.
- FastAPI now reads user settings, creator profile, and personas directly from the existing app database model.
- FastAPI status and content routes now scope reads and writes to the authenticated user's projects.
- Flutter router, entry screen, onboarding completion, and Dio client now depend on a centralized session state instead of direct local flags.
- The Flutter entry flow now routes logged-out users to a real auth screen and persists authenticated bearer tokens for bootstrap reuse.
- The demo onboarding flow now keeps the full setup experience while locking it to one pre-populated public repository and fixed content settings.
- Demo project mocks and the local test server now serve a single stable public-repo workspace instead of editable placeholder data.
- Flutter now restores the Clerk session on startup, separates local API URL config from backend user settings, and routes settings/personas/creator-profile through FastAPI.
- Onboarding now creates a real workspace via FastAPI instead of completing against a fake local auth/onboarding state.
- FastAPI publish routes now require auth, verify content ownership, persist Zernio publish metadata in `ContentRecord.metadata.publish`, update `target_url`, and align content lifecycle transitions with the real publish result.

### Fixed
- Scheduling API method aligned with FastAPI by switching Flutter from `POST` to `PATCH`.
- Feed and editor publish snackbars now reflect actual publish outcome instead of always claiming success.
- Project route ownership is now enforced in FastAPI for project-scoped operations.
- Content lifecycle, body editing, validation, and stats endpoints no longer expose cross-project records.
- The temporary app gate no longer hardcodes login/onboarding decisions outside the shared session/bootstrap flow.
- The app no longer falls back into onboarding when reopening a stale onboarding URL, and `/` now resolves cleanly to the entry screen.
- Authenticated Flutter routes no longer silently fall back to mock data on private API failures, and `401` responses now invalidate the session explicitly.

---
artifact: technical_guidelines
metadata_schema_version: "1.0"
artifact_version: "1.2.0"
project: app
created: "2026-04-26"
updated: "2026-05-24"
status: reviewed
source_skill: sf-docs
scope: technical
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: none
docs_impact: yes
evidence:
  - "Operator decision 2026-05-24: testable Flutter UI regressions must be covered by widget tests and web smoke before manual handoff."
depends_on: []
supersedes: none
linked_systems: []
next_review: "2026-07-26"
next_step: /sf-ready claude-instructions
---

# CLAUDE.md

## Project Overview

`app` is the Flutter product application for ContentGlowz, handling authenticated user onboarding, content operations, workspace management, review flows, scheduling, and diagnostics.

Backend and auth dependencies:

- **FastAPI** service (`API_BASE_URL`) for workspace/content/projects data
- **Clerk** for authentication/session validation (`CLERK_PUBLISHABLE_KEY`)
- **Site handoff** URLs from `site` and mobile/web launcher (`APP_SITE_URL`, `APP_WEB_URL`)

## Tech Stack

- Flutter (Dart 3.11+)
- Riverpod + GoRouter
- Dio (`shared_preferences` + offline storage for degraded mode)
- Clerk web runtime for auth handoff

## Common Commands

- `./build.sh --serve` (local build + serve)
- `./pm2-web.sh` (build + run production-style web server)
- `./scripts/validate-clerk-runtime.sh` (auth runtime smoke check)

## ShipFlow Development Mode

- development_mode: hybrid
- validation_surface: mixed
- ship_before_preview_test: conditional
- post_ship_verification: sf-prod
- deployment_provider: vercel
- preview_source: Vercel MCP deployment target_url
- production_url: unknown
- notes: Local checks cover most Flutter UI and provider logic. Pure Flutter surfaces are considered shared for QA across the deployed web app and any platform build: onboarding UI, app shell/navigation, workspace/content CRUD, dialogs, form validation, filters/search, empty/error states, and provider-driven screen behavior must be covered by targeted widget tests first, then can be smoke-tested on the Vercel Flutter web app before asking Diane to validate a slower build or hosted release flow. Hosted auth/callback, deployment routing, FastAPI/Turso state, Clerk runtime, and production-like data proof should use `sf-ship` then `sf-prod` before authoritative browser confirmation. Manual QA should not be used as the first line of detection for testable Flutter widget regressions.
- last_reviewed: 2026-05-24

### Pre-manual QA Gate

Before asking Diane to validate a hosted release flow or slower platform build, run the strongest local gate that matches the changed surface:

- Always run `flutter analyze` and the targeted `flutter test ...` covering the changed workflow.
- For any screen or flow change in a shared Flutter surface, add or extend widget tests for the actual user path, including open/close dialogs, cancel, no-op save, real save, destructive cancel/confirm, search/filter, persistence/reload, and empty/error states when relevant.
- Run the relevant screen test file, or full `flutter test`, before handing off broad UI, onboarding, shell/navigation, workspace/content CRUD, review flow, scheduling, diagnostics, provider, or offline-sync UI changes.
- Use the Vercel Flutter web app as the fast manual smoke surface for shared Flutter UI when the behavior does not depend on hosted auth/callbacks, backend/deployment state, or production-like data.
- Ask Diane for manual QA as final confirmation after automated and web-smoke coverage have reduced widget-regression risk, or for integration edges that cannot be proven locally.

## ARM64 Android Release Guardrail

On Linux ARM64 (`aarch64`/`arm64`), do not run Android release builds locally: no `flutter build apk --release`, `flutter build appbundle --release`, `./gradlew assembleRelease`, or `./gradlew bundleRelease`. Route APK/AAB release builds to Blacksmith or another Linux x64 CI runner. Local Flutter work is limited to `flutter analyze`, `flutter test`, and `flutter build web --release`.

## App Structure

- `lib/main.dart`: app bootstrap + offline sync bridge
- `lib/router.dart`: route definitions and access-guarded redirects
- `lib/data/services/`: API client, offline storage, queue, auth adapters
- `lib/presentation/`: app shell and screen hierarchy
- `lib/core/`: diagnostics, preferences, localization helpers
- `lib/providers/`: Riverpod providers/notifiers
- `shipflow_data/workflow/specs/`: implementation and migration specs
- `web_auth/`: Clerk auth assets injected into web builds

## State and Error Handling

- Do not hard-fail access to the app when FastAPI is unavailable.
- Keep authenticated users in app/degraded mode with cached reads where possible.
- Queue supported writes locally and replay when backend is reachable.
- Replay should stop for invalid auth states and resume on re-auth.

## Local-First Conventions

- Respect the offline storage schema in queue/cache docs and specs.
- Preserve `tempId` reconciliation patterns for writes that need real backend IDs.
- Keep dependency ordering in replay logic explicit (upstream create before dependent updates).
- Expose clear sync status for supported flows in UI.

## Integration Notes

- Related repos:
  - `site` (landing, auth handoff entrypoint, public docs)
  - `lab` (AI agents and backend services)
- Prefer consistency with project-wide terminology:
  - **feed**, **onboarding**, **drip**, **workspace**, **angle**, **idea**

## Backend Data Changes (Turso / libSQL)

- Production backend data lives in Turso at `libsql://contentglowz-prod2-dianedef.aws-eu-west-1.turso.io`.
- If an app change touches backend API contracts, onboarding, workspace/project data, feedback, jobs, status, offline replay, or any Turso-backed persistence path, always verify whether a SQL migration is required or not.
- Use the **Turso CLI** for schema checks against the real database; do not decide from code reading alone. Example: `turso db shell contentglowz-prod2 ".schema"` or targeted `PRAGMA table_info(...)` queries.
- State the migration conclusion explicitly in task notes or the final response, even when no migration is needed.
- **Mandatory before every commit/push**: explicitly decide and state whether a Turso migration is required (`yes/no`), with a short reason.

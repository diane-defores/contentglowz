---
artifact: technical_guidelines
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: contentflow_lab
created: "2026-04-26"
updated: "2026-05-04"
status: reviewed
source_skill: sf-docs
scope: technical
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: yes
docs_impact: yes
evidence:
  - README.md
  - api/main.py
  - api/routers/__init__.py
  - api/dependencies/auth.py
  - api/services/user_data_store.py
  - api/services/user_key_store.py
  - scheduler/scheduler_service.py
  - requirements.txt
  - requirements.lock
  - pytest.ini
  - render.yaml
depends_on: []
supersedes: []
linked_systems:
  - FastAPI
  - Turso/libsql
  - Clerk
  - OpenRouter
  - Exa
  - Firecrawl
  - SendGrid
  - Doppler
next_review: "2026-07-26"
next_step: /sf-docs audit CLAUDE.md
---

# CLAUDE.md

## Project Overview

`contentflow_lab` is the production-oriented backend platform for the ContentFlow ecosystem.

It hosts:

- a FastAPI runtime used by `contentflow_app`,
- AI automation and research components,
- scheduling, status, and publish-support services used by downstream clients.

## Architecture

- `api/` — FastAPI app and routers:
  - startup/shutdown lifecycle (`api.main`),
  - health + service endpoints,
  - projects/settings/creator/profile/content/drip/jobs/status and analytics APIs.
- `agents/` — CrewAI/PydanticAI pipelines.
- `scheduler/` — periodic orchestration.
- `status/`, `data/`, `utils/` — service and persistence helpers.
- `api/services/` — integrations (analytics, job store, feedback, drip services, auth/webhand-off helpers).

## Common Commands

```bash
# one-time setup
pip install -r requirements.lock
flox activate  # if using flox

# run API with secrets
doppler run -- uvicorn api.main:app --reload --port 8000
```

```bash
# health + docs
curl http://localhost:8000/health
open http://localhost:8000/docs
open http://localhost:8000/redoc
```

## ShipFlow Development Mode

- development_mode: local
- validation_surface: local
- ship_before_preview_test: no
- post_ship_verification: none
- deployment_provider: other
- preview_source: not applicable
- production_url: https://api.winflowz.com
- notes: Validate source changes with local pytest/compile/audit checks. Hosted Render/PM2 rollout is operator-controlled and out of scope for agents.
- last_reviewed: 2026-05-04

## Backend Focus

- Backend reliability changes must preserve compatibility for authenticated flows consumed by `contentflow_app`.
- Changes to `api/` routers should keep request/response contracts stable and update docs/changelog when impacted.
- New routers should be added with auth, validation, and status/error handling consistent with existing FastAPI patterns.
- Keep startup schema/migration logic defensive (`idempotent`, non-blocking where possible).

## Turso / libSQL Schema Changes (Do Not Skip)

- Production DB is **Turso (SQLite/libSQL)**.
- If you introduce a new table/column/index that the API code relies on, ship the corresponding migration/ensure step in the same change.
- Failure mode is misleading: a missing table (e.g. `UserSettings`) can make onboarding/project selection appear broken and can even trigger upstream 502s.
- **Mandatory before every commit/push**: explicitly decide and state whether a Turso migration is required (`yes/no`), with a short reason.
- If the answer is `yes`, include the migration/ensure changes in the same commit/push. If `no`, record why no migration is needed.

## Related Projects

- `contentflow_app` — Flutter application and web shell.
- `contentflow_site` — marketing/auth entrypoint.

## Forbidden Paths

- `/home/claude/contentflow/contentflow_lab_deploy` is an operator-controlled deployment copy of `contentflow_lab`.
- Agents must treat that directory as out of scope: do not read it, modify it, run tests from it, diff against it, restart services from it, or use it as context unless the user explicitly asks for that exact path.
- PM2 and live service control are also out of scope: do not run `pm2 start`, `pm2 restart`, `pm2 stop`, `pm2 logs`, or equivalent process-management commands.
- For production incidents, report diagnosis and exact operator commands/actions without applying them.
- Work in `contentflow_lab` only; the user decides when and how deployment copies are updated.

## References

- `AGENTS.md` for conventions and operational notes.
- `CHANGELOG.md` for endpoint/domain-level changes.
- `ENVIRONMENT_SETUP.md` for secrets and runtime configuration.

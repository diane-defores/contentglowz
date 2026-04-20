# Development Guidelines

## Scope

Backend/API conventions for `contentflow_lab`.

## Stack

- Python 3.11+
- FastAPI
- Pydantic / PydanticAI / CrewAI
- Scheduler + job orchestration
- SQLite/Turso persistence layer
- Doppler for secrets, Flox for reproducible env

## API Rules

1. Keep domain boundaries clear in `api/routers`.
2. Use Pydantic models for public request/response boundaries.
3. Protect sensitive endpoints with auth dependencies.
4. Keep startup initialization idempotent and explicit in logs.
5. Document or update endpoint effects in `CHANGELOG.md` when contract changes.

## Data and Migration Rules

- Avoid destructive DB changes in hot code paths.
- Add new tables/columns via migration-safe paths with clear fallback behavior.
- Ensure background services handle transient failures without taking down the app.
- Keep scheduler jobs deterministic and easy to retry.

## Observability Rules

- Return consistent status semantics (`ok`, `error`, `details`, `request_id` where applicable).
- Keep failures observable (logs + status endpoints + structured events).
- Ensure cost/status tracking surfaces exist for long-running AI jobs.

## Release Hygiene

- When adding new endpoints:
  - update `api/` router registration,
  - update env/deployment docs (`ENVIRONMENT_SETUP.md`, `README.md`),
  - include migration impact in `CHANGELOG.md`.
- If contract changes affect `contentflow_app`, flag compatibility considerations immediately in notes.

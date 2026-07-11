---
artifact: technical_guidelines
metadata_schema_version: "1.0"
artifact_version: "1.1.0"
status: reviewed
project: lab
created: "2026-04-26"
updated: "2026-06-29"
source_skill: sf-docs
scope: technical
owner: "Diane"
confidence: medium
risk_level: high
next_review: "2026-09-29"
security_impact: yes
docs_impact: yes
linked_systems:
  - FastAPI
  - Turso/libsql
  - Clerk
  - OpenRouter
  - Exa
  - Firecrawl
  - SendGrid
  - Doppler
evidence:
  - README.md
  - CLAUDE.md
  - shipglowz_data/technical/lab/README.md
  - shipglowz_data/technical/lab/context.md
  - shipglowz_data/technical/lab/architecture.md
depends_on:
  - shipglowz_data/business/business.md
  - shipglowz_data/branding/branding.md
  - shipglowz_data/technical/lab/guidelines.md
supersedes: []
next_step: /sf-docs audit AGENT.md
---
# AGENT.md

## Canonical file policy

`AGENT.md` remains the local compatibility contract for `lab`.
`AGENTS.md` must remain a compatibility symlink to this file.

Canonical technical truth lives under `shipglowz_data/technical/lab/`.

## Purpose

Keep one short local operating contract for tools that still resolve `lab/AGENT.md`, while moving durable technical documentation into the monorepo root `shipglowz_data/` corpus.

## Canonical technical sources

- `shipglowz_data/technical/lab/README.md`
- `shipglowz_data/technical/lab/context.md`
- `shipglowz_data/technical/lab/context-function-tree.md`
- `shipglowz_data/technical/lab/architecture.md`
- `shipglowz_data/technical/lab/guidelines.md`

## Documentation operating rules

- Do not document non-existent API or agent modules.
- Do not add production-level guarantees without corresponding code paths.
- Keep local façade docs short; move durable detail into `shipglowz_data`.
- If dependency, auth, scheduler, or architecture behavior changes, update the relevant `shipglowz_data/technical/lab/*` artifact first.

## Operator boundary

- `/home/claude/contentglowz/lab_deploy` is operator-controlled and out of scope unless explicitly requested.
- PM2 and live service control are operator-only.
- Production diagnosis is allowed; production mutation from this repo context is not.

## Explicit non-goals

- No edits in deployment copies unless explicitly requested.
- No `pm2 start`, `pm2 restart`, `pm2 stop`, or `pm2 logs`.

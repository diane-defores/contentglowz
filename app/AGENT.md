---
artifact: technical_guidelines
metadata_schema_version: "1.0"
artifact_version: "1.3.0"
draft: false
project: app
created: "2026-04-26"
updated: "2026-06-29"
status: reviewed
source_skill: sf-docs
scope: technical
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: yes
docs_impact: yes
evidence:
  - "README.md"
  - "CLAUDE.md"
  - "shipglowz_data/technical/app/README.md"
  - "shipglowz_data/technical/app/architecture.md"
depends_on:
  - shipglowz_data/technical/app/guidelines.md
  - shipglowz_data/product/app/product.md
supersedes: []
linked_systems:
  - "lab FastAPI backend"
  - "site auth handoff"
  - "ClerkJS auth assets"
next_review: "2026-09-29"
next_step: "/sf-docs audit AGENT.md"
---

# AGENT - app

## Canonical file policy

`app/AGENT.md` remains a local compatibility contract.
Canonical technical truth for `app` lives under `shipglowz_data/technical/app/`.

## Mission

Keep `app` as the Flutter product application for ContentGlowz while preserving the app, backend, and auth contracts documented in `shipglowz_data`.

## Canonical sources

- `shipglowz_data/technical/app/README.md`
- `shipglowz_data/technical/app/context.md`
- `shipglowz_data/technical/app/context-function-tree.md`
- `shipglowz_data/technical/app/architecture.md`
- `shipglowz_data/technical/app/guidelines.md`
- `shipglowz_data/workflow/app/TASKS.md`

## Invariants

- Do not expand local facade docs with durable architecture or product detail.
- Keep Flutter access, auth, offline queue, and API behavior aligned with canonical `shipglowz_data/technical/app/*` docs.
- If app routing, auth, offline replay, publish, capture, or API contract behavior changes, update the relevant `shipglowz_data` artifact first.

## Validation

- Use the focused Flutter checks required by the changed surface.
- Preserve the ARM64 Android release guardrail from canonical technical docs.

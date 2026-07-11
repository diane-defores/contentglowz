---
artifact: agent_context
metadata_schema_version: "1.0"
artifact_version: "1.1.0"
project: site
created: "2026-04-26"
updated: "2026-06-29"
status: reviewed
source_skill: sf-docs
scope: technical_core
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: low
docs_impact: yes
depends_on:
  - CLAUDE.md@1.1.0
  - shipglowz_data/business/business.md
  - shipglowz_data/branding/branding.md
  - shipglowz_data/technical/site/guidelines.md
evidence:
  - README.md
  - CLAUDE.md
  - shipglowz_data/technical/site/README.md
  - shipglowz_data/editorial/site/README.md
supersedes: []
next_review: "2026-09-29"
next_step: /sf-docs audit AGENT.md
---

# AGENT — site

## Canonical file policy

`site/AGENT.md` remains a local compatibility contract.
Canonical technical and editorial truth for `site` lives under `shipglowz_data/technical/site/` and `shipglowz_data/editorial/site/`.

## Mission

Keep `site` as a stable public entry surface aligned with the real behavior of the ContentGlowz ecosystem.

## Canonical sources

- `shipglowz_data/technical/site/README.md`
- `shipglowz_data/technical/site/context.md`
- `shipglowz_data/technical/site/context-function-tree.md`
- `shipglowz_data/technical/site/architecture.md`
- `shipglowz_data/technical/site/guidelines.md`
- `shipglowz_data/editorial/site/README.md`

## Invariants

- Do not reintroduce site-owned auth flows when the public contract is app handoff.
- Do not expand local façade docs with durable architecture or editorial detail.
- If routing, handoff, SEO, or public claims change, update the relevant `shipglowz_data/site/*` artifact first.

## Validation

- `npm run build` must stay operational.
- Public routes, redirects, and core metadata must remain coherent with the canonical docs.

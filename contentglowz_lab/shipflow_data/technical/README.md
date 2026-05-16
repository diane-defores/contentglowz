---
artifact: technical_docs_index
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: contentglowz_lab
created: "2026-05-04"
updated: "2026-05-04"
status: draft
source_skill: sf-build
scope: technical-docs
owner: Diane
confidence: medium
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - api/
  - agents/
  - requirements.lock
depends_on: []
supersedes: []
evidence:
  - "sf-build resumed SPEC-migrate-pydantic-ai-major.md and found no technical docs map."
next_review: "2026-06-04"
next_step: "/sf-docs technical audit contentglowz_lab"
---

# Technical Docs

This directory maps code areas that need durable technical context before future ShipFlow edits.

Start with `code-docs-map.md`. Load only the mapped module context for the files being changed.

## Current Coverage

- `ai-runtime-and-url-safety.md`: PydanticAI adapter, BYOK OpenRouter key resolution, repo understanding synthesis, and URL safety for Exa/Firecrawl.

## Maintenance Rule

Update this index and `code-docs-map.md` when a new backend subsystem gets a technical module context or when mapped files move.

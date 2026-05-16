---
artifact: editorial_content_context
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: contentglowz_site
created: "2026-05-06"
updated: "2026-05-06"
status: draft
source_skill: sf-docs
scope: schema-policy
owner: Diane
confidence: medium
risk_level: high
security_impact: yes
docs_impact: yes
content_surfaces:
  - runtime_content
claim_register: shipflow_data/editorial/claim-register.md
page_intent: shipflow_data/editorial/page-intent-map.md
linked_systems:
  - src/content.config.ts
  - src/content/
depends_on:
  - artifact: "shipflow_data/technical/astro-site-routing-and-content.md"
    artifact_version: "0.1.0"
    required_status: draft
supersedes: []
evidence:
  - "Astro runtime content schema exists at src/content.config.ts."
next_review: "2026-06-06"
next_step: "/sf-docs editorial audit contentglowz_site"
---

# Astro Content Schema Policy

Astro runtime content must preserve the schema declared in `src/content.config.ts`.

## Runtime Content Policy

- Do not add ShipFlow governance frontmatter to `src/content/**` unless `src/content.config.ts` explicitly accepts those fields.
- If content needs ShipFlow governance, place the governance artifact under `shipflow_data/editorial/`, `shipflow_data/technical/`, or `shipflow_data/workflow/specs/`, then reference the runtime content path.
- If the schema changes, update technical docs, editorial docs, and build validation together.

## Validation

```bash
npm run build
```

## Maintenance Rule

Update this policy when Astro content collections, frontmatter fields, content routes, or schema validation behavior changes.

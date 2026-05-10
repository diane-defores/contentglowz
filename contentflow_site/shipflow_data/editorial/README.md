---
artifact: editorial_content_context
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: contentflow_site
created: "2026-05-06"
updated: "2026-05-06"
status: draft
source_skill: sf-docs
scope: editorial-governance
owner: Diane
confidence: medium
risk_level: high
security_impact: yes
docs_impact: yes
content_surfaces:
  - public_site
  - repo_docs
  - runtime_content
  - future_blog
claim_register: shipflow_data/editorial/claim-register.md
page_intent: shipflow_data/editorial/page-intent-map.md
linked_systems:
  - shipflow_data/editorial/content-map.md
  - shipflow_data/business/business.md
  - shipflow_data/business/product.md
  - shipflow_data/business/branding.md
  - shipflow_data/business/gtm.md
  - src/pages/
  - src/content.config.ts
  - src/content/
depends_on:
  - artifact: "shipflow_data/editorial/content-map.md"
    artifact_version: "1.0.0"
    required_status: reviewed
supersedes: []
evidence:
  - "contentflow_site has public Astro routes and runtime content."
next_review: "2026-06-06"
next_step: "/sf-docs editorial audit contentflow_site"
---

# Editorial Governance

This directory governs public ContentFlow site surfaces, claims, page intent, runtime content schema boundaries, and editorial update gates.

Load order:

1. `public-surface-map.md`
2. `page-intent-map.md`
3. `claim-register.md`
4. `editorial-update-gate.md`
5. `astro-content-schema-policy.md`
6. `blog-and-article-surface-policy.md`

## Maintenance Rule

Update this index when public surfaces, claim evidence, page intent, runtime content schema, or editorial gates change.

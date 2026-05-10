---
artifact: editorial_content_context
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: contentflow_site
created: "2026-05-06"
updated: "2026-05-06"
status: draft
source_skill: sf-docs
scope: page-intent
owner: Diane
confidence: medium
risk_level: high
security_impact: yes
docs_impact: yes
content_surfaces:
  - public_site
  - runtime_content
claim_register: shipflow_data/editorial/claim-register.md
page_intent: shipflow_data/editorial/page-intent-map.md
linked_systems:
  - src/pages/
  - src/config/site.ts
depends_on:
  - artifact: "shipflow_data/editorial/content-map.md"
    artifact_version: "1.0.0"
    required_status: reviewed
supersedes: []
evidence:
  - "Baseline page intent map created for current Astro routes."
next_review: "2026-06-06"
next_step: "/sf-docs editorial audit contentflow_site"
---

# Page Intent Map

| Route or file | Intent | Primary CTA | Source contracts | Shared-file risk |
| --- | --- | --- | --- | --- |
| `/` via `src/pages/index.astro` | Explain ContentFlow and move qualified visitors toward the app | Open app or start/sign in | `shipflow_data/business/business.md`, `shipflow_data/business/product.md`, `shipflow_data/business/gtm.md` | High: homepage copy affects positioning and claims |
| `/launch` | Route users into the app experience | Continue to app | `shipflow_data/business/product.md`, app handoff config | Medium: app URL and auth state must stay current |
| `/sign-in` | Redirect or hand off existing users to app sign-in | Sign in | app auth contract | High: auth claims and route correctness |
| `/sign-up` | Redirect or hand off new users to app sign-up | Sign up | app auth contract, GTM offer | High: conversion and auth correctness |
| `/privacy` | State privacy and data-handling posture | None or contextual app link | legal/product evidence | High: security and privacy claims need proof |
| `src/content/**` | Render structured content through Astro collections | Surface-specific | `src/content.config.ts` | High: schema drift can break build |

## Maintenance Rule

Update this map when route intent, CTA, source contracts, auth/app handoff, or shared layout behavior changes.

---
artifact: editorial_content_context
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: contentflow_site
created: "2026-05-06"
updated: "2026-05-06"
status: draft
source_skill: sf-docs
scope: claim-register
owner: Diane
confidence: medium
risk_level: high
security_impact: yes
docs_impact: yes
content_surfaces:
  - public_site
  - repo_docs
claim_register: docs/editorial/claim-register.md
page_intent: docs/editorial/page-intent-map.md
linked_systems:
  - BUSINESS.md
  - PRODUCT.md
  - BRANDING.md
  - GTM.md
  - src/pages/
depends_on:
  - artifact: "BUSINESS.md"
    artifact_version: "1.0.0"
    required_status: reviewed
  - artifact: "PRODUCT.md"
    artifact_version: "1.0.0"
    required_status: reviewed
  - artifact: "GTM.md"
    artifact_version: "1.0.0"
    required_status: reviewed
supersedes: []
evidence:
  - "Baseline claim register created for public site governance."
next_review: "2026-06-06"
next_step: "/sf-docs editorial audit contentflow_site"
---

# Claim Register

| Claim area | Allowed posture | Evidence source | Status | Notes |
| --- | --- | --- | --- | --- |
| AI automation | Describe implemented workflows and reviewed specs only | `PRODUCT.md`, ready specs, verified code | needs proof per claim | Do not promise autonomous publishing without product evidence. |
| Time savings or growth outcomes | Use cautious benefit language | `GTM.md`, user evidence, analytics when available | needs proof | Avoid quantified gains unless validated. |
| Security and privacy | State only verified handling | `privacy` page source, backend/app contracts, legal review | needs proof | Do not imply certifications or compliance not documented. |
| Availability or reliability | Avoid uptime promises | deployment proof and runtime monitoring | needs proof | Use operational status only when measured. |
| Pricing or offers | Match current GTM/pricing source | `GTM.md`, pricing spec if present | needs proof | No public pricing claim without a current offer contract. |

## Claim Impact Plan

- Changed source:
- Impacted claim:
- Evidence:
- Required action: `none | review | update | remove | blocked`
- Closure status:

## Maintenance Rule

Update this register before strengthening public claims about AI, automation, security, privacy, availability, pricing, outcomes, or compliance.

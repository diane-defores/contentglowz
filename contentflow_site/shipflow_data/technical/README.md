---
artifact: technical_docs_index
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: contentflow_site
created: "2026-05-06"
updated: "2026-05-06"
status: draft
source_skill: sf-docs
scope: technical-docs
owner: Diane
confidence: medium
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - src/
  - astro.config.mjs
  - package.json
depends_on: []
supersedes: []
evidence:
  - "contentflow_site is an Astro public site with pages, layouts, content config, and Vercel deployment config."
next_review: "2026-06-06"
next_step: "/sf-docs technical audit contentflow_site"
---

# Technical Docs

This directory maps code areas that need durable technical context before future ShipFlow edits.

Start with `code-docs-map.md`. Load only the mapped module context for the files being changed.

## Current Coverage

- `astro-site-routing-and-content.md`: Astro routing, layouts, public pages, content schema, SEO metadata, sitemap, and build validation.

## Maintenance Rule

Update this index and `code-docs-map.md` when a new site subsystem gets a technical module context or when mapped files move.

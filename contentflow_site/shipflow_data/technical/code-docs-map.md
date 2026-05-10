---
artifact: code_docs_map
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: contentflow_site
created: "2026-05-06"
updated: "2026-05-06"
status: draft
source_skill: sf-docs
scope: code-docs-map
owner: Diane
confidence: medium
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - src/pages/
  - src/layouts/
  - src/components/
  - src/content.config.ts
  - astro.config.mjs
depends_on:
  - artifact: "shipflow_data/technical/astro-site-routing-and-content.md"
    artifact_version: "0.1.0"
    required_status: draft
supersedes: []
evidence:
  - "Baseline map created after metadata compliance audit found no technical governance layer for contentflow_site."
next_review: "2026-06-06"
next_step: "/sf-docs technical audit contentflow_site"
---

# Code Docs Map

Use this map before editing Astro routing, layouts, public pages, runtime content schema, SEO metadata, or static build behavior.

| Code path | Primary doc | Coverage | Reader trigger |
| --- | --- | --- | --- |
| `astro.config.mjs` | `shipflow_data/technical/astro-site-routing-and-content.md` | Astro integrations, site URL, i18n, sitemap, and build behavior | Any Astro config, sitemap, integration, or deployment-base change |
| `src/pages/**` | `shipflow_data/technical/astro-site-routing-and-content.md` | Public routes, redirects, robots, launch, sign-in, and sign-up pages | Any route, page, redirect, or public CTA change |
| `src/layouts/**` | `shipflow_data/technical/astro-site-routing-and-content.md` | Shared layout, SEO metadata, language attributes, and content rendering | Any layout, metadata, canonical, hreflang, or content-wrapper change |
| `src/components/**` | `shipflow_data/technical/astro-site-routing-and-content.md` | Shared public UI and navigation/footer components | Any public navigation, footer, CTA, or reusable component change |
| `src/content.config.ts` / `src/content/**` | `shipflow_data/technical/astro-site-routing-and-content.md` | Runtime content schema and collection content | Any content schema, collection, or Markdown frontmatter change |
| `package.json` / `package-lock.json` | `shipflow_data/technical/astro-site-routing-and-content.md` | Build scripts and dependency contract | Any Astro, sitemap, TypeScript, or build dependency change |

## Documentation Update Plan Format

```text
Documentation Update Plan:
- Status: complete | no impact | pending final integration | blocked
- Impacted docs:
  - shipflow_data/technical/<doc>.md: <required update or no change>
- Reason:
  - <why the docs are or are not current>
```

## Maintenance Rule

Update this map when covered files move, new public site surfaces are introduced, or validation responsibilities change.

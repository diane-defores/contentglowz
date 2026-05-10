---
artifact: project_context
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: contentflow_site
created: "2026-04-26"
updated: "2026-04-27"
status: reviewed
source_skill: sf-docs
scope: operations
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: low
docs_impact: yes
depends_on:
  - shipflow_data/business/business.md@1.0.0
  - shipflow_data/business/branding.md@1.0.0
  - shipflow_data/technical/guidelines.md@1.0.0
evidence:
  - README.md
  - src/config/site.ts
  - astro.config.mjs
supersedes: []
next_review: "2026-07-26"
next_step: /sf-docs audit CLAUDE.md
---

# CLAUDE.md

## Project Overview

**ContentFlow Site** — Marketing website built with Astro. Static site with blog, pricing, features, and SEO content.

## Common Commands

```bash
npm install        # Install dependencies
npm run dev        # Dev server
npm run build      # Production build
npm run preview    # Preview production build
```

## ShipFlow Development Mode

- development_mode: hybrid
- validation_surface: mixed
- ship_before_preview_test: conditional
- post_ship_verification: sf-prod
- deployment_provider: vercel
- preview_source: Vercel MCP deployment target_url
- production_url: https://contentflow.winflowz.com
- notes: Use local checks and browser preview for static Astro output. Use sf-ship -> sf-prod -> preview/browser validation for Vercel build settings, deployed headers, protected preview access, and app handoff routes.
- last_reviewed: 2026-05-03

## Architecture

- **Framework**: Astro with sitemap integration
- **Content**: Markdown collections (blog, tutorials, SEO strategy, AI agents docs, startup journey)
- **Components**: Astro components (Hero, Features, Pricing, FAQ, Navbar, Footer, Testimonials, Robots)
- **Layouts**: Layout.astro, BlogPost.astro
- **Resilience messaging**: several landing and product pages now include explicit degraded-mode messaging for backend outages (cached reads + local queue + automatic replay).

## File Structure

```
src/
├── pages/           # Routes (index, privacy, blog/)
├── layouts/         # Layout.astro, BlogPost.astro
├── components/      # Astro components
└── content/         # Markdown collections
    ├── blog/
    ├── tutorials/
    ├── seo-strategy/
    ├── ai-agents/
    ├── startup-journey/
    ├── technical-optimization/
    └── docs/
```

## Related Repos

- **contentflow_app** — Flutter application (Web, iOS, Android)
- **contentflow_lab** — FastAPI backend + AI agents (Python)

## Cross-Repo Contract Notes

- `contentflow_site` is a public Astro surface and does not own backend schema.
- If a site change affects app handoff contract (`APP_WEB_URL`, `/sign-in`, `/sign-up`, `/launch`) or public capability claims, align docs in `contentflow_app` and `contentflow_lab` in the same session.
- Keep messaging grounded in what this repo actually renders (routes, content collections, metadata, redirects).

## Content Positioning Notes

- Keep language aligned with product behavior: if a feature depends on backend availability, call out degraded-mode behavior.
- When adding content or pages describing capabilities, include the recovery message for offline support to avoid false expectations.
- Language rule: in French, always use informal address ("tu"), never "vous".
- Language rule (French): always use proper accents (accents must not be omitted).

---
artifact: project_context
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: contentflow_site
created: "2026-04-26"
updated: "2026-04-26"
status: draft
source_skill: sf-docs
scope: operations
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: low
docs_impact: yes
depends_on:
  - BUSINESS.md@0.1.0
  - BRANDING.md@0.1.0
  - GUIDELINES.md@0.1.0
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

## Backend Data Changes (Turso / libSQL)

- Production backend data lives in Turso at `libsql://contentflow-prod2-dianedef.aws-eu-west-1.turso.io`.
- If a site change also touches backend behavior, app handoff, onboarding, workspace/project data, feedback, jobs, status, or any Turso-backed API contract, always verify whether a SQL migration is required or not.
- Use the **Turso CLI** for schema checks against the real database; do not decide from code reading alone. Example: `turso db shell contentflow-prod2 ".schema"` or targeted `PRAGMA table_info(...)` queries.
- State the migration conclusion explicitly in task notes or the final response, even when no migration is needed.

## Content Positioning Notes

- Keep language aligned with product behavior: if a feature depends on backend availability, call out degraded-mode behavior.
- When adding content or pages describing capabilities, include the recovery message for offline support to avoid false expectations.
- Language rule: in French, always use informal address ("tu"), never "vous".
- Language rule (French): always use proper accents (accents must not be omitted).

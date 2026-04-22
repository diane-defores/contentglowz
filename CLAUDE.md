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

## Content Positioning Notes

- Keep language aligned with product behavior: if a feature depends on backend availability, call out degraded-mode behavior.
- When adding content or pages describing capabilities, include the recovery message for offline support to avoid false expectations.
- Language rule: in French, always use informal address ("tu"), never "vous".
- Language rule (French): always use proper accents (accents must not be omitted).

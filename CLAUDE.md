# CLAUDE.md

## Project Overview

**ContentFlowz Site** — Marketing website built with Astro. Static site with blog, pricing, features, and SEO content.

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

- **ContentFlowz-app** — Flutter application (Web, iOS, Android)
- **ContentFlowz-lab** — FastAPI backend + AI agents (Python)

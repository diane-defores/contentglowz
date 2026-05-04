# Changelog — ContentFlow Site

All notable changes to this project will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/).

## 2026-05-04

### Changed
- Documented the Vercel monorepo reconnect verification path for the site/app deployment move.

## 2026-05-03

### Changed
- Pinned Vercel install and build commands to `npm@11.12.1` so deployment matches the package engine constraint.
- Documented the ShipFlow hybrid development mode for local Astro checks plus Vercel post-ship validation.
- Refreshed stale Astro migration documentation references for Astro 6 and Content Layer collections.

### Removed
- Removed the local Python `venv/` from Git tracking and ignored it going forward.

## 2026-04-29

### Changed
- Migrated the site from Astro 5 to Astro 6 with Content Layer collections in `src/content.config.ts`.
- Updated dynamic content routes, article rendering, table-of-contents headings, related links, and breadcrumbs to use Astro 6 `render(entry)` and entry IDs.
- Updated site documentation references from the legacy `src/content/config.ts` path to `src/content.config.ts`.

### Removed
- Removed the legacy Astro content collections config at `src/content/config.ts`.

## 2026-04-22

### Added
- Added `BRANDING.md` to document the ContentFlow website brand promise, tone, and UX language.

### Changed
- Extended `CLAUDE.md` with explicit French writing rules: use informal address and always keep proper accents.

## 2026-04-20

### Added
- Resilience messaging on key marketing surfaces: Hero, How It Works, Features, and FAQ now mention offline degraded-mode behavior and local action queue synchronization.

### Changed
- Updated `README.md` to document backend outage resilience behavior for the marketing funnel.

## 2026-04-13

### Added
- Web auth routes: `/sign-in`, `/sign-up`, and `/launch` now host the Clerk web login and hand off authenticated users to the Flutter app.

### Changed
- Primary marketing CTAs now point to the website auth flow and the Flutter app launch path instead of the old generic pricing entrypoint.

## 2026-04-07

### Added
- Design: Hamburger mobile menu with animated open/close and `aria-expanded`/`aria-controls`
- Design: Skip navigation link ("Skip to content") for keyboard/screen reader users
- Design: Global `:focus-visible` outline (2px solid, WCAG 2.4.11 Focus Appearance)
- Design: `prefers-reduced-motion` media query — disables all animations/transitions
- Design: `<meta name="theme-color">` for mobile browser chrome
- Design: `aria-expanded`, `aria-controls`, `role="region"` on FAQ accordion
- Design: `aria-hidden` on rotating hero words + `aria-label` summary for screen readers
- Design: Navbar + Footer on Privacy, 404, blog index, blog posts, and tag pages (all pages now share consistent navigation)
- SEO: robots.txt, 404 page, favicon.svg, OG default image
- SEO: FAQPage, BreadcrumbList, WebSite+SearchAction, Product/Offer JSON-LD schemas
- SEO: Blog link in Navbar, explicit meta robots tag, font preload
- SEO: 6 content collection routes (ai-agents, platform, seo-strategy, startup-journey, technical-optimization, tutorials) — 42 pages total, up from 11
- Copywriting: CtaBanner component on every article page (42 pages with product CTA)
- Copywriting: ClosingCta section post-FAQ ("Ready to publish 6x more?")
- Copywriting: "Built by a solo founder. Bootstrapped." trust line in Hero
- Copywriting: persona, parcours-client, and strategie docs in docs/copywriting/
- AUDIT_LOG.md for tracking audit history

### Changed
- Design: All heading font-sizes now use `clamp(rem, rem+vw, rem)` for fluid scaling (7 components)
- Design: Fixed `clamp()` pure `vw` preferred values → `rem + vw` in BlogPost and blog index
- Design: Privacy page migrated from inline styles to scoped CSS classes
- Design: Footer added `role="contentinfo"` semantic
- Design: Global design system in Layout.astro — `.container`, `.section-header`, `.btn-primary`, `.btn-secondary` extracted from 10 components (-122 duplicate lines total)
- Design: `<link rel="apple-touch-icon">` added for mobile home screen support
- Design: 5 hardcoded hex colors (`#dbeafe`, `#e2e8f0`, `#fef3c7`, `#92400e`, `#ffffff`) tokenized as CSS custom properties
- Design: Navbar anchor links now use `/#section` format for cross-page navigation
- Design: Blog index replaced inline nav/footer with shared Navbar/Footer components
- Design: BlogPost layout and tag pages now include Navbar/Footer with proper top padding
- Homepage: "Who It's For" section moved before Pricing (identification before price ask)
- Features: reduced from 10 to 5 benefit-focused cards, jargon eliminated (CrewAI, DataForSEO, OAuth → plain language)
- Robots: "23 Agents Work Together" → "Multiple Formats, One Pipeline"
- Pricing: "SERP position tracking" / "Topical mesh analysis" → "Ranking position tracking" / "Content strategy analysis"
- BlogPost layout: collection-aware breadcrumbs, related posts, and back links
- Content config: unified schema for all 8 collections (was only blog + docs)
- Blog image alt text: descriptive prefix instead of raw title
- tsconfig: base → strict mode

### Removed
- Dead social links (#) from Footer
- 5 redundant feature cards (Scheduling, Affiliate, 23 Agents, One-Click Publish, Cookie-Free Analytics)
- Unused font-weight 300 from Google Fonts request

## 2026-04-06

### Added
- Problem section before Hero — names the pain before presenting the solution (R2)
- Cookie-Free Analytics feature card in Features section
- Analytics docs in connect-your-website guide (enable/disable via API)
- Platform docs: Social Listening, Content Quality Scoring, Link Previews

### Changed
- Brand name harmonized to "ContentFlow" across all 46 files (components, layouts, content, schema.org, OG tags)
- Testimonials section → "Who It's For" with honest persona descriptions (R4)
- Hero stats: specs (6 formats / 7 channels / 23 agents) → value metrics (5 min / 6x content / 0 platforms) (R5)
- PostHog analytics replaced with cookie-free ContentFlow analytics (<1KB, EU-hosted)
- Privacy page rewritten for cookie-free model (What We Track / What We Don't Track)
- Layout meta description updated to match product positioning

### Removed
- 8 dead footer links (/docs, /api, /guides, /about, /careers, /contact, /terms, /security) (R6)
- PostHog script and privacy opt-out UI
- Hero stats changed from specs (6 formats / 7 channels / 23 agents) to value metrics (5 min / 6x content / 0 platforms) (R5)
- Footer cleaned: removed 8 dead links (/docs, /api, /guides, /about, /careers, /contact, /terms, /security) (R6)
- Brand naming harmonized to "ContentFlow" across navbar, footer, hero, schema.org, og:site_name (R7)

# Changelog — ContentFlow Site

All notable changes to this project will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/).

## 2026-04-07

### Added
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
- Brand naming harmonized to "ContentFlowz" across navbar, footer, hero, schema.org, og:site_name (R7)

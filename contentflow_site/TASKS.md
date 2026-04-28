# Tasks — ContentFlow Site

> **Priority:** 🔴 P0 blocker · 🟠 P1 high · 🟡 P2 normal · 🟢 P3 low · ⚪ deferred
> **Status:** 📋 todo · 🔄 in progress · ✅ done · ⛔ blocked · 💤 deferred

**Stack**: Astro 5.17, TypeScript, static Vercel deployment | **Phase**: Astro 6 migration ready

**Top priority**: Implement the Astro 6 migration from `specs/SPEC-migrate-astro-v6.md` without breaking content routes, sitemap, SEO metadata, or app handoff routes.

---

## Migration

| Pri | Task | Status |
|-----|------|--------|
| 🔴 | Migrate `contentflow_site` from Astro 5 to Astro 6 using the ready spec | 📋 todo |
| 🟠 | Validate `npm run build` after migration and compare generated content routes, sitemap, `robots.txt`, and auth handoff pages | 📋 todo |
| 🟡 | Update site docs and changelog after the migration ships | 📋 todo |

---

## Completed Context

| Pri | Task | Status |
|-----|------|--------|
| ✅ | Website auth routes `/sign-in`, `/sign-up`, and `/launch` hand off authenticated users to the Flutter app | ✅ done |
| ✅ | Marketing copy documents degraded backend mode, cached reads, and local action queue behavior | ✅ done |
| ✅ | `BRANDING.md` documents the website brand promise, tone, and UX language | ✅ done |

---

## Backlog

| Pri | Task | Status |
|-----|------|--------|
| 🟢 | Re-audit marketing site SEO, accessibility, and copy after Astro 6 deployment preview is available | 💤 deferred |

---

## Audit Findings
<!-- Populated by /sf-audit — dated sections with Fixed: / Remaining: -->

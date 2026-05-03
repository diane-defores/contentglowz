# Tasks — ContentFlow Site

> **Priority:** 🔴 P0 blocker · 🟠 P1 high · 🟡 P2 normal · 🟢 P3 low · ⚪ deferred
> **Status:** 📋 todo · 🔄 in progress · ✅ done · ⛔ blocked · 💤 deferred

**Stack**: Astro 6.1, TypeScript, static Vercel deployment | **Phase**: Astro 6 cleanup shipped; Vercel post-ship verification pending

**Top priority**: Verify the post-cleanup Vercel deployment logs use `npm@11.12.1`, then re-audit the marketing site.

---

## Migration

| Pri | Task | Status |
|-----|------|--------|
| 🔴 | Migrate `contentflow_site` from Astro 5 to Astro 6 using the ready spec | ✅ done |
| 🟠 | Validate `npm run build` after migration and compare generated content routes, sitemap, `robots.txt`, and auth handoff pages | ✅ done |
| 🟡 | Update site docs and changelog after the migration ships | ✅ done |
| 🟠 | Verify post-cleanup Vercel build logs use `npm@11.12.1` after ship | 📋 todo |

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

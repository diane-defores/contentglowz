# Tasks — ContentFlow Monorepo

> **Priority:** 🔴 P0 blocker · 🟠 P1 high · 🟡 P2 normal · 🟢 P3 low · ⚪ deferred
> **Status:** 📋 todo · 🔄 in progress · ✅ done · ⛔ blocked · 💤 deferred

**Stack**: Astro marketing site, Flutter web/mobile app, FastAPI lab backend | **Phase**: Monorepo consolidated, next work is migration + production hardening

**Top priority**: Implement the ready Astro 6 migration for `contentflow_site`, then finish the backend feedback production configuration and manual Zernio smoke validation.

---

## Monorepo Coordination

| Pri | Task | Status |
|-----|------|--------|
| ✅ | Consolidate ContentFlow surfaces into the canonical monorepo | ✅ done |
| ✅ | Keep GitHub source of truth on `dianedef/contentflow` with Vercel roots for site and app | ✅ done |
| ✅ | Create root and site task tracking from existing subproject state | ✅ done |
| 🟠 | Keep root tracker, subproject trackers, and ShipFlow master dashboard aligned after each shipped task | 🔄 in progress |

---

## ContentFlow Site

| Pri | Task | Status |
|-----|------|--------|
| 🔴 | Migrate `contentflow_site` from Astro 5 to Astro 6 using `contentflow_site/specs/SPEC-migrate-astro-v6.md` | 📋 todo |
| 🟠 | Validate static build output, sitemap, `robots.txt`, content routes, SEO metadata, and auth handoff pages after migration | 📋 todo |
| ✅ | Website auth handoff, resilience messaging, and brand documentation are in place | ✅ done |

---

## ContentFlow App

| Pri | Task | Status |
|-----|------|--------|
| ✅ | Offline Sync V2 shipped with cache, queue, temp ID reconciliation, and explicit sync states | ✅ done |
| ✅ | Flutter core majors migration verified with analyze, tests, and build runner | ✅ done |
| ✅ | Light-mode contrast regression reconciled as fixed in tracker | ✅ done |
| 🟠 | Add a simplified guided tour for “publish fast” first-run mode | 📋 todo |
| 🟠 | Add a real account section in Settings for Clerk/account/provider management | 📋 todo |
| 🟠 | Finish the secondary i18n pass on partially translated screens | 🔄 in progress |

---

## ContentFlow Lab

| Pri | Task | Status |
|-----|------|--------|
| 🟠 | Finish production feedback config: `FEEDBACK_ADMIN_EMAILS`, Bunny storage env vars, connected feedback, audio upload, and admin allowlist validation | 🔄 in progress |
| 🟠 | Implement the dual-mode AI runtime all-providers spec | 🔄 in progress |
| 🟡 | Run manual Zernio smoke with a real key, two projects, connected account, forged account refusal, and provider error recovery | 📋 todo |
| 🟡 | Modernize deprecated Pydantic v1 validators and FastAPI `regex=` query parameters surfaced by publish-router tests | 📋 todo |

---

## Backlog

| Pri | Task | Status |
|-----|------|--------|
| 🟡 | DataForSEO account needs credits before DFS-backed flows can run without 402 responses | 📋 todo |
| 🟡 | App Offline V3: uploads, deletes, and backend-first flows with explicit reconciliation strategy | 📋 todo |
| 🟢 | Re-audit site SEO, accessibility, and copy after the Astro 6 preview deploy | 💤 deferred |

---

## Audit Findings
<!-- Populated by /sf-audit — dated sections with Fixed: / Remaining: -->

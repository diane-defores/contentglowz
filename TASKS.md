# Tasks — ContentFlow Monorepo

> **Priority:** 🔴 P0 blocker · 🟠 P1 high · 🟡 P2 normal · 🟢 P3 low · ⚪ deferred
> **Status:** 📋 todo · 🔄 in progress · ✅ done · ⛔ blocked · 💤 deferred

**Stack**: Astro marketing site, Flutter web/mobile app, FastAPI lab backend | **Phase**: Monorepo consolidated, site migrated, production hardening next

**Top priority**: Finish the backend feedback production configuration, continue the design-token centralization work, then run manual Zernio smoke validation.

---

## Monorepo Coordination

| Pri | Task | Status |
|-----|------|--------|
| ✅ | Consolidate ContentFlow surfaces into the canonical monorepo | ✅ done |
| ✅ | Move GitHub source of truth to `diane-defores/contentflow` with Vercel roots for site and app | ✅ done |
| ✅ | Create root and site task tracking from existing subproject state | ✅ done |
| ✅ | Bring active ShipFlow documentation metadata and governance layers back into lint compliance for app/site/root docs | ✅ done |
| ✅ | Retirer les artefacts Flutter web `contentflow_app/build` du suivi Git et laisser Vercel reconstruire `build/web` | ✅ done |
| 🟠 | Keep root tracker, subproject trackers, and ShipFlow master dashboard aligned after each shipped task | 🔄 in progress |
| ✅ | Reconnect `contentflow_site` and `contentflow_app` Vercel Git integrations to `diane-defores/contentflow`, then verify the current or next `main` SHA deploys both projects | ✅ done |

---

## ContentFlow Site

| Pri | Task | Status |
|-----|------|--------|
| 🔴 | Migrate `contentflow_site` from Astro 5 to Astro 6 using `contentflow_site/specs/SPEC-migrate-astro-v6.md` | ✅ done |
| 🟠 | Validate static build output, sitemap, `robots.txt`, content routes, SEO metadata, and auth handoff pages after migration | ✅ done |
| 🟠 | Verify post-cleanup Vercel build logs use `npm@11.12.1` after ship | 📋 todo |
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
| 🟠 | Finish Android APK CI setup: enable Blacksmith app on the repo, add `CLERK_PUBLISHABLE_KEY`, trigger the first run, download/install the APK, and verify logs via CLI | 📋 todo |

### Privacy Capture Roadmap

| Pri | Task | Status |
|-----|------|--------|
| 🟠 | Run readiness gates for Android, Web, and Windows privacy capture specs before implementation | 📋 todo |
| ✅ | Create a shared cross-platform privacy capture contract for metadata, review states, temp-file rules, disclosure copy, and backend-safe payloads | ✅ done |
| ✅ | Specify the post-production review flow for privacy captures: preview, manual correction, review acknowledgement, flattened export, and share gating | ✅ done |
| ✅ | Explore macOS privacy capture feasibility with ScreenCaptureKit, Vision, Core Image/Metal, and AVAssetWriter | ✅ done |
| ✅ | Create a cross-platform QA matrix for privacy capture: scroll, OCR misses, photos/faces, protected content, temp files, export, and browser/OS/device coverage | ✅ done |
| 🟡 | Draft legal/UX copy for best-effort disclosure and review acknowledgement, then route to legal/product review before hard-coding | 📋 todo |
| 🟡 | Decide implementation order after readiness: likely Android screenshot/privacy metadata first, then Android recording, then Web MVP, then Windows | 📋 todo |
| 🟢 | Keep iOS and Linux as exploration-only until product priority or customer demand justifies specs | 💤 deferred |

---

## ContentFlow Lab

| Pri | Task | Status |
|-----|------|--------|
| 🟠 | Finish production feedback config: `FEEDBACK_ADMIN_EMAILS`, Bunny storage env vars, connected feedback, audio upload, and admin allowlist validation | 🔄 in progress |
| 🟠 | Implement the dual-mode AI runtime all-providers spec | 🔄 in progress |
| ✅ | Consolidate Lab agent guidance into `AGENT.md` and keep `AGENTS.md` as a compatibility symlink | ✅ done |
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

### Audit: Design Tokens (2026-05-10)

| Pri | Task | Status |
|-----|------|--------|
| 🔴 | Centraliser les 722 valeurs visuelles Flutter restantes (`fontSize`, `EdgeInsets`, `BorderRadius`, couleurs directes, durations) dans `contentflow_theme.json` + helpers `AppTheme` responsives mobile | 🔄 in progress |
| 🔴 | Migrer les 223 valeurs CSS site restantes (`font-size`, spacing, radius, motion) vers les variables générées depuis `contentflow_theme.json` | 🔄 in progress |
| 🟠 | Supprimer les couleurs directes résiduelles du site (`white`, hex de démonstration hors playground, `rgba`) au profit de variables sémantiques | 📋 todo |
| 🟠 | Ajouter des tokens responsives mobile dédiés pour typographie, espacements et rayons, puis remplacer le simple `TextScaler` global de l'app par des tokens explicites | 🔄 in progress |

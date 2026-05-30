# Tasks — ContentFlow Monorepo

> **Priority:** 🔴 P0 blocker · 🟠 P1 high · 🟡 P2 normal · 🟢 P3 low · ⚪ deferred
> **Status:** 📋 todo · 🔄 in progress · ✅ done · ⛔ blocked · 💤 deferred

**Stack**: Astro marketing site, Flutter web/mobile app, FastAPI lab backend | **Phase**: Monorepo consolidated, site migrated, production hardening next

**Top priority**: Finish the design-token blocker cluster first, then advance dual-mode AI runtime and bounded production proof tasks.

---

## Priority View — 2026-05-30

Prioritization criteria: balanced impact, effort, blockers, dependency unlocks, and delay risk.

### 🔴 P0 — Critical (Do First)

| Task | Status | Impact | Effort | Why now |
|------|--------|--------|--------|---------|
| Éliminer les valeurs littérales restantes hors design tokens (Flutter 128, Site 401) | ✅ done | High | High | 2026-05-30: scan anti-literals passed under thresholds (Flutter 68/128, Site 38/401) after Flutter theme-source and shared site cleanup. |
| Implémenter un vrai mode dark côté `contentglowz_site` | ✅ done | High | Medium | 2026-05-30: semantic dark variables, selector/media strategy, theme-color, and shared component token usage implemented. |

### 🟠 P1 — High Priority

| Task | Status | Impact | Effort | Why next |
|------|--------|--------|--------|----------|
| Implement the dual-mode AI runtime all-providers spec | 🔄 in progress | High | High | Core Lab platform dependency for BYOK/platform AI behavior across providers. |
| Deploy the private Remotion Cloud Run worker with GCS env/secrets and least-privilege IAM | 📋 todo | High | Medium | Unblocks production video rendering validation. |
| Run and record the production GCS E2E proof | 📋 todo | High | Medium | Required proof before trusting preview/final video workflow in production. |
| Finish remaining feedback production checks | 📋 todo | Medium | Low | High-ROI production hardening; mostly config and manual proof. |
| Finish Android APK CI setup and first installed APK verification | 📋 todo | High | Medium | Unblocks repeatable Android distribution proof. |
| Verify post-cleanup Vercel build logs use `npm@11.12.1` | 📋 todo | Medium | Low | Quick post-ship deploy confidence check for the Astro 6 cleanup. |

### 🟡 P2 — Medium Priority

| Task | Status | Impact | Effort | Notes |
|------|--------|--------|--------|-------|
| Implement Project Intelligence Engine Data Layer | 🔄 in progress | High | High | Important foundation, but less urgent than current design/runtime blockers. |
| Implement Google Search Console intelligence spec | 🔄 in progress | Medium | High | Valuable growth feature; depends on stable project intelligence/runtime paths. |
| Implement Unified Project Asset Library remaining media integrations | 🔄 in progress | Medium | High | Continue after production render/runtime foundations are safer. |
| Run readiness gates for Android, Web, and Windows privacy capture specs | 📋 todo | Medium | Medium | Necessary before privacy-capture implementation, but not the immediate product blocker. |
| Finish the secondary i18n pass on partially translated screens | 🔄 in progress | Medium | Medium | Product polish; should not outrank blocker and proof work. |
| Add account section in Settings for Clerk/account/provider management | 📋 todo | Medium | Medium | Useful user trust feature after auth/runtime foundations. |
| Add guided tour for "publish fast" first-run mode | 📋 todo | Medium | Medium | Activation improvement after core flows are stable. |
| Modernize deprecated Pydantic v1 validators and FastAPI `regex=` query parameters | 📋 todo | Medium | Medium | Maintenance risk; schedule before the next backend dependency upgrade. |
| DataForSEO account needs credits before DFS-backed flows can run without 402 responses | 📋 todo | Medium | Low | External billing prerequisite; operator action. |
| Explore Savvio long-source pattern for idea-pool synthesis | 📋 todo | Medium | Medium | Discovery work, not yet a blocker. |

### 🟢 P3 — Low Priority / Deferred

| Task | Status | Impact | Effort | Notes |
|------|--------|--------|--------|-------|
| App Offline V3: uploads, deletes, and backend-first flows | 📋 todo | Medium | High | Valuable, but Offline V2 is already shipped. |
| Re-audit site SEO, accessibility, and copy after Astro 6 preview deploy | 💤 deferred | Medium | Medium | Wait until preview/deploy proof is complete. |
| Keep iOS and Linux privacy capture exploration-only | 💤 deferred | Low | High | Revisit only with product demand. |
| Passer vers un format DTCG puis générer automatiquement Flutter/Astro | 📋 todo | Medium | High | Good future architecture, after literal-token cleanup lands. |

### Notes

- Priority last updated: 2026-05-30
- Immediate start recommendation: move to dual-mode AI runtime, then continue opportunistic design-token cleanup as non-blocking maintenance.
- High-ROI bounded-effort opportunities: Vercel npm log verification, feedback production checks, DataForSEO credits.

---

## Monorepo Coordination

| Pri | Task | Status |
|-----|------|--------|
| ✅ | Consolidate ContentFlow surfaces into the canonical monorepo | ✅ done |
| ✅ | Move GitHub source of truth to `diane-defores/contentglowz` with Vercel roots for site and app | ✅ done |
| ✅ | Create root and site task tracking from existing subproject state | ✅ done |
| ✅ | Bring active ShipFlow documentation metadata and governance layers back into lint compliance for app/site/root docs | ✅ done |
| ✅ | Retirer les artefacts Flutter web `contentglowz_app/build` du suivi Git et laisser Vercel reconstruire `build/web` | ✅ done |
| 🟠 | Exécuter la consolidation finale du renommage `ContentGlowz/contentglowz` (restes actifs + classification) via `specs/monorepo/renommage-contentglowz-monorepo-2026-05-14.md` | 🔄 in progress |
| 🟠 | Keep root tracker, subproject trackers, and ShipFlow master dashboard aligned after each shipped task | 🔄 in progress |
| ✅ | Reconnect `contentglowz_site` and `contentglowz_app` Vercel Git integrations to `diane-defores/contentglowz`, then verify the current or next `main` SHA deploys both projects | ✅ done |

---

## ContentFlow Site

| Pri | Task | Status |
|-----|------|--------|
| 🔴 | Migrate `contentglowz_site` from Astro 5 to Astro 6 using `shipflow_data/workflow/specs/contentglowz_site/SPEC-migrate-astro-v6.md` | ✅ done |
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
| 🟠 | Finish remaining feedback production checks: Bunny storage env vars, connected feedback, audio upload, and admin allowlist validation | 📋 todo |
| 🟠 | Implement the dual-mode AI runtime all-providers spec | 🔄 in progress |
| 🟠 | Implement Project Intelligence Engine Data Layer (contentglowz_lab) | 🔄 in progress |
| 🟠 | Implement Google Search Console intelligence spec | 🔄 in progress |
| 🟠 | Implement Unified Project Asset Library spec (backend/client/editor asset picker slice verified; Image/Video/Audio integrations remain future work) | 🔄 in progress |
| 🟠 | Implement AI asset understanding auto-tagging spec (understanding jobs, tags moderation, global candidate recommendations, attach flow, Flutter picker signals) | ✅ done |
| 🟠 | Remotion Cloud Run/GCS renderer: local worker storage, backend signed playback URLs, reconciliation guardrails, Docker/runbook, and focused tests | ✅ done |
| 🟠 | Deploy the private Remotion Cloud Run worker with GCS env/secrets, least-privilege IAM, and no public invoker | 📋 todo |
| 🟠 | Run and record the production GCS E2E proof: Cloud Run health, preview -> approve -> final, two private GCS MP4s, signed URL refresh, and worker restart reconciliation | 📋 todo |
| ✅ | Implement Flux AI Provider for Image Robot backend foundation | ✅ done |
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

🟡 [contentglowz] task: Explorer le pattern Savvio source longue -> notes, carte d'idées et plan d'action pour la boîte à idées | status: todo | area: idea-pool-source-synthesis | source: description utilisateur 2026-05-24

---

## Audit Findings
<!-- Populated by /sf-audit — dated sections with Fixed: / Remaining: -->

### Audit: Design Tokens (2026-05-10)

| Pri | Task | Status |
|-----|------|--------|
| ✅ | Implémenter un vrai mode dark côté `contentglowz_site` (selector + classes/data-theme + mapping des surfaces/texte) ; aujourd’hui les design tokens dark existent dans `contentglowz_theme.json` mais ne sont pas activés dans `Layout.astro` | ✅ done |
| ✅ | Éliminer les valeurs littérales restantes hors design tokens (scan courant: Flutter 68/128, Site 38/401) en migrant d’abord les écrans App Shell/Auth/Feed/Settings + Layout/Hero/Pricing/Navbar | ✅ done |
| 🟠 | Rationaliser les design tokens orphelins ou non consommés (`--button-*`, `--space-mobile-*`, `--breakpoint-tablet/desktop`, etc.) pour réduire la dérive | 📋 todo |
| 🟠 | Corriger la cohérence d’échelle typo/spacing (ratios instables) et figer une règle modulaire unique (Utopia/base ratio) | 📋 todo |
| 🟡 | Passer vers un format DTCG (`tokens.json` avec `$value/$type`) puis générer automatiquement Flutter/Astro depuis cette source unique | 📋 todo |

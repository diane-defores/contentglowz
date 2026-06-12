# Tasks — ContentFlow Monorepo

> **Priority:** 🔴 P0 blocker · 🟠 P1 high · 🟡 P2 normal · 🟢 P3 low · ⚪ deferred
> **Status:** 📋 todo · 🔄 in progress · ✅ done · ⛔ blocked · 💤 deferred

**Stack**: Astro marketing site, Flutter web/mobile app, FastAPI lab backend | **Phase**: Monorepo consolidated, site migrated, production hardening next

**Top priority**: Continue the dual-mode AI runtime implementation, then run the remaining bounded production proof tasks.

---

## Priority View — 2026-05-30

Prioritization criteria: balanced impact, effort, blockers, dependency unlocks, and delay risk.

### 🔴 P0 — Critical (Do First)

| Task | Status | Impact | Effort | Why now |
|------|--------|--------|--------|---------|
| Shipper le fix Clerk OTP et vérifier qu'une inscription email hostée n'envoie qu'un seul code | ✅ done | High | Low | 2026-06-10: hosted browser smoke passed and user reported full email OTP sign-up PASS with a single OTP received and accepted. |

### 🟠 P1 — High Priority

| Task | Status | Impact | Effort | Why next |
|------|--------|--------|--------|----------|
| Implement the dual-mode AI runtime all-providers spec | 🔄 in progress | High | High | 2026-05-30: focused backend and Flutter automated checks pass; implementation tasks are marked complete in the spec, with real-provider manual smoke and final verify/ship still pending. |
| Deploy the private Remotion Cloud Run worker with GCS env/secrets and least-privilege IAM | 📋 todo | High | Medium | Unblocks production video rendering validation. |
| Run and record the production GCS E2E proof | 📋 todo | High | Medium | Required proof before trusting preview/final video workflow in production; depends on the private worker deploy. |
| Finish Android APK CI setup and first installed APK verification | 📋 todo | High | Medium | Unblocks repeatable Android distribution proof. |
| Finish remaining feedback production checks | 📋 todo | Medium | Low | High-ROI production hardening; mostly config and manual proof. |
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
| Rationaliser les design tokens orphelins ou non consommés | 📋 todo | Medium | Medium | Maintenance after P0 design-token closure; useful, but no longer blocking product work. |
| Corriger la cohérence d’échelle typo/spacing | 📋 todo | Medium | Medium | Design-system polish; schedule after active auth/runtime blockers. |

### 🟢 P3 — Low Priority / Deferred

| Task | Status | Impact | Effort | Notes |
|------|--------|--------|--------|-------|
| App Offline V3: uploads, deletes, and backend-first flows | 📋 todo | Medium | High | Valuable, but Offline V2 is already shipped. |
| Re-audit site SEO, accessibility, and copy after Astro 6 preview deploy | 💤 deferred | Medium | Medium | Wait until preview/deploy proof is complete. |
| Keep iOS and Linux privacy capture exploration-only | 💤 deferred | Low | High | Revisit only with product demand. |
| Passer vers un format DTCG puis générer automatiquement Flutter/Astro | 📋 todo | Medium | High | Good future architecture, after literal-token cleanup lands. |

### Notes

- Priority last updated: 2026-06-10
- Immediate start recommendation: resume dual-mode AI runtime verification/ship work, then continue bounded production proof tasks.
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
| ✅ | Ship bilingual `fr/en` core-page routing and locale-aware SEO metadata for `/`, `/launch`, `/sign-in`, `/sign-up`, and `/privacy` | ✅ done |
| 🟠 | Verify post-cleanup Vercel build logs use `npm@11.12.1` after ship | 📋 todo |
| ✅ | Website auth handoff, resilience messaging, and brand documentation are in place | ✅ done |

---

## ContentFlow App

| Pri | Task | Status |
|-----|------|--------|
| ✅ | Offline Sync V2 shipped with cache, queue, temp ID reconciliation, and explicit sync states | ✅ done |
| ✅ | Flutter core majors migration verified with analyze, tests, and build runner | ✅ done |
| ✅ | Light-mode contrast regression reconciled as fixed in tracker | ✅ done |
| ✅ | Corriger le double envoi d'email OTP Clerk pendant la création de compte email, probablement déclenché par une actualisation/re-mount impromptu de la page sign-up | ✅ done |
| ✅ | Shipper le fix Clerk OTP et vérifier sur l'app hostée qu'une inscription email n'envoie qu'un seul code | ✅ done |
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
| 🟠 | Implement the dual-mode AI runtime all-providers spec; automated backend/Flutter checks pass, manual provider smoke remains | 🔄 in progress |
| 🟠 | Implement Project Intelligence Engine Data Layer (contentglowz_lab) | 🔄 in progress |
| 🟠 | Implement Google Search Console intelligence spec | 🔄 in progress |
| 🟡 | Benchmark `models.dev` as an external AI model registry for BYOK/platform routing, pricing, context limits, output limits, capabilities, cache and fallback strategy | 📋 todo |
| 🟡 | Benchmark Auriko-style LLM inference gateway patterns for multi-provider routing, OpenAI-compatible API, failover, budget controls, BYOK, analytics, cost/latency/throughput optimization and zero-markup pricing model | 📋 todo |
| 🟡 | Benchmark Android 17 creator features for reels/shorts publishing patterns, mobile capture, Instagram quality, on-device editing, audio cleanup, tablet editing and APV implications | 📋 todo |
| 🟡 | Benchmark DataForSEO LLM Mentions API as inspiration for outsourced marketing watch, GEO, AI visibility, brand/concurrent mentions and LLM-search reporting | 📋 todo |
| 🟡 | Benchmark Firecrawl Fire PDF and `/parse` endpoint as future tooling for PDF/document ingestion and content-source pipelines | 📋 todo |
| 🟡 | Benchmark Alpic as inspiration for exposing ContentGlowz operations through MCP servers / ChatGPT Apps and agent-facing content workflows | 📋 todo |
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
| 🟢 | Explore OpenPostern-style vendor risk scoring, alerts, and next-action UX as light inspiration for future monitoring patterns | 💤 deferred |
| 🟢 | Explore Krotos-style video SFX enrichment for ContentGlowz videos | 💤 deferred |
| 🟢 | Re-audit site SEO, accessibility, and copy after the Astro 6 preview deploy | 💤 deferred |

🟡 [contentglowz] task: Explorer le pattern Savvio source longue -> notes, carte d'idées et plan d'action pour la boîte à idées | status: todo | area: idea-pool-source-synthesis | source: description utilisateur 2026-05-24
🟡 [contentglowz] task: Benchmarker models.dev comme registre externe de modèles IA pour coûts, limites, capacités, BYOK et routing provider | status: todo | area: ai-runtime-model-registry | source: veille utilisateur https://models.dev/ 2026-06-10
🟡 [contentglowz] task: Benchmarker Auriko comme inspiration gateway inference LLM pour routing multi-provider, failover, BYOK, budget controls et analytics | status: todo | area: ai-runtime-inference-gateway | source: veille utilisateur https://betalist.com/startups/auriko 2026-06-10
🟡 [contentglowz] task: Benchmarker les fonctions createur Android 17 comme inspiration reels/shorts et publication mobile | status: todo | area: reels-shorts-mobile-workflow | source: Google Blog https://blog.google/products-and-platforms/platforms/android/android-17-creator-features/ 2026-05-12
🟡 [contentglowz] task: Benchmarker DataForSEO LLM Mentions API comme inspiration de veille marketing externalisée, GEO, visibilité IA et reporting mentions marque/concurrents dans les réponses LLM | status: todo | area: outsourced-marketing-watch-ai-visibility | source: veille utilisateur https://dataforseo.com/apis/ai-optimization-api/llm-mentions-api 2026-06-10
🟡 [contentglowz] task: Benchmarker Firecrawl Fire PDF et le endpoint /parse comme outillage futur pour ingérer PDFs, documents locaux/non publics et sources longues dans la boîte à idées et les pipelines contenu | status: todo | area: content-source-ingestion | source: veille utilisateur https://www.firecrawl.dev/blog/fire-pdf-launch et https://docs.firecrawl.dev/api-reference/endpoint/parse 2026-06-10
🟡 [contentglowz] task: Benchmarker Alpic comme inspiration pour exposer ContentGlowz via MCP servers / ChatGPT Apps: création d'idées, ingestion de sources, briefs, calendrier et lancement de pipelines depuis un agent | status: todo | area: mcp-content-operations-interface | source: veille utilisateur https://alpic.ai/ et https://alpic.ai/blog/deploy-chatgpt-apps-on-alpic 2026-06-10
🟢 [contentglowz] task: Explorer OpenPostern comme inspiration légère pour scoring fournisseur, alertes et prochaines actions dans des patterns de monitoring | status: deferred | area: monitoring-score-alerts-ux | source: veille utilisateur https://betalist.com/startups/openpostern et https://openpostern.com/ 2026-06-10
🟢 [contentglowz] task: Explorer une intégration video-to-sound inspirée de Krotos pour enrichir les vidéos avec des effets sonores générés ou personnalisés | status: deferred | area: video-audio-sfx | source: veille utilisateur https://krotos.studio/ 2026-06-10

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

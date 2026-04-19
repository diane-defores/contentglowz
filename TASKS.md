# Tasks — ContentFlow (Flutter)

> **Priority:** 🔴 P0 blocker · 🟠 P1 high · 🟡 P2 normal · 🟢 P3 low · ⚪ deferred
> **Status:** 📋 todo · 🔄 in progress · ✅ done · ⛔ blocked · 💤 deferred

**Stack**: Flutter 3.41, Riverpod, GoRouter, Dio, flutter_card_swiper, Google Fonts | **Phase**: Phase 8 — Web Auth Stabilized

**Backend**: Python FastAPI (23 agents CrewAI/PydanticAI) at ContentFlow_lab/

---

## Phase 1 — Scaffold & Core Screens ✅

| Pri | Task | Status |
|-----|------|--------|
| ✅ | Projet Flutter (web + Android), pubspec, structure clean architecture | ✅ done |
| ✅ | Modèles ContentItem, ContentType, ContentStatus, PublishingChannel + JSON serialization | ✅ done |
| ✅ | API service Dio avec fallback mock data | ✅ done |
| ✅ | Riverpod providers (settings, API, content feed, history, personas) | ✅ done |
| ✅ | Theme Material 3 dark + Google Fonts | ✅ done |
| ✅ | Feed screen — swipeable cards (droite=publish, gauche=skip, haut=edit) | ✅ done |
| ✅ | Content card riche (type badge, projet, channels, preview, swipe hints) | ✅ done |
| ✅ | Editor screen — markdown preview + inline edit + publish/skip | ✅ done |
| ✅ | History screen — timeline published/rejected | ✅ done |
| ✅ | Settings screen — API URL, 7 channels, notifications | ✅ done |
| ✅ | GoRouter (13 routes) + bottom nav shell (Feed/Schedule/History/Settings) | ✅ done |

## Phase 2 — Psychology Engine & Onboarding ✅

| Pri | Task | Status |
|-----|------|--------|
| ✅ | Modèles Project, ContentTypeConfig, Persona, RitualEntry, AngleSuggestion | ✅ done |
| ✅ | Onboarding 3 pages (projet GitHub, types contenu + fréquence, résumé) | ✅ done |
| ✅ | Weekly Ritual screen (5 entry types → narrative synthesis → validation) | ✅ done |
| ✅ | Persona list screen + confidence scores | ✅ done |
| ✅ | Persona editor (name, demographics, pain points min 2, goals min 2) | ✅ done |
| ✅ | Angles screen (3 AI angles, sélection, generate content) | ✅ done |
| ✅ | Calendar screen (week strip + daily timeline) | ✅ done |
| ✅ | API service branché sur vrais endpoints (/api/status/content, /api/psychology/*) | ✅ done |
| ✅ | Content Engine section dans Settings (raccourcis ritual, personas, angles, onboarding) | ✅ done |

## Phase 3 — Backend Integration & Polish ✅

| Pri | Task | Status |
|-----|------|--------|
| ✅ | Tous les endpoints vérifiés, ContentItem.fromJson réécrit, flux complet testé | ✅ done |
| ✅ | Editor, skeleton loaders, first-launch redirect, dev serving | ✅ done |

## Phase 3b — Fixes & Wiring ✅

| Pri | Task | Status |
|-----|------|--------|
| ✅ | Angles, Schedule, Content update, Personas refresh, Ritual narrative, Persona language model | ✅ done |
| ✅ | GitHub Actions, Zernio API, Publish accounts, Channel states, Schedule API | ✅ done |
| ✅ | OAuth channel connections (Connect + Disconnect via Zernio) | ✅ done |

## Phase 4 — Auth & Workspace Migration ✅

| Pri | Task | Status |
|-----|------|--------|
| ✅ | Spec architecture, Clerk auth FastAPI + Flutter, Bootstrap, Projects, User data, Content ownership | ✅ done |
| ✅ | Flutter auth headless Clerk, session restore, onboarding réel, 401 handling | ✅ done |
| ✅ | Écran auth Clerk officiel + fallback diagnostics quand le SDK reste bloqué au chargement | ✅ done |
| ✅ | Auth web déportée sur ContentFlow Site + handoff sécurisé vers Flutter web (`/entry` + exchange backend) | ✅ done |
| ✅ | Vérifier runtime Clerk réel en environnement Flutter | ✅ done |
| ✅ | Remplacer l'auth web Flutter beta / handoff par ClerkJS officiel sur le domaine app (`/sign-in`, `/sso-callback`, Google direct) | ✅ done |
| ✅ | Corriger le callback OAuth Clerk web pour finaliser la session sur `/sso-callback` avant le retour vers `/#/entry` | ✅ done |
| ✅ | Bloquer la création workspace/onboarding tant qu'aucune session Clerk authentifiée n'est présente | ✅ done |
| ✅ | Introduire un `AppAccessState` central pour séparer session Clerk, health FastAPI et bootstrap workspace | ✅ done |
| ✅ | Ajouter un mode dégradé avec shell limité, diagnostics enrichis et warning global quand FastAPI tombe | ✅ done |

---

## Phase 5 — Unified Content Pipeline (2026-03-26) ✅

> Unifier les 3 pipelines déconnectés (Psychology, SEO, Newsletter) en un flux unique:
> Sources → Idea Pool → Angles enrichis → Pipelines par format → Review Queue

### Backend (contentflow/)

| Pri | Task | Status |
|-----|------|--------|
| ✅ | Étendre enums ContentType (short, social_post) et SourceRobot (short, social) | ✅ done |
| ✅ | Idea Pool — modèle, table SQLite, CRUD StatusService, API `/api/ideas` | ✅ done |
| ✅ | Enrichir Angle Strategist — accepte seo_signals + trending_signals, retourne priority_score + seo_keyword | ✅ done |
| ✅ | Pipeline dispatch — `POST /api/psychology/dispatch-pipeline` remplace le placeholder render-extract | ✅ done |
| ✅ | Short Content Agent — CrewAI agent pour TikTok/Reels/Shorts (hook, script, hashtags) | ✅ done |
| ✅ | Social Post Agent — CrewAI agent pour Twitter/LinkedIn/Instagram (platform-adapted posts) | ✅ done |
| ✅ | Scheduler complet — _run_seo_job, _run_article_job implémentés + _run_short_job, _run_social_job ajoutés | ✅ done |
| ✅ | Config fréquence — ContentFrequencyConfig dans RobotSettings + _reconcile_frequency_jobs dans scheduler | ✅ done |
| ✅ | Sources → Idea Pool — ingest_newsletter_inbox, ingest_seo_keywords, ingest_weekly_ritual | ✅ done |
| ✅ | Scheduler ingestion jobs — ingest_newsletters, ingest_seo job types + API triggers manuels | ✅ done |
| ✅ | Nettoyage legacy JS — suppression chatbot/ Next.js (41 MB), prototypes v0, BMAD framework | ✅ done |

### Flutter (contentflow-app/)

| Pri | Task | Status |
|-----|------|--------|
| ✅ | ContentType.short dans enum Dart + parser/serializer | ✅ done |
| ✅ | Metadata helpers — seoKeyword, shortPlatform, shortDuration, socialPlatforms, etc. | ✅ done |
| ✅ | Content card — chips métadonnées par format (SEO, plateforme, durée, hashtags) | ✅ done |
| ✅ | Editor — barre de métadonnées contextuelle par content type | ✅ done |
| ✅ | Theme — couleur Short (coral red) | ✅ done |
| ✅ | Angles screen → dispatch-pipeline endpoint (vraie génération) avec fallback | ✅ done |
| ✅ | ApiService — dispatchPipeline() + getPipelineStatus() | ✅ done |
| ✅ | Settings — section Content Frequency (sliders blog/newsletter/short/social) | ✅ done |

## Phase 6 — DataForSEO Integration (2026-03-27) ✅

> Intégrer DataForSEO API v3 comme source de données SEO réelles dans tout le pipeline.
> Remplace SerpApi (SERP-only) + Advertools (combos mock) par une API unifiée.

### Backend (contentflow/)

| Pri | Task | Status |
|-----|------|--------|
| ✅ | Client DataForSEO API v3 — `dataforseo_client.py` (SERP, keywords, trends, competitors, intent) | ✅ done |
| ✅ | Provider DFS — `dataforseo_provider.py` (DFSSERPAnalyzer, DFSTrendMonitor, DFSKeywordGapFinder, DFSRankingPatternExtractor) | ✅ done |
| ✅ | Supprimer SerpApi — `research_tools.py` réécrit, DFS direct, mêmes @tool wrappers CrewAI | ✅ done |
| ✅ | Niveau 1 — `ingest_seo_keywords` réécrit avec DFS keyword_ideas + keyword_overview (vrais volume/difficulty/CPC) | ✅ done |
| ✅ | Niveau 2 — `enrich_ideas` batch-enrichit les idées raw via DFS keyword_overview → priority_score | ✅ done |
| ✅ | Niveau 3 — `ingest_competitor_watch` via DFS domain_intersection + ranked_keywords → idées competitor_watch | ✅ done |
| ✅ | Niveau 4 — `track_serp_positions` vérifie le ranking Google post-publication → serp_history dans metadata | ✅ done |
| ✅ | Scheduler jobs — enrich_ideas, ingest_competitors, track_serp wired dans scheduler_service.py | ✅ done |
| ✅ | API endpoints — POST /api/ideas/enrich, /ingest/competitors, /track-serp | ✅ done |
| ✅ | Gap 1 fix — `_run_article_job` passe seo_signals + competitor_domains au SEO Crew | ✅ done |
| ✅ | Gap 2 fix — Bridge optionnel Idea Pool → Angle Strategist dans _run_article_job (opt-in) | ✅ done |
| ✅ | Gap 3 fix — Feedback loop SERP → idées refresh (`_evaluate_serp_feedback`, 3 triggers) | ✅ done |
| ✅ | Config — DFS_CONFIG dans research_config.py, .env.example mis à jour | ✅ done |

## Phase 7 — Legacy Domain Migration (2026-03-28) ✅

> Re-implement all 13 domains deleted with legacy Node.js chatbot.
> Scrollable nav replaces fixed 4-tab NavigationBar. Pattern: SQL migration + Pydantic + store + router + Flutter screen.

### Backend Lab — New domains

| Pri | Task | Status |
|-----|------|--------|
| ✅ | Affiliations — migration SQL + modèle Pydantic + store CRUD 5 méthodes + router 5 endpoints | ✅ done |
| ✅ | Activity Log — migration SQL + store list/create + router 2 endpoints | ✅ done |
| ✅ | Work Domains — migration SQL + store list/create/update + router 3 endpoints | ✅ done |
| ✅ | Idempotent table creation au démarrage FastAPI (ensure_*_table dans lifespan) | ✅ done |

### Flutter — New screens (13 écrans)

| Pri | Task | Status |
|-----|------|--------|
| ✅ | Navigation scrollable horizontale (remplace NavigationBar fixe 4 tabs → 17 tabs) | ✅ done |
| ✅ | Affiliations — liste + stats + filtres status/category + formulaire BottomSheet CRUD | ✅ done |
| ✅ | Activity — timeline des actions robots/utilisateur avec badges status | ✅ done |
| ✅ | Runs — liste historique des runs robots | ✅ done |
| ✅ | Templates — galerie des templates par défaut | ✅ done |
| ✅ | Newsletter — check config + formulaire génération async | ✅ done |
| ✅ | Research — formulaire analyse concurrentielle + résultats | ✅ done |
| ✅ | Reels — download Instagram reel + extract audio + upload CDN | ✅ done |
| ✅ | SEO Mesh — analyse topical mesh + issues + recommandations | ✅ done |
| ✅ | Content Tools — 3 tabs : validations pendantes, funnel clusters SEO, audit contenu | ✅ done |
| ✅ | Work Domains — cards status par domaine (SEO, Newsletter, etc.) | ✅ done |
| ✅ | Analytics — pipeline funnel + content par type + channels + timeline publication | ✅ done |
| ✅ | Performance — stats dashboard (total, pending, published, rejected, par type) | ✅ done |
| ✅ | Uptime — health check API + ping history avec latence | ✅ done |

---

## P1 — Prochaines priorités

| Pri | Task | Impact | Effort | Notes |
|-----|------|--------|--------|-------|
| ✅ | Regrouper les 17 tabs en sections (Content, Create, Analyze, System) | High | Low | ✅ done — dividers visuels entre sections |
| ✅ | Validation runtime Clerk (site sign-in réel, handoff web, restore session, `/api/bootstrap`) | High | Medium | ✅ done — auth web directe via ClerkJS sur le domaine app, bootstrap validé |
| ✅ | OAuth flow pour connecter les channels (via LATE/Zernio) | High | Medium | ✅ done — Connect + Disconnect complets |
| ✅ | Landing page produit (ContentFlow_site rebrand complet) | High | Medium | ✅ done — Hero, Features, How It Works, Pricing Free/19/49, Use Cases, FAQ |
| 🟠 | Polar.sh Billing (free, 19€, 49€) | High | Medium | Débloqué maintenant que l'auth Clerk web est stable |
| ✅ | Tests end-to-end pipeline | High | Low | ✅ done — test_e2e_pipeline.py + test_new_domains.py dans lab |
| 🟡 | DataForSEO — credentials OK dans Doppler, ajouter credits au compte DFS | High | Low | Auth OK (20000), mais 402 Payment Required — ajouter credits sur dataforseo.com/billing |
| 🟠 | Exposer l'audit structuré des actions (`actor_type/id/label`) dans l'UI debug/admin | High | Medium | Le backend persiste déjà transitions, edits et reviews avec acteurs structurés |

### 🟡 P2 — Polish & Engagement

| Pri | Task | Status |
|-----|------|--------|
| ✅ | Bulk approve (approve all pending in one tap) | ✅ done |
| ✅ | Responsive layout web (side rail on desktop, bottom nav on mobile) | ✅ done |
| ✅ | Preview post par plateforme (Twitter, LinkedIn, Instagram, Ghost, YouTube, TikTok) | ✅ done |
| ✅ | Stats post-publication (destinations breakdown + approval rate) | ✅ done |
| ✅ | Landing page rebrand (hero, features, pricing, use cases, FAQ) | ✅ done |
| ✅ | Firebase Cloud Messaging scaffold (service layer ready, needs Firebase config) | ✅ done |
| ✅ | Mobile UX audit — bottom nav redesign, responsive typography, touch targets, layout fixes | ✅ done |
| ✅ | Rebrand produit `ContentFlowz` → `ContentFlow` (nom app, package Android, manifests web, scripts et docs) | ✅ done |

### 🟠 P1 — Content Drip (Publication Progressive)

| Pri | Task | Status |
|-----|------|--------|
| ✅ | Étape 1 — Fondations : SourceRobot.DRIP + table drip_plans + DripService CRUD + router /api/drip/ | ✅ done |
| ✅ | Étape 2 — Import + clustering DIRECTORY : scanner .md, créer ContentRecords, grouper par dossiers | ✅ done |
| ✅ | Étape 3 — Scheduling + Execution : cadence fixe/ramp-up, frontmatter updater, rebuild trigger, cron tick, plan lifecycle (activate/pause/resume/cancel) | ✅ done |
| ✅ | Étape 4 — Clustering avancé : cluster_by_tags + cluster_auto via Topical Mesh Architect (fallback gracieux si crewai absent) | ✅ done |
| ✅ | Étape 5 — GSC : GSCClient (Indexing API submit + URL Inspection API check), endpoints /gsc/submit-urls et /gsc/indexation-status, auto-submit dans execute-tick | ✅ done |
| 🟠 | Étape 6 — Flutter UI : écran liste plans + wizard création + dashboard progression + actions lifecycle | 🔄 in progress |

### 🟢 P3 — Backlog

| Pri | Task | Status |
|-----|------|--------|
| 🟢 | Gmail OAuth integration | 💤 deferred (complex OAuth flow) |
| 🟢 | iOS support | 💤 deferred |
| 🟢 | Mode offline (cache local + sync) | 💤 deferred |
| 🟢 | Image generation (Robolly) | 💤 deferred |
| 🟢 | Video script → teleprompter mode | 💤 deferred |
| 🟢 | A/B testing de hooks/titles | 💤 deferred |
| 🟢 | Newsletter preview HTML | 💤 deferred |
| 🟢 | App Store / Play Store submission | 💤 deferred |

---

> **Priority last updated**: 2026-04-19
> **Criteria**: Impact/effort matrix — "what makes the product actually work"
> **Recommended next**: Brancher Polar billing, exposer l'audit structuré dans l'UI debug/admin, puis finaliser les crédits DataForSEO

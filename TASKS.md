# Tasks — ContentFlowz (Flutter)

> **Priority:** 🔴 P0 blocker · 🟠 P1 high · 🟡 P2 normal · 🟢 P3 low · ⚪ deferred
> **Status:** 📋 todo · 🔄 in progress · ✅ done · ⛔ blocked · 💤 deferred

**Stack**: Flutter 3.41, Riverpod, GoRouter, Dio, flutter_card_swiper, Google Fonts | **Phase**: Phase 5 — Unified Content Pipeline

**Backend**: Python FastAPI (23 agents CrewAI/PydanticAI) at `/home/claude/my-robots/`

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
| 🟠 | OAuth channel connections | 📋 todo |

## Phase 4 — Auth & Workspace Migration ✅

| Pri | Task | Status |
|-----|------|--------|
| ✅ | Spec architecture, Clerk auth FastAPI + Flutter, Bootstrap, Projects, User data, Content ownership | ✅ done |
| ✅ | Flutter auth headless Clerk, session restore, onboarding réel, 401 handling | ✅ done |
| 🟠 | Vérifier runtime Clerk réel en environnement Flutter | 📋 todo |

---

## Phase 5 — Unified Content Pipeline (2026-03-26) ✅

> Unifier les 3 pipelines déconnectés (Psychology, SEO, Newsletter) en un flux unique:
> Sources → Idea Pool → Angles enrichis → Pipelines par format → Review Queue

### Backend (my-robots/)

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

### Flutter (my-robots-app/)

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

---

## P1 — Prochaines priorités

| Pri | Task | Impact | Effort | Notes |
|-----|------|--------|--------|-------|
| 🟠 | Validation runtime Clerk (login/signup réel, restore session, `/api/bootstrap`) | High | Medium | Code branché, reste à valider en runtime Flutter réel |
| 🟠 | OAuth flow pour connecter les channels (via LATE) | High | Medium | Bouton Connect est encore un placeholder UI |
| 🟠 | Landing page produit | High | Medium | Première version dans EntryScreen; à extraire vers site marketing |
| 🟠 | Stripe Billing (free, 19€, 49€) | High | Medium | Bloqué par Auth |
| 🟠 | Tests end-to-end pipeline — tester un flux complet angle → dispatch → contenu généré → review queue | High | Low | Le code est en place, il faut valider avec le vrai backend |

### 🟡 P2 — Polish & Engagement

| Pri | Task | Notes |
|-----|------|-------|
| 🟡 | Preview du post par plateforme | Nice to have, s'inspirer de v0-neobrutalist-ui-design_ |
| 🟡 | Bulk approve (swipe tout, valider par lot) | Quick win quand volume de contenu augmente |
| 🟡 | Responsive layout web (adaptive scaffold) | Pour users desktop |
| 🟡 | Firebase Cloud Messaging (push notifications) | Mobile-only |
| 🟡 | Statistiques post-publication | Dépend des APIs plateforme |
| 🟡 | Landing dédiée avec hero orienté outcome | Preuves produit, FAQ, pricing |

### 🟢 P3 — Backlog

| Pri | Task | Status |
|-----|------|--------|
| 🟢 | iOS support | 💤 deferred |
| 🟢 | Mode offline (cache local + sync) | 💤 deferred |
| 🟢 | Image generation (Robolly) | 💤 deferred |
| 🟢 | Video script → teleprompter mode | 💤 deferred |
| 🟢 | A/B testing de hooks/titles | 💤 deferred |
| 🟢 | Newsletter preview HTML | 💤 deferred |
| 🟢 | App Store / Play Store submission | 💤 deferred |
| 🟢 | Analytics dashboard | 💤 deferred |

---

> **Priority last updated**: 2026-03-26
> **Criteria**: Impact/effort matrix — "what makes the product actually work"
> **Recommended next**: Valider le flux Clerk réel en runtime, puis tests end-to-end du pipeline unifié avec le vrai backend, puis OAuth channels

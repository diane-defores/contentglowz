# Tasks — ContentFlowz (Flutter)

> **Priority:** 🔴 P0 blocker · 🟠 P1 high · 🟡 P2 normal · 🟢 P3 low · ⚪ deferred
> **Status:** 📋 todo · 🔄 in progress · ✅ done · ⛔ blocked · 💤 deferred

**Stack**: Flutter 3.41, Riverpod, GoRouter, Dio, flutter_card_swiper, Google Fonts | **Phase**: Phase 4 nearly complete — runtime validation and JS decommission still pending

**Backend**: Python FastAPI (19 agents CrewAI/PydanticAI) at `/home/claude/my-robots/`

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

> Brancher l'app sur le backend FastAPI réel, tester les flux end-to-end

| Pri | Task | Status |
|-----|------|--------|
| ✅ | Vérifier endpoints FastAPI existants (status, transition, body, schedule — tous OK) | ✅ done |
| ✅ | ContentItem.fromJson réécrit — parse backend ContentResponse + mock data | ✅ done |
| ✅ | TransitionRequest aligné (changed_by obligatoire, reason optionnel) | ✅ done |
| ✅ | Tester flux complet avec test_server.py (feed, approve, reject, body, narrative, angles) | ✅ done |
| ✅ | Editor charge body via /api/status/content/{id}/body + sauvegarde versions | ✅ done |
| ✅ | Skeleton loaders (shimmer animation) dans le feed | ✅ done |
| ✅ | First-launch → redirect /onboarding (SharedPreferences) | ✅ done |
| ✅ | Dev serving via PM2 + server.js (port 3050) + test_server.py (port 8000) | ✅ done |

## Phase 3b — Fixes & Wiring (2026-03-23)

| Pri | Task | Status |
|-----|------|--------|
| ✅ | Angles — vraie persona (picker), contexte narratif du ritual, génération de contenu câblée | ✅ done |
| ✅ | Schedule — date/time picker + section "Ready to Schedule" pour items approved | ✅ done |
| ✅ | Content update — updateContent() et saveContentBody() retournent bool, feedback UI dans éditeur | ✅ done |
| ✅ | Personas refresh — ref.invalidate(personasProvider) après save | ✅ done |
| ✅ | Ritual → lastNarrativeProvider — narrative persistée entre écrans | ✅ done |
| ✅ | Persona language model editor (vocabulary, objections) dans persona_editor_screen | ✅ done |
| ✅ | GitHub Actions workflow build APK + Web (.github/workflows/build.yml) | ✅ done |
| ✅ | Intégration Zernio API — backend router + Flutter publish flow | ✅ done |
| ✅ | Publish accounts — vrais account IDs Zernio/LATE résolus depuis /api/publish/accounts | ✅ done |
| ✅ | Settings — état des channels connecté/non connecté branché sur données réelles | ✅ done |
| ✅ | Approve → publish — feedback utilisateur réel (succès / warning / erreur) | ✅ done |
| ✅ | Schedule API contract — PATCH aligné avec le backend FastAPI | ✅ done |
| 🟠 | OAuth channel connections | 📋 todo |
| ✅ | Backend publish persistence — stocker post_id / platform_urls / target_url dans le ContentRecord | ✅ done |

---

## Phase 4 — Auth & Workspace Migration (2026-03-23)

| Pri | Task | Status |
|-----|------|--------|
| ✅ | Spec architecture cible — Astro + Flutter + FastAPI + Clerk sans runtime Next.js | ✅ done |
| ✅ | FastAPI auth foundation — validation Clerk JWT/JWKS + dependency current user | ✅ done |
| ✅ | Bootstrap backend — endpoints /api/me et /api/bootstrap | ✅ done |
| ✅ | Projects router — remplacement de default-user + ownership checks | ✅ done |
| ✅ | FastAPI user data — migrer settings, creator-profile, personas depuis la DB existante | ✅ done |
| ✅ | Content ownership — durcir l'accès ContentRecord côté backend | ✅ done |
| ✅ | Flutter auth abstraction — session/token provider + interceptor Dio avant intégration Clerk UI | ✅ done |
| ✅ | Flutter bootstrap réel — gate d'entrée branché sur session + `/api/bootstrap` avec fallback demo | ✅ done |
| ✅ | Demo onboarding figé — repo public prérempli + données démo servies en lecture seule | ✅ done |
| ✅ | Flutter auth réelle — remplacer l'état local par la session Clerk | ✅ done |
| ✅ | Clerk UI Flutter/Web — écran login/signup headless + récupération du bearer token | ✅ done |
| ✅ | Flutter data migration — settings, personas, creator-profile branchés sur FastAPI | ✅ done |
| ✅ | Onboarding réel — création d'un workspace via FastAPI au lieu d'un flag local | ✅ done |
| ✅ | Private API strictness — suppression des fallbacks mock silencieux sur routes authentifiées | ✅ done |
| ✅ | Gestion centralisée des `401` — invalidation session et retour vers auth/entry | ✅ done |
| 🟠 | Vérifier runtime Clerk réel — `flutter pub get`, login, bootstrap, persistence session | 📋 todo |
| 🟠 | Valider la parité Flutter/FastAPI complète avant suppression du runtime Next.js | 📋 todo |

---

## Priorités recalculées (2026-03-23)

> Critères : impact/effort matrix + "qu'est-ce qui fait que le produit FONCTIONNE vraiment"
> Le coeur du produit = l'IA génère → l'humain swipe → le contenu est publié. Sans publishing réel, c'est un prototype.

### 🔴 P0 — Quick Wins (High Impact, Low Effort) — FAIRE MAINTENANT

| Pri | Task | Impact | Effort | Notes |
|-----|------|--------|--------|-------|
| ✅ | Intégration Zernio/LATE API (publication multi-plateforme) | **Critical** | Medium | ✅ done — Backend: /api/publish router + Flutter: approve() déclenche publishContent() |
| ✅ | Persona language model editor (vocabulary, objections, triggers) | High | **Low** | ✅ done — vocabulary + objections dans persona editor |
| ✅ | Scheduling datetime picker | High | **Low** | ✅ done — date+time picker, section "Ready to Schedule", scheduleContent() câblé |
| ✅ | GitHub Actions workflow pour build APK | Medium | **Low** | ✅ done — .github/workflows/build.yml (APK + Web) |

### 🟠 P1 — Nécessaire pour des utilisateurs externes

| Pri | Task | Impact | Effort | Notes |
|-----|------|--------|--------|-------|
| ✅ | FastAPI user bootstrap (settings, creator-profile, personas) | High | Medium | ✅ done — endpoints migrés dans FastAPI. |
| ✅ | Content ownership backend | High | Medium | ✅ done — routes status/content maintenant filtrées par ownership projet. |
| ✅ | Flutter auth abstraction + bootstrap réel | High | Medium | ✅ done — router/entry/api passent désormais par une vraie couche session + bootstrap backend. |
| 🟠 | Validation runtime Clerk (login/signup, restore session, `/api/bootstrap`) | High | Medium | Le code est branché; il reste la validation réelle en environnement Flutter. |
| ✅ | Démo produit figée sur un repo public avec onboarding conservé en lecture seule | High | Low | ✅ done — seed unique, champs préremplis/verrouillés, mocks et test_server alignés. |
| 🟠 | OAuth flow pour connecter les channels (via LATE) | High | Medium | Prochaine vraie étape publish: le bouton Connect est encore un placeholder UI. |
| ✅ | Persister les métadonnées publish backend (post_id, platform_urls, target_url) | High | Medium | ✅ done — `/api/publish` persiste maintenant les métadonnées Zernio dans `ContentRecord.metadata.publish`, renseigne `target_url`, et aligne les transitions `approved/scheduled -> publishing -> published`. |
| 🟠 | Landing page produit | High | Medium | Nécessaire pour acquisition. Une première version existe maintenant dans `EntryScreen`; à extraire ensuite vers un site marketing dédié. |
| 🟠 | Stripe Billing (free, 19€, 49€) | High | Medium | Bloqué par Auth. |

### 🟡 P2 — Polish & Engagement

| Pri | Task | Impact | Effort | Notes |
|-----|------|--------|--------|-------|
| 🟡 | Firebase Cloud Messaging (push notifications) | Medium | Medium | Mobile-only. Pas critique pour web. |
| 🟡 | Preview du post par plateforme | Medium | Medium | Nice to have, améliore confiance avant publish. |
| 🟡 | Bulk approve (swipe tout, valider par lot) | Medium | Low | Quick win futur — quand le volume de contenu augmente. |
| 🟡 | Error handling amélioré | Low | Low | Polish. |
| 🟡 | Multi-tenant backend | High | High | Gros chantier, seulement si SaaS confirmé. |
| 🟡 | Responsive layout web (adaptive scaffold) | Medium | Medium | Pour quand y a des users desktop. |
| 🟡 | Statistiques post-publication | Medium | High | Dépend des APIs plateforme. |

### 🟡 P2 — Conversion & Positioning Backlog (inspiré de l’analyse Tugan.ai, adapté au vrai produit)

| Pri | Task | Impact | Effort | Notes |
|-----|------|--------|--------|-------|
| 🟡 | Landing dédiée avec hero orienté outcome | High | Medium | Promesse plus nette: repo → angles → swipe → publish, au lieu d’une simple entrée auth. |
| 🟡 | Section "Sans ContentFlowz / Avec ContentFlowz" | High | Low | Rend le coût du workflow manuel plus concret, comme sur Tugan, mais avec vos vrais pains: prompts, validation, publishing. |
| 🟡 | Galerie de preuves produit | High | Medium | Captures réelles du feed, personas, angles, scheduler, plus exemples avant/après. |
| 🟡 | FAQ anti-objections | Medium | Low | Répondre clairement à "Pourquoi pas juste ChatGPT ?", "Comment la démo marche ?", "Qu’est-ce qui est déjà publié pour de vrai ?". |
| 🟡 | Démo guidée orientée activation | High | Medium | Transformer le "demo workspace" en mini product tour avec checkpoints et CTA de création de workspace. |
| 🟡 | Cas d’usage par persona | Medium | Medium | Variante founder, creator, agency, indie hacker avec même moteur mais promesses différentes. |
| 🟡 | Bibliothèque d’exemples générés | High | Medium | Montrer articles, newsletters, posts sociaux et scripts vidéo issus d’un même produit. |
| 🟡 | Preuves de publication réelle | High | Medium | Afficher URLs publiées, statuts de diffusion, comptes connectés, et limites actuelles du système. |
| 🟡 | ROI / time-saved calculator | Medium | Medium | Estimer heures gagnées entre idéation, rédaction, validation et publication. |
| 🟡 | Pricing page ancrée sur le workflow | High | Medium | Packager par volume, channels, publishing réel et collaboration, pas seulement par génération IA. |

### 🟢 P3 — Backlog

| Pri | Task | Status |
|-----|------|--------|
| 🟢 | iOS support (ajouter platform) | 💤 deferred |
| 🟢 | Mode offline (cache local + sync) | 💤 deferred |
| 🟢 | Image generation preview dans l'editor (Robolly) | 💤 deferred |
| 🟢 | Video script → teleprompter mode | 💤 deferred |
| 🟢 | A/B testing de hooks/titles | 💤 deferred |
| 🟢 | Newsletter preview HTML | 💤 deferred |
| 🟢 | App Store / Play Store submission | 💤 deferred |
| 🟢 | Analytics dashboard | 💤 deferred |
| 🟢 | Whitelabel / API tierces | 💤 deferred |

---

> **Priority last updated**: 2026-03-25
> **Criteria**: Impact/effort matrix — "what makes the product actually work"
> **Recommended next**: Finir l’OAuth publish in-app côté Flutter, puis valider le flux Clerk réel en runtime (`CLERK_PUBLISHABLE_KEY`, login, restore session, `/api/bootstrap`) avant la vérification de parité finale et le retrait du runtime Next.js

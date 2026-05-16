---
artifact: agent_context
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: contentglowz_site
created: "2026-04-26"
updated: "2026-04-27"
status: reviewed
source_skill: sf-docs
scope: technical_core
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: low
docs_impact: yes
depends_on:
  - CLAUDE.md@1.0.0
  - shipflow_data/business/business.md@0.1.0
  - shipflow_data/business/branding.md@0.1.0
  - shipflow_data/technical/guidelines.md@1.0.0
evidence:
  - README.md
  - CLAUDE.md
  - src/config/site.ts
  - src/content.config.ts
  - src/pages
  - src/components
  - astro.config.mjs
  - vercel.json
supersedes: []
next_review: "2026-07-26"
next_step: /sf-docs audit AGENT.md
---

# AGENT — contentglowz_site (site marketing Astro)

## Mission
- Garder `contentglowz_site` comme surface d’entrée public stable, cohérente et fidèle au comportement réel de l’écosystème ContentGlowz.
- Traiter ce repo comme un **site de marketing + documentation SEO + conversion vers l’application**, pas comme un backend métier.
- Aligner `README.md`, `shipflow_data/business/branding.md`, `shipflow_data/technical/guidelines.md`, `shipflow_data/business/business.md` et les artefacts contextuels à chaque changement de route, d’handoff ou de contenu majeur.

## Mandat technique
1. **Rendu Astro**
  - Construire et publier un site généré côté build via Astro.
  - Utiliser des composants Astro (`src/components`, `src/layouts`) et des routes `src/pages`.
2. **Données éditoriales**
  - Utiliser les collections Markdown sous `src/content/*`.
  - Laisser `src/content.config.ts` comme source de vérité pour validation et normalisation du frontmatter.
3. **Handoff vers l’app**
  - Conserver les redirections officielles:
    - `/sign-in` -> `APP_WEB_URL + /sign-in`
    - `/sign-up` -> `APP_WEB_URL + /sign-up`
    - `/launch` -> `APP_WEB_URL + /#/entry`
  - Préserver la logique de propagation de `redirect_url` quand présente.
4. **Surface publique**
  - Les pages de contenu, FAQ, blog, pricing et trust pages doivent rester en phase avec `shipflow_data/business/branding.md` et la promesse de résilience.
5. **Sécurité opérationnelle**
  - Conserver les headers HTTP de production (`vercel.json`) et les tags `noindex` quand nécessaire.
  - Préserver `rel="preload"`/`script` d’analytics cookie-free selon l’environnement.

## Invariants à respecter
- Ne jamais réactiver un flux d’authentification local côté site en dehors de la redirection vers `app.contentglowz.com`.
- Ne jamais retirer la logique de routes dynamiques (`getStaticPaths`) qui alimente le référencement documentaire.
- Ne jamais casser la navigation principale (`/`, `/blog`, `/privacy`, `/#features`, `/#pricing`, `/#faq`).
  - Les variables d’environnement de handoff (`APP_SITE_URL`, `APP_WEB_URL`, `API_BASE_URL`) doivent rester explicites et documentées.

## Gouvernance de modif
- Après toute évolution de routing ou d’architecture du site:
  - Mettre à jour `shipflow_data/technical/context.md`.
  - Mettre à jour `shipflow_data/technical/context-function-tree.md`.
  - Mettre à jour `shipflow_data/technical/architecture.md`.
  - Vérifier que `README.md` et `CLAUDE.md` restent synchronisés.

## Vérifications de finalisation
- `npm run build` doit rester opérationnel.
- Les routes de redirection et de contenu doivent continuer de générer des pages indexables.
- Les métadonnées SEO de base (`canonical`, `og`, `twitter`, `schema`) doivent rester cohérentes.

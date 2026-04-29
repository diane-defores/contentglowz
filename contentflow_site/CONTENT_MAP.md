---
artifact: content_map
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "contentflow_site"
created: "2026-04-26"
updated: "2026-04-27"
status: "reviewed"
source_skill: sf-docs
scope: content-map
owner: "Diane"
confidence: medium
risk_level: low
security_impact: none
docs_impact: "yes"
content_surfaces:
  - "Landing pages: src/pages/index.astro"
  - "Conversion pages: src/pages/launch.astro, src/pages/sign-in.astro, src/pages/sign-up.astro, src/pages/privacy.astro"
  - "Blog: src/pages/blog/** + src/content/blog"
  - "Tutorials: src/pages/tutorials/[...slug].astro + src/content/tutorials"
  - "SEO strategy: src/pages/seo-strategy/[...slug].astro + src/content/seo-strategy"
  - "AI agents: src/pages/ai-agents/[...slug].astro + src/content/ai-agents"
  - "Tech & platform: src/pages/platform/[...slug].astro + src/content/platform"
  - "Startup journey: src/pages/startup-journey/[...slug].astro + src/content/startup-journey"
  - "Technical optimization: src/pages/technical-optimization/[...slug].astro + src/content/technical-optimization"
  - "Docs internes: src/content/docs/**/*"
  - "Runtime files: src/pages/*.astro, src/layouts/*.astro, src/components/*.astro"
  - "Config & infra: src/config/site.ts, astro.config.mjs, .env.example"
evidence:
  - "src/content"
  - "src/pages"
  - "src/layouts"
  - "src/components"
  - "src/config/site.ts"
  - "BRANDING.md"
  - "BUSINESS.md"
  - "GUIDELINES.md"
linked_artifacts:
  - "BRANDING.md@1.0.0"
  - "BUSINESS.md@1.0.0"
  - "GUIDELINES.md@1.0.0"
  - "PRODUCT.md@1.0.0"
  - "GTM.md@1.0.0"
depends_on:
  - "BUSINESS.md@1.0.0"
  - "PRODUCT.md@1.0.0"
  - "GTM.md@1.0.0"
supersedes: []
next_review: "2026-07-26"
next_step: "/sf-repurpose"
---

# Content Map — contentflow_site

## Purpose
La carte des surfaces qui permet de publier vite sans perdre la cohérence entre acquisition, preuve et routage app.
Les claims de ces surfaces doivent rester alignés sur `contentflow_app` (source canonique produit/business).

## Content Map

| Surface | Canonical path | Usage | Format | Source de vérité | Mise à jour |
|---|---|---|---|---|---|
| Landing | `src/pages/index.astro` | Positionnement, promesse, conversion initiale | Astro | `PRODUCT.md`, `GTM.md`, `BRANDING.md` | Changement d’offre ou de copy d’entrée |
| Blog | `src/content/blog/*` + `src/pages/blog/[...slug].astro` | Notoriété, intent informationnel, preuve | Markdown + pages dynamiques | Stratégie éditoriale | Publication d’un nouvel article |
| Tutorials | `src/content/tutorials/*` + `src/pages/tutorials/[...slug].astro` | Onboarding technique, usage concret | Markdown + pages dynamiques | Guide produit | Ajout/mise à jour de tutoriel |
| Docs | `src/content/docs/**/*` + `src/pages/...` | Définition des cas d’usage par zone | Markdown | `BRANDING.md`, `GUIDELINES.md` | Changement de fonctionnalités décrites |
| Agents | `src/content/ai-agents/*` + `src/pages/ai-agents/[...slug].astro` | Narratif produit orienté agents | Markdown + index | Content strategy | Ajout d’un robot ou changement de capacité |
| SEO strategy | `src/content/seo-strategy/*` + `src/pages/seo-strategy/[...slug].astro` | Traction organique & intent achat | Markdown + pages dynamiques | Content plan | Nouveau cluster sémantique |
| Platform | `src/content/platform/*` + `src/pages/platform/[...slug].astro` | Présentation des fonctionnalités clés | Markdown + pages dynamiques | Comportements supportés | Modification de capacité produit |
| Startup journey | `src/content/startup-journey/*` + `src/pages/startup-journey/[...slug].astro` | Crédibilité marque et storytelling | Markdown + pages dynamiques | Histoire produit | Mise à jour d’expérience historique |
| Technical optimization | `src/content/technical-optimization/*` + `src/pages/technical-optimization/[...slug].astro` | Confiance technique et décisions | Markdown | GUIDELINES / repos liés | Changement d’architecture |
| Conversion runtime | `src/pages/launch.astro`, `sign-in.astro`, `sign-up.astro` | Handoff web vers app | Astro | APP_WEB_URL / GUIDE produit | Ajustement de tunnel |
| Support documentaire | `src/pages/privacy.astro`, `src/content.config.ts`, `astro.config.mjs` | Confiance, SEO technique, conformité | mixte | Conventions techniques | Modification légale ou technique |

## Règles de mise à jour
- Toute modification du tunnel de conversion met à jour `GTM.md` + `PRODUCT.md`.
- Toute nouvelle surface d’articles doit être ajoutée à `content_surfaces`.
- Tout claim business doit être cohérent avec `BUSINESS.md` et les comportements app.
- Si une page décrit une capacité non livrée, c’est un bug documentaire.

## Gaps
- Pas de surface newsletter ou réseaux sociaux dans ce dépôt.
- Pas de changelog public de fonctionnalités produit dans ce repo.

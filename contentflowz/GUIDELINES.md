# Guidelines — ContentFlowz

## Approche

**Prototype-first.** Chaque outil est un prototype indépendant. Pas d'over-engineering avant validation du concept.

Un prototype doit répondre à une question simple : "Est-ce que cet outil résout un vrai problème de création de contenu ?"

## Stack technique

- **Frontend** : React + TypeScript pour les prototypes web
- **Backend** : Convex quand un backend est nécessaire (temps réel, stockage)
- **Vidéo** : Remotion (React video generation)
- **Audio** : Eleven Labs API, FFmpeg
- **Autres** : Astro pour les prototypes légers / landing pages

## Qualité du code

- Les prototypes peuvent être **rough** visuellement, mais le code doit rester :
  - **Lisible** : noms explicites, structure claire
  - **Documenté** : un README par prototype expliquant ce qu'il fait et comment le lancer
  - **Fonctionnel** : doit tourner sans configuration complexe (`npm install && npm run dev`)

## Intégration IA

- Chaque outil doit intégrer **au moins un modèle IA** :
  - Eleven Labs (voix, musique)
  - Stable Diffusion / DALL-E (images)
  - GPT / Claude (texte, scripts, prompts)
  - Modèles open source via Replicate (flexibilité)
- Les clés API doivent être dans des variables d'environnement (`.env`), jamais en dur dans le code

## Outputs

- Tous les contenus générés doivent être **exportables** dans des formats standards :
  - Vidéo : MP4
  - Audio : MP3, WAV
  - Image : PNG, JPG, WebP
  - Animation : GIF, MP4
- Prévisualisation en temps réel quand c'est possible

## Branding

- Cohérent avec l'écosystème Flowz quand l'outil est publié
- En phase prototype, pas besoin de design final — fonctionnel avant tout

## Expérimentation

- **Documenter ce qui fonctionne** : quel modèle IA donne les meilleurs résultats, quelle UX convertit
- **Documenter ce qui ne fonctionne pas** : les échecs sont des données précieuses
- Garder un fichier `LEARNINGS.md` par prototype si pertinent

## Intégration future

Les prototypes validés seront intégrés dans une **suite ContentFlowz unifiée** :
- Interface commune
- Compte utilisateur partagé
- Workflow inter-outils (image vers animation, texte vers voix off vers vidéo)

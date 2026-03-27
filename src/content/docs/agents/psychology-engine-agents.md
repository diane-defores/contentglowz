---
title: "Psychology Engine - Architecture Multi-Agents"
description: "Découvrez comment les agents du Psychology Engine collaborent pour créer un profil créateur vivant, modéliser la psychologie client, et générer des angles de contenu uniques."
---

# Les Agents du Psychology Engine

Le Psychology Engine orchestre un système multi-agents où des spécialistes IA collaborent pour comprendre le créateur, modéliser ses clients, et produire des guides de contenu authentiques.

## Vue d'Ensemble

Le Psychology Engine fonctionne en trois couches, chacune pilotée par des agents spécialisés :

| Couche | Agent | Mission |
|--------|-------|---------|
| Creator Brain | 🧠 Creator Psychologist | Synthétise les inputs hebdomadaires en récit narratif |
| Customer Brain | 🎯 Audience Analyst | Modélise et affine les personas client |
| Bridge | 🌉 Angle Strategist | Croise créateur × client pour proposer des angles uniques |

Contrairement aux robots de contenu qui travaillent en séquence linéaire, le Psychology Engine fonctionne en **couches parallèles** qui convergent au moment de la création de contenu.

## Les 3 Agents

### 1. Creator Psychologist — Le Narrateur

**Rôle** : Transformer les notes brutes hebdomadaires du créateur en un récit identitaire vivant et évolutif.

**Ce qu'il fait** :
- Reçoit les 5 flux d'input hebdomadaires (travail en cours, vision du monde, état émotionnel, stack technique, idées marketing)
- Analyse les patterns, les évolutions et les points d'inflexion
- Tisse les nouvelles informations dans le récit existant sans écraser l'historique
- Détecte les transitions de "chapitre" (changement de phase entrepreneuriale, pivot stratégique, évolution de valeurs)
- Génère une proposition de mise à jour narrative pour validation humaine

**Son approche technique** :
- Framework CrewAI avec rôle/objectif/backstory spécialisés en psychologie narrative
- Outils dédiés : lecture du récit existant, analyse des inputs, détection de patterns temporels
- Validation Pydantic stricte pour chaque mise à jour narrative
- Système de chapitres avec métadonnées (titre, thème, dates, état émotionnel dominant)

**Input** : Notes brutes du rituel hebdomadaire + récit narratif existant

**Output** : Proposition de mise à jour narrative structurée, soumise à validation humaine

**Ce qui le rend unique** : Il ne vous demande pas de vous décrire — il interprète ce que vous vivez et le traduit en récit. Et il ne fait rien sans votre accord.

### 2. Audience Analyst — Le Profileur

**Rôle** : Construire et maintenir des modèles psychologiques vivants de chaque segment client.

**Ce qu'il fait** :
- Gère les personas client avec profondeur psychologique (pas juste démographique)
- Intègre les observations hebdomadaires du créateur sur ses clients
- Enrichit les profils avec les données comportementales de Google Analytics
- Identifie les écarts entre ce que le créateur pense de ses clients et ce que les données montrent
- Affine les modèles de douleur, désir, objection et déclencheur émotionnel

**Structure d'une persona** :

| Dimension | Contenu |
|-----------|---------|
| Douleurs profondes | Les vrais problèmes, pas les symptômes de surface |
| Désirs cachés | Ce qu'ils veulent obtenir au-delà du produit/service |
| Objections | Pourquoi ils hésitent — les freins conscients et inconscients |
| Déclencheurs émotionnels | Ce qui provoque l'action (urgence, aspiration, peur, validation) |
| Langage naturel | Les mots et expressions qu'ils utilisent réellement |
| Comportement observé | Données GA : pages visitées, temps passé, taux de rebond par segment |

**Son approche technique** :
- Analyse des données Google Analytics Data API v1
- Corrélation entre métriques d'engagement et profils psychologiques
- Détection d'anomalies (nouveau segment émergent, changement de comportement)

**Input** : Observations hebdomadaires du créateur + données Google Analytics + personas existantes

**Output** : Personas mises à jour avec scores de confiance par dimension

### 3. Angle Strategist — Le Pont

**Rôle** : Croiser l'identité du créateur avec la psychologie client pour générer des angles de contenu uniques et authentiques.

**Ce qu'il fait** :
- Lit le récit créateur actuel (chapitre en cours, état émotionnel, focus stratégique)
- Analyse les personas client pertinentes pour le contenu à produire
- Identifie les points de résonance entre la personnalité du créateur et les douleurs client
- Génère 2-3 angles de contenu distincts, chacun avec une tonalité et un positionnement différents
- Formule chaque angle comme un guide actionnable pour les robots de contenu

**Anatomie d'un angle suggéré** :

| Élément | Description |
|---------|-------------|
| Titre de l'angle | Nom court et mémorable |
| Positionnement | Comment le créateur aborde la douleur client |
| Tonalité | Registre émotionnel (provocateur, empathique, pragmatique...) |
| Message clé | La phrase centrale qui résume l'angle |
| Guide pour les robots | Instructions spécifiques pour la génération de contenu |

**Exemple concret** :

Contexte : Le créateur est dans un chapitre "pragmatisme radical" et le client souffre de "paralysie devant trop d'options IA".

| Angle | Positionnement |
|-------|---------------|
| "Le Filtre" | Pragmatique — "J'ai testé 50 outils cette année, voici les 3 qui valent votre temps" |
| "Le Miroir" | Confrontant — "Votre vrai problème n'est pas le choix d'outil, c'est que vous ne savez pas ce que vous cherchez" |
| "Le Guide" | Empathique — "Je suis passé par là. Voici la méthode que j'utilise pour décider en 5 minutes" |

Le créateur choisit. L'angle devient le brief créatif pour tous les robots.

**Son approche technique** :
- Consomme le récit créateur en format multi-view (extrait adapté au contexte)
- Croise avec les personas via scoring de résonance
- Génération structurée avec validation Pydantic

**Input** : Récit créateur (chapitre en cours) + persona(s) cible + type de contenu demandé

**Output** : 2-3 angles suggérés avec guides de création pour les robots

## Comment Ils Collaborent

Le Psychology Engine suit un cycle hebdomadaire et un cycle à la demande :

### Cycle Hebdomadaire (Maintenance)

| Étape | Agent | Durée | Résultat |
|-------|-------|-------|----------|
| 1. Input créateur | — | 5-15 min (humain) | Notes brutes |
| 2. Synthèse narrative | Creator Psychologist | 30-60 sec | Proposition de mise à jour |
| 3. Validation | — | 1-2 min (humain) | Récit validé |
| 4. Input client | — | 5-10 min (humain) | Observations hebdomadaires |
| 5. Enrichissement GA | Audience Analyst | 15-30 sec | Personas affinées |

### Cycle À la Demande (Création de contenu)

| Étape | Agent | Durée | Résultat |
|-------|-------|-------|----------|
| 1. Demande de contenu | — | (déclencheur) | Type + sujet + persona cible |
| 2. Génération d'angles | Angle Strategist | 15-30 sec | 2-3 angles suggérés |
| 3. Sélection | — | 30 sec (humain) | Angle choisi |
| 4. Guide envoyé | Angle Strategist | instant | Brief créatif pour les robots |
| 5. Contenu généré | SEO/Newsletter/Article Robot | variable | Contenu aligné sur la psychologie |

## Architecture de Données

### Le Récit Narratif

Le Creator Brain stocke l'identité sous forme de récit structuré :

| Composant | Description |
|-----------|-------------|
| Récit global | L'histoire complète, évolutive |
| Chapitres | Phases de vie entrepreneuriale avec titre, thème, dates |
| Entrées hebdomadaires | Les 5 flux bruts, horodatés |
| Synthèses | Mises à jour narratives validées par le créateur |
| Extraits multi-format | Vues rendues pour chaque robot (bio, voix, stance, etc.) |

### Les Personas Client

| Composant | Description |
|-----------|-------------|
| Profil de base | Nom, segment, description |
| Modèle psychologique | Douleurs, désirs, objections, déclencheurs |
| Données comportementales | Métriques GA corrélées |
| Score de confiance | Fiabilité de chaque dimension (basé sur données vs. intuition) |
| Historique | Évolution du profil dans le temps |

## Intégration avec les Robots de Contenu

Le Psychology Engine expose des **extraits multi-format** adaptés à chaque robot consommateur :

| Robot | Format d'extrait | Usage |
|-------|-----------------|-------|
| SEO Robot | Stance thématique + vocabulaire clé + angle éditorial | Guide la rédaction et le maillage interne |
| Newsletter Robot | Ton de la semaine + énergie + focus actuel | Calibre la voix et les sujets |
| Article Generator | Perspective compétitive + positionnement unique | Différencie l'angle des concurrents |
| Scheduling Robot | Priorités stratégiques + chapitre en cours | Aligne le calendrier éditorial |

Chaque robot reçoit uniquement ce dont il a besoin — pas le récit complet. Le système de rendu multi-format garantit que l'information est **pertinente et actionnable** pour chaque consommateur.

## Ce Qui Rend Cette Architecture Unique

### Récit vs. Profil

Les systèmes classiques stockent l'identité comme un profil statique (champs, scores, tags). Le Psychology Engine utilise un **récit narratif** — une histoire qui a un début, des chapitres, et un présent. Le contenu généré porte cette trajectoire.

### Validation Humaine Systématique

L'IA propose, l'humain dispose. Aucune donnée psychologique n'est commitée sans validation explicite du créateur. C'est un choix architectural fondamental, pas un nice-to-have.

### Bidirectionnalité

Le système ne modélise pas juste le créateur OU le client — il modélise les deux et les croise. L'angle de contenu n'est pas "quoi dire au client" mais "comment MOI je parle de CE problème à CE client".

### Évolution Temporelle

Les deux cerveaux évoluent chaque semaine. Le créateur change, les clients changent, les angles changent. Le contenu reste frais et authentique sans effort de maintenance conscient.

## Questions Fréquentes

### Les agents tournent-ils en permanence ?

Non. Le Creator Psychologist et l'Audience Analyst ne s'activent qu'au moment du rituel hebdomadaire. L'Angle Strategist s'active à chaque demande de contenu. Le reste du temps, les données sont au repos dans la base.

### Quel modèle IA utilisent les agents ?

Par défaut, tous les agents utilisent le modèle configuré via OpenRouter (Claude, GPT-4, etc.). Le Creator Psychologist bénéficie d'un prompt system optimisé pour la synthèse narrative et la détection de patterns psychologiques.

### Comment le système gère-t-il les contradictions ?

Si vos inputs hebdomadaires contredisent votre récit précédent, le Creator Psychologist le signale explicitement dans sa proposition de mise à jour. C'est potentiellement un changement de chapitre — et c'est vous qui décidez.

### Peut-on revenir à un chapitre précédent ?

Le récit est append-only — on n'efface jamais l'historique. Mais le "chapitre actif" peut refléter un retour à des thèmes précédents. Le système le gère naturellement comme une évolution narrative.

## Prochaines Étapes

- [Vue d'ensemble Psychology Engine](/docs/platform/psychology-engine) - Présentation marketing et cas d'utilisation
- [FAQ Détaillée](/faq#psychology-engine)

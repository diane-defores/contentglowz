# 🤖 Plan Robots SEO & Newsletter

## 📋 Vision

Déploiement de deux systèmes d'automatisation intelligente :
- **Robot SEO multi-agents** pour optimisation complète du site
- **Newsletter automatisée** basée sur intelligence artificielle avec Exa AI pour curation intelligente

---

## 🎯 Objectifs Stratégiques

### Robot SEO
- Analyser et optimiser le topocal flow du site
- Générer contenus et metadata performants
- Améliorer rankings et visibilité organique

### Newsletter
- Curation automatique des actualités et tendances via Exa AI
- Formatage structuré et validation qualité avec PydanticAI
- Engagement régulier de l'audience cible
- Automatisation complète sans intervention humaine

---

## 📊 Architecture High-Level

### Robot SEO
Workflow d'automatisation intelligent avec agents spécialisés orchestrés via CrewAI

### Newsletter
Pipeline structuré avec PydanticAI pour validation et Exa AI pour collecte :
- **Collecte** : Utilisation APIs Exa (/search, /contents, /research) pour données fraîches
- **Structuration** : Agent PydanticAI valide et formate contenu
- **Envoi** : Distribution automatisée via EmailIt/Encharge.io
- **Monitoring** : Analytics performance et optimisation continue

---

## 🔧 Intégrations Techniques

### Plateformes
- Astro (site statique hybrid)
- GitHub (code repository)
- Local/Cron automation (orchestration)

### Services Externes
- EmailIt/Encharge.io (emails)
- APIs LLM (OpenAI/Anthropic)
- **Exa AI** :
  - `/search` : Recherche embeddings-based pour contenu pertinent
  - `/contents` : Extraction HTML propre et à jour
  - `/answer` : Réponses directes pour résumés
  - `/research` : Recherche approfondie automatisée
- **EmailIt/Paced Email** : Réception et veille concurrentielle
- **Paced Email** : Envoi newsletters et analytics
  - Websets (futur) : Collections persistantes pour monitoring avancé

### Infrastructure Performance
- Blacksmith CI/CD : 2x plus rapide, 75% moins cher
- Organisation GitHub gratuite (compatible Blacksmith)
- 3,000 minutes gratuites/mois
- Cache optimisé pour dépendances Exa AI et LLM

---

## 📈 Livrables Attendus

### Site Optimisé
- Fichiers markdown améliorés
- Metadata structurées
- Topical flow cohérent

### Newsletter Hebdomadaire
- Contenu pertinent et structuré via Exa AI
- Format responsive et engageant
- Automatisation complète avec validation stricte
- Monitoring qualité et performance</content>
<parameter name="filePath">plan.md
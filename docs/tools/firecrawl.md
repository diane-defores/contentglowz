# 🔍 Analyse API Firecrawl

## Vue d'ensemble
Firecrawl est une API puissante qui transforme des sites web entiers en données prêtes pour les LLMs (Large Language Models). Idéale pour l'analyse concurrentielle, la génération de contenu et la veille marché dans nos robots.

## Fonctionnalités Clés

### Crawl
- Analyse complète de sites web (tous les URLs accessibles)
- Retourne contenu en markdown propre pour chaque page
- Gestion automatique des subpages (pas besoin de sitemap)
- Support médias (PDF, images) et contenu dynamique

### Extract
- Extraction structurée avec schémas Pydantic
- Mode JSON pour données business (prix, produits, stratégies)
- Possibilité extraction sans schéma (LLM choisit structure)
- Actions : clic, scroll, input pour sites dynamiques

### Search
- Recherche web avec résultats enrichis
- Filtres par sources (web, news, images)
- Intégration facile avec scraping des résultats

### Map
- Découverte rapide de tous les URLs d'un site
- Idéal pour inventaire contenu avant crawl complet

## Utilisation dans Ton Business

### Analyse Concurrentielle
- **Crawling Sites Concurrents** : Identifier stratégies contenu, mots-clés utilisés, gaps marché
- **Extraction Données** : Prix, produits, clients, partenaires via JSON mode
- **Veille Changements** : Monitor évolution sites clés (nouveaux lancements, updates)

### Génération Contenu (Robot Articles)
- **Analyse Sites** : Crawl complet pour comprendre structure et thèmes
- **Inspiration Originale** : Générer contenu unique basé analyse concurrentielle
- **Optimisation SEO** : Identifier opportunités mots-clés et backlinks

### Business Intelligence
- **Extraction Structurée** : Clients, case studies, pricing depuis sites
- **Monitoring Marché** : Alertes sur changements concurrentiels
- **Research Automatisé** : Recherche web + extraction pour insights business

### Newsletter Robot
- **Enrichissement Données** : Complément à Exa AI pour contenu plus profond
- **Sources Diversifiées** : Crawl sites spécialisés pour curation

## Avantages Business

### Performance
- **Rapidité** : Résultats en secondes pour crawls simples
- **Évolutivité** : Gestion anti-bot, proxies intégrés
- **Fiabilité** : Données propres, gestion erreurs automatique

### Économie
- **Pay-as-you-go** : Crédits par opération (crawl, scrape)
- **Optimisation** : Cache recommandé pour éviter appels répétés
- **Efficacité** : Pas de maintenance scraping personnalisé

### Qualité
- **LLM-Ready** : Formats markdown, JSON, HTML optimisés
- **Métadonnées** : Titres, descriptions, langages, robots
- **Flexibilité** : Formats multiples (markdown, screenshot, links)

## Intégration Technique

### SDKs Disponibles
- **Python** : `pip install firecrawl-py`
- **Node.js** : SDK officiel
- **Frameworks** : Intégrations LangChain, CrewAI, LlamaIndex, etc.

### Authentification
- API Key depuis dashboard Firecrawl
- Gestion sécurisée dans .env

### Exemples Code

#### Crawling Simple
```python
from firecrawl import Firecrawl

firecrawl = Firecrawl(api_key="fc-YOUR-API-KEY")
docs = firecrawl.crawl(url="https://example.com", limit=10)
```

#### Extraction Structurée
```python
from pydantic import BaseModel

class BusinessData(BaseModel):
    company_name: str
    products: list[str]
    pricing: dict

result = firecrawl.scrape(
    'https://competitor.com',
    formats=[{"type": "json", "schema": BusinessData.model_json_schema()}]
)
```

### Gestion Avancée
- **Webhooks** : Notifications pour crawls asynchrones longs
- **Rate Limits** : Gestion automatique via SDK
- **Actions** : Interaction pages (login, navigation)

## Intégration dans Nos Robots

### Robot SEO
- Analyse sites concurrents pour keywords research
- Audit structure sites pour optimisations

### Robot Newsletter
- Enrichissement curation avec contenu sites spécialisés
- Extraction insights pour newsletters thématiques

### Robot Articles
- **Core** : Crawl sites pour génération contenu original
- Workflow : Analyse Firecrawl → Génération CrewAI → Validation

## Optimisations Blacksmith
- **Cache** : Stockage réponses crawls pour éviter re-crawls coûteux
- **Parallélisation** : Multiples crawls simultanés
- **Monitoring** : Dashboard pour usage API et coûts

## Coûts et Limitations
- **Crédits** : Par scrape/crawl (voir pricing Firecrawl)
- **Rate Limits** : Gestion via SDK automatique
- **Open Source** : Version self-hosted disponible

## Recommandations Business
1. **Commencer Petit** : Tests sur sites simples avant production
2. **Cache Obligatoire** : Économies significatives sur gros volumes
3. **Schéma Pydantic** : Pour extractions structurées business
4. **Monitoring** : Suivi coûts et performance via Blacksmith

## Ressources
- [Documentation Officielle](https://docs.firecrawl.dev)
- [Playground](https://firecrawl.dev/playground)
- [GitHub](https://github.com/firecrawl/firecrawl)
- Intégrations : CrewAI, LangChain, etc.

Cette API complète parfaitement notre stack Exa AI + CrewAI pour une analyse web complète et automatisée.</content>
<parameter name="filePath">docs/firecrawl.md
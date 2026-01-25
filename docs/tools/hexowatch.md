# 🔍 Analyse API Hexowatch

## Vue d'ensemble
Hexowatch est une API de monitoring de sites web complète, permettant de surveiller divers aspects : changements visuels, contenu, mots-clés, technologies, disponibilité, etc. Idéale pour la veille concurrentielle et le monitoring de sites dans nos robots.

## Fonctionnalités Clés

### Outils de Monitoring Disponibles
- **Tech Stack Tool** : Détection changements technologies (frameworks, CMS, etc.)
- **Keyword Tool** : Monitoring présence/absence mots-clés
- **Visual Monitoring Tool** : Détection changements visuels (screenshots)
- **Content Monitoring Tool** : Surveillance changements contenu textuel
- **Source Code Monitoring Tool** : Monitoring code HTML/CSS/JS
- **Availability Monitoring Tool** : Vérification uptime/down
- **Domain WHOIS Tool** : Changements informations domaine
- **Backlink Tool** : Monitoring backlinks entrants
- **RSS Tool** : Monitoring flux RSS

### Paramètres Généraux
- **Monitoring Interval** : De 5 minutes à 3 mois
- **Notifications** : Email, Slack, Telegram, Discord, Webhooks
- **Proxies** : Support premium pour géolocalisation
- **Tags** : Organisation et filtrage monitorings

## Utilisation dans Ton Business

### Veille Concurrentielle
- **Monitoring Sites Concurrents** : Alertes sur nouveaux produits, changements pricing, mises à jour contenu
- **Analyse Technologies** : Identifier stacks techniques concurrents (SEO, dev)
- **Tracking Mots-Clés** : Monitor positionnement keywords importants
- **Changements Visuels** : Détection redesigns ou updates UI/UX

### Business Intelligence
- **Monitoring Clients/Partenaires** : Suivre évolutions sites clés
- **Alertes Opportunités** : Nouveaux appels d'offres, changements business
- **Analyse Marché** : Monitor sites leaders secteur pour tendances

### Monitoring Interne
- **Sites Propres** : Alertes sur changements non-autorisés, downtime
- **Performance** : Monitoring disponibilité et temps réponse
- **SEO Tracking** : Évolution rankings et backlinks

## Avantages Business

### Automatisation
- **Alertes Temps Réel** : Notifications instantanées changements critiques
- **Pas de Maintenance** : API gérée, pas de scraping personnalisé
- **Évolutivité** : Monitor centaines de sites facilement

### Économique
- **Pay-as-you-go** : Crédits par monitoring/check
- **Plans Tarifaires** : De gratuit à enterprise
- **Optimisation** : Intervalles configurables pour coûts maîtrisés

### Fiabilité
- **Proxies Rotatifs** : Évite blocages
- **Gestion Erreurs** : Retry automatique
- **Data Historique** : Logs complets changements

## Intégration Technique

### Authentification
- API Key depuis dashboard Hexowatch
- Gestion sécurisée dans .env

### Endpoints Principaux
- **POST /v2/monitor** : Créer monitoring
- **GET /v1/monitored_urls** : Lister monitorings actifs
- **PATCH /v1/action** : Pause/Resume/Check now
- **GET /v1/monitoring_logs** : Historique changements
- **GET /v1/scan_result** : Détails changements

### Exemples Code

#### Créer Monitoring Tech Stack
```python
import requests

url = "https://api.hexowatch.com/v2/app/services/v2/monitor"
headers = {"Content-Type": "application/json"}
data = {
    "key": "YOUR_API_KEY",
    "tool": "techStackTool",
    "address_list": ["competitor.com"],
    "monitoring_interval": "1_WEEK",
    "notification_integrations": [123],  # IDs intégrations
    "tool_settings": {
        "mode": "ANY_CHANGE",
        "api_host_code": "USA"
    }
}

response = requests.post(url, json=data)
```

#### Récupérer Résultats
```python
logs_url = f"https://api.hexowatch.com/v2/app/services/v1/monitoring_logs/{monitoring_id}"
params = {"key": "YOUR_API_KEY"}
response = requests.get(logs_url, params=params)
```

## Intégration dans Nos Robots

### Robot SEO
- **Monitoring Concurrentiel** : Intégrer Hexowatch pour alerte changements SEO concurrents
- **Tech Stack Analysis** : Détecter nouveaux outils utilisés par concurrents
- **Keyword Tracking** : Monitor évolution positions keywords cibles

### Robot Newsletter
- **Content Monitoring** : Alertes nouveaux articles sur sites suivis
- **RSS Integration** : Monitor flux RSS pour curation automatique

### Robot Articles
- **Competitor Analysis** : Crawling Hexowatch + Firecrawl pour veille approfondie
- **Content Gap Analysis** : Identifier sujets non couverts par concurrents

## Optimisations Blacksmith
- **Cache Monitoring** : Éviter appels répétés pour mêmes sites
- **Parallélisation** : Multiples monitorings simultanés
- **Webhooks** : Intégration temps réel avec robots

## Coûts et Limitations
- **Crédits** : Par check/monitoring (voir pricing Hexowatch)
- **Rate Limits** : Gestion via intervalles
- **Plans** : Features avancées sur plans payants

## Recommandations Business
1. **Focus Concurrentiel** : Priorité monitoring 5-10 concurrents clés
2. **Alertes Critiques** : Configurer webhooks pour intégration robots
3. **Historique Data** : Utiliser logs pour analyses rétrospectives
4. **Tests Graduels** : Commencer petit puis scaler

## Ressources
- [Documentation Officielle](https://hexowatch.com/api-documentation/)
- [Dashboard](https://dash.hexowatch.com)
- [Pricing](https://hexowatch.com/pricing)
- Intégrations : Webhooks, APIs diverses

Cette API complète parfaitement notre stack pour un monitoring proactif et automatisé des écosystèmes business.</content>
<parameter name="filePath">docs/hexowatch.md
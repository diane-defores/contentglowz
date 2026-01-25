# Agent de Internal Linking - Documentation

## 📋 Vue d'ensemble

L'**InternalLinkingSpecialist** est un agent SEO avancé qui optimise le maillage interne pour maximiser à la fois l'autorité SEO et les taux de conversion. Il combine expertise SEO technique et optimisation marketing pour créer des stratégies de linking intelligentes et personnalisées.

### Position dans le workflow SEO
```
Research → Strategy → Copywriter → Marketing → **INTERNAL LINKING** → Technical SEO → Editor → Deploy
```

## 🎯 Objectifs Principaux

1. **Balance 50/50** : 50% nouvelles opportunités + 50% optimisation existante
2. **Focus Conversion** : 70% conversion, 30% SEO (conversion-first approach)
3. **Personnalisation Full** : Profilage progressif avec adaptation temps réel
4. **Approche Hybride** : Lead gen, demos, trials, sales simultanément

## 🛠️ Architecture Technique

### 1. Agent Principal
**Fichier** : `agents/seo/internal_linking_specialist.py`

```python
from agents.seo.internal_linking_specialist import InternalLinkingSpecialistAgent

agent = InternalLinkingSpecialistAgent()
strategy = agent.generate_linking_strategy(
    content_inventory=content_pages,
    business_goals=["Increase leads", "Generate demos"],
    conversion_objectives=["lead_generation", "demo_request"],
    target_audience="Marketing professionals",
    scope="include_existing",
    personalization_level="full",
    conversion_focus=0.7
)
```

### 2. Suite d'Outils Complète

#### LinkingAnalyzer (50% SEO Focus)
**Fichier** : `agents/seo/tools/internal_linking_tools.py`

- Analyse pillar-cluster structure
- Distribution d'autorité SEO
- Identification gaps de linking
- Score SEO pour chaque opportunité

```python
from agents.seo.tools.internal_linking_tools import linking_analyzer

analysis = linking_analyzer.analyze_linking_opportunities(
    content_inventory=pages,
    business_goals=goals,
    target_audience=audience,
    scope="include_existing"
)
```

#### ConversionOptimizer (70% Conversion Focus)
- Optimisation parcours conversion
- Hybrid business objectives (lead gen + demo + sales)
- Mapping conversion funnels
- Score impact conversionnel

```python
from agents.seo.tools.internal_linking_tools import conversion_optimizer

optimization = conversion_optimizer.optimize_conversion_paths(
    linking_analysis=analysis,
    conversion_goals=["lead_generation", "demo_request"],
    business_goals=goals,
    conversion_focus=0.7
)
```

#### PersonalizationEngine (Full Personalization)
- Profilage progressif utilisateurs
- Inférence objectifs business
- Dynamic linking adaptatif
- Segmentation comportementale

```python
from agents.seo.tools.internal_linking_tools import personalization_engine

personalized = personalization_engine.generate_personalized_links(
    base_linking_strategy=strategy,
    user_context=user_data,
    behavioral_signals=behavior_data
)
```

#### AutomatedInserter (Automated + Reporting)
- Insertion automatique dans markdown
- Validation complète
- Preview/Apply/Report modes
- Reporting détaillé

```python
from agents.seo.tools.internal_linking_tools import automated_inserter

result = automated_inserter.insert_links_automatically(
    linking_strategy=strategy,
    content_files=["blog/post1.md", "blog/post2.md"],
    insertion_mode="preview"  # ou "apply" pour appliquer
)
```

#### FunnelIntegrator (Marketing Funnel)
- Mapping funnel stages
- Transition inter-étapes
- Conversion touchpoints
- Business alignment

```python
from agents.seo.tools.internal_linking_tools import funnel_integrator

funnel_map = funnel_integrator.map_funnel_touchpoints(
    linking_strategy=strategy,
    business_objectives=goals,
    conversion_objectives=["lead_generation"]
)
```

#### MaintenanceTracker (Link Health)
- Audit liens existants
- Détection liens cassés
- Performance tracking
- Maintenance continue

```python
from agents.seo.tools.internal_linking_tools import maintenance_tracker

health = maintenance_tracker.audit_existing_links(
    content_inventory=pages,
    existing_links_data=current_links
)
```

### 3. Système de Configuration
**Fichier** : `agents/seo/config/internal_linking_config.py`

```python
from agents.seo.config.internal_linking_config import (
    config_manager,
    load_template_config,
    create_custom_config
)

# Utiliser un template prédéfini
config = load_template_config("hybrid_approach")

# Ou créer une config personnalisée
config = create_custom_config(
    scope="include_existing",
    personalization="full",
    conversion_focus=0.7,
    auto_insert_links=False
)

# Récupérer config avec précédence
config = config_manager.get_config(
    user_id="user123",
    project_id="project456",
    custom_settings={"conversion_focus": 0.8}
)
```

#### Templates Disponibles
- `lead_generation_focused` - 80% conversion, focus lead gen
- `demo_trial_focused` - Demos et trials prioritaires
- `sales_focused` - Focus direct sur ventes
- `seo_balanced` - Équilibre SEO/conversion
- `content_marketing` - Content-first avec lead gen secondaire
- `hybrid_approach` - Tous objectifs business (RECOMMANDÉ)

### 4. Schémas Pydantic
**Fichier** : `agents/seo/schemas/internal_linking_schemas.py`

Validation complète des données :
- `InternalLink` - Lien interne individuel
- `LinkingStrategy` - Stratégie complète
- `UserProfile` - Profil utilisateur progressif
- `LinkInsertionReport` - Rapport d'insertion
- `ConversionPath` - Parcours conversion
- Et 15+ autres schémas

### 5. API Endpoints
**Fichier** : `api/routers/internal_linking.py`

#### Endpoints Principaux

**Analyse Stratégie**
```http
POST /api/internal-linking/analyze-strategy
Content-Type: application/json

{
  "content_inventory": [...],
  "business_goals": ["Increase leads"],
  "conversion_objectives": ["lead_generation", "demo_request"],
  "target_audience": "Marketing professionals",
  "scope": "include_existing",
  "personalization_level": "full",
  "conversion_focus": 0.7
}
```

**Personnalisation**
```http
POST /api/internal-linking/personalize-links

{
  "base_strategy": {...},
  "user_context": {...},
  "behavioral_signals": [...]
}
```

**Insertion Automatique**
```http
POST /api/internal-linking/automated-insertion

{
  "linking_strategy": {...},
  "content_files": ["blog/post1.md"],
  "insertion_mode": "preview",  # ou "apply"
  "validation_level": "moderate"
}
```

**Tracking Performance**
```http
POST /api/internal-linking/link-performance

{
  "links": [...],
  "time_period": "last_30_days",
  "metrics": ["ctr", "conversion_rate", "engagement"]
}
```

**Health Check**
```http
GET /api/internal-linking/health-check?content_inventory=[...]
```

**Configuration**
```http
GET /api/internal-linking/configuration?user_id=user123
PUT /api/internal-linking/configuration
GET /api/internal-linking/templates/hybrid_approach
```

## 📊 Fonctionnalités Clés

### 1. Balance 50/50 Automatique
Le système garantit automatiquement :
- 50% de nouvelles opportunités de linking
- 50% d'optimisation des liens existants
- Score de balance calculé et reporté

### 2. Conversion-First (70/30)
- 70% du poids algorithmique sur la conversion
- 30% du poids sur l'autorité SEO
- Balance ajustable par configuration

### 3. Personalisation Full
- **Profilage progressif** : Construction incrémentale du profil utilisateur
- **Inférence business** : Détection automatique des objectifs
- **Dynamic linking** : Adaptation temps réel selon comportement
- **Segmentation** : Par industrie, rôle, taille entreprise, stage funnel

### 4. Hybrid Business Objectives
Support simultané de :
- Lead Generation (formulaires, webinaires, ressources)
- Demo Requests (démos personnalisées, walkthroughs)
- Trial Signups (essais gratuits, onboarding)
- Purchases (ventes directes, upgrade)

### 5. Marketing Funnel Integration
- **Awareness** : Liens éducatifs, pillar-to-cluster
- **Consideration** : Comparaisons, case studies, demos
- **Decision** : Trials, pricing, purchase
- **Retention** : Support, training, upsells
- **Advocacy** : Referrals, community

### 6. Automated Insertion avec Reporting
- **Preview Mode** : Validation avant application
- **Apply Mode** : Insertion automatique dans markdown
- **Report Mode** : Génération rapport sans modification
- **Comprehensive Reporting** : Balance, impact SEO/conversion, qualité

## 🚀 Utilisation

### Cas d'Usage 1 : Génération Stratégie Complète
```python
from agents.seo.internal_linking_specialist import InternalLinkingSpecialistAgent

# Initialiser l'agent
agent = InternalLinkingSpecialistAgent()

# Générer stratégie
strategy = agent.generate_linking_strategy(
    content_inventory=[
        {"url": "https://example.com/guide", "title": "Marketing Guide", "type": "pillar_page"},
        {"url": "https://example.com/tips", "title": "10 Tips", "type": "cluster_page"}
    ],
    business_goals=["Increase organic traffic", "Generate qualified leads"],
    conversion_objectives=["lead_generation", "demo_request"],
    target_audience="Marketing professionals at mid-size companies"
)

print(f"Nouvelles opportunités: {len(strategy['new_opportunities'])}")
print(f"Optimisations existantes: {len(strategy['existing_optimizations'])}")
print(f"Score conversion: {strategy['conversion_score']}")
```

### Cas d'Usage 2 : Insertion Automatique
```python
from agents.seo.tools.internal_linking_tools import automated_inserter

# Preview d'abord
preview = automated_inserter.insert_links_automatically(
    linking_strategy=strategy,
    content_files=["content/blog/post1.md", "content/blog/post2.md"],
    insertion_mode="preview"
)

# Vérifier le rapport
print(f"Liens à insérer: {preview['summary']['total_links_inserted']}")
print(f"Impact SEO: {preview['summary']['average_seo_impact']}")
print(f"Impact conversion: {preview['summary']['average_conversion_impact']}")

# Si OK, appliquer
if preview['report']['quality_score'] >= 80:
    result = automated_inserter.insert_links_automatically(
        linking_strategy=strategy,
        content_files=["content/blog/post1.md"],
        insertion_mode="apply"
    )
    print("✅ Liens insérés avec succès")
```

### Cas d'Usage 3 : Personnalisation Utilisateur
```python
from agents.seo.tools.internal_linking_tools import personalization_engine

# Générer liens personnalisés
personalized = personalization_engine.generate_personalized_links(
    base_linking_strategy=strategy,
    user_context={
        "user_id": "user123",
        "demographics": {"location": "France", "language": "fr"},
        "business_context": {
            "company_size": "mid_market",
            "industry": "technology",
            "role": "marketing_manager"
        }
    },
    behavioral_signals=[
        {"type": "page_view", "url": "/pricing", "time_on_page": 120},
        {"type": "link_click", "link_text": "request demo"},
        {"type": "search_query", "query": "marketing automation pricing"}
    ]
)

# Résultat
print(f"Profil maturity: {personalized['user_profile']['profile_metadata']['maturity_score']}")
print(f"Liens personnalisés: {len(personalized['personalized_links'])}")
print(f"Objectifs inférés: {personalized['user_profile']['business_objectives']}")
```

### Cas d'Usage 4 : Configuration via Dashboard
```python
from agents.seo.config.internal_linking_config import config_manager

# Sauvegarder config utilisateur
config_manager.save_user_config("user123", custom_config)

# Récupérer avec précédence
config = config_manager.get_config(
    user_id="user123",          # Config utilisateur
    project_id="project456",    # Config projet
    session_id="session789",    # Config session
    custom_settings={            # Overrides runtime
        "conversion_focus": 0.8,
        "auto_insert_links": True
    }
)
```

## 📈 Métriques & Reporting

### Métriques Suivies
1. **Balance Score** : Proximité au 50/50 (0-100)
2. **Conversion Focus Score** : Atteinte objectif 70% (0-100)
3. **Quality Score** : Qualité globale insertions (0-100)
4. **SEO Impact Score** : Impact autorité SEO (0-100)
5. **Conversion Impact Score** : Impact conversions (0-100)
6. **Personalization Coverage** : Couverture personnalisation (0-100)

### Format Rapport
```json
{
  "report_id": "insertion_report_abc123",
  "generated_at": "2026-01-15T21:30:00Z",
  "files_processed": 10,
  "links_inserted": 42,
  "new_links_added": 21,
  "existing_links_optimized": 21,
  "balance_achieved": 95.5,
  "conversion_focus_achieved": 0.72,
  "quality_score": 87.3,
  "seo_impact_score": 75.2,
  "conversion_impact_score": 82.1,
  "recommendations": [
    "Consider adding more conversion-focused links",
    "Optimize anchor text for better SEO impact"
  ]
}
```

## 🔧 Configuration Avancée

### Paramètres Clés
```python
config = InternalLinkingConfiguration(
    # Balance
    new_vs_existing_split=0.5,      # 50/50
    seo_conversion_balance=0.7,     # 70% conversion
    
    # Scope
    analysis_scope="include_existing",
    personalization_level="full",
    
    # Business Objectives (Hybrid)
    business_objective_weights={
        "lead_generation": 0.4,
        "demo_request": 0.3,
        "trial_signup": 0.2,
        "purchase": 0.1
    },
    
    # Quality
    min_seo_value=3.0,
    min_conversion_value=5.0,
    min_personalization_score=0.6,
    
    # Automation
    auto_insert_links=False,        # Requiert validation
    generate_reports=True,
    notify_on_completion=True
)
```

## 🎓 Bonnes Pratiques

### 1. Toujours Preview Avant Apply
```python
# ✅ BON
preview = insert_links(mode="preview")
if preview['quality_score'] >= 80:
    apply_result = insert_links(mode="apply")

# ❌ MAUVAIS
insert_links(mode="apply")  # Sans validation
```

### 2. Utiliser Templates Pour Démarrer
```python
# ✅ BON - Partir d'un template
config = load_template_config("hybrid_approach")
config.conversion_focus = 0.8  # Ajuster si besoin

# ❌ MOINS BON - Tout configurer manuellement
config = create_from_scratch(...)
```

### 3. Monitoring Continu
```python
# Après insertion, toujours tracker
health = maintenance_tracker.audit_existing_links(...)
performance = track_link_performance(...)

# Ajuster stratégie basée sur résultats
if health['overall_health_score'] < 70:
    run_maintenance_optimizations()
```

### 4. Personnalisation Progressive
```python
# Commencer basique, évoluer vers full
personalization_levels = [
    "basic",          # Semaine 1-2
    "intermediate",   # Semaine 3-4
    "advanced",       # Semaine 5-8
    "full"            # Production
]
```

## 🐛 Troubleshooting

### Erreur : "Too many opportunities (max 1000)"
**Solution** : Ajuster scope ou filtrer content_inventory

### Erreur : "Content files list cannot be empty"
**Solution** : Vérifier que content_files contient au moins 1 fichier

### Score de balance < 80
**Solution** : Vérifier équilibre new vs existing dans strategy

### Score conversion < 60
**Solution** : Augmenter conversion_focus ou ajuster business_objective_weights

## 📚 Ressources Additionnelles

### Fichiers Clés
- Agent principal : `agents/seo/internal_linking_specialist.py`
- Outils : `agents/seo/tools/internal_linking_tools.py`
- Configuration : `agents/seo/config/internal_linking_config.py`
- Schémas : `agents/seo/schemas/internal_linking_schemas.py`
- API : `api/routers/internal_linking.py`

### Documentation
- AGENTS.md - Guide complet agents
- README.md - Vue d'ensemble projet
- docs/agents-specs.md - Spécifications détaillées

## 🚦 État d'Implémentation

- ✅ Agent principal créé
- ✅ 6 outils complets (LinkingAnalyzer, ConversionOptimizer, PersonalizationEngine, AutomatedInserter, FunnelIntegrator, MaintenanceTracker)
- ✅ Système configuration flexible
- ✅ Schémas Pydantic validation
- ✅ API endpoints FastAPI
- ⏳ Intégration SEO crew workflow (en cours)
- ⏳ Tests complets (à venir)

## 📞 Support

Pour toute question ou problème :
1. Vérifier cette documentation
2. Consulter AGENTS.md pour patterns généraux
3. Examiner exemples dans les fichiers de tests (à venir)

---

**Créé le** : 15 janvier 2026  
**Version** : 1.0.0  
**Status** : Production-ready (tests en cours)

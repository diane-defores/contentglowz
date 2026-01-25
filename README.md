# 📁 Structure Repository Robots

```
robots/
├── README.md                           # Vue d'ensemble projet
├── .env.example                        # Template variables environnement
├── requirements.txt                    # Dépendances Python
├── .github/
│   └── workflows/
│       ├── seo-automation.yml          # Workflow robot SEO
│       └── newsletter-scheduled.yml     # Workflow newsletter
├── src/
│   ├── seo/
│   │   ├── agents/                    # 6 agents CrewAI SEO
│   │   │   │   ├── research_analyst.py
│   │   │   │   ├── content_strategist.py
│   │   │   │   ├── copywriter.py
│   │   │   │   ├── technical_seo.py
│   │   │   │   ├── marketing_strategist.py
│   │   │   │   └── editor.py
│   │   │   ├── tools/                     # Outils SEO personnalisés
│   │   │   │   ├── serp_analyzer.py
│   │   │   │   ├── content_audit.py
│   │   │   │   ├── keyword_researcher.py
│   │   │   │   └── metadata_generator.py
│   │   │   ├── workflows/                  # Orchestration CrewAI
│   │   │   │   ├── seo_crew.py
│   │   │   │   ├── content_pipeline.py
│   │   │   │   └── markdown_processor.py
│   │   │   └── config/
│   │   │       ├── agents_config.py
│   │   │       └── tools_config.py
│   ├── newsletter/
│   │   ├── agents/
│   │   │   └── newsletter_agent.py      # Agent PydanticAI structuré
│   │   ├── schemas/                    # Schemas Pydantic validation
│   │   │   ├── newsletter_schema.py
│   │   │   ├── content_blocks.py
│   │   │   └── metadata_schema.py
│   │   ├── tools/
│   │   │   ├── exa_collector.py        # Intégration Exa AI
│   │   │   ├── content_analyzer.py
│   │   │   └── email_sender.py
│   │   ├── templates/
│   │   │   ├── newsletter_template.html
│   │   │   └── responsive_styles.css
│   │   ├── config/
│   │   │   ├── exa_config.py
│   │   │   └── newsletter_config.py
│   └── articles/
│       ├── agents/
│       │   └── article_generator.py     # Agent CrewAI génération contenu
│       ├── schemas/                    # Schemas Pydantic validation
│       │   ├── article_schema.py
│       │   ├── analysis_schema.py
│       │   └── seo_metadata_schema.py
│       ├── tools/
│       │   ├── firecrawl_crawler.py    # Intégration Firecrawl
│       │   ├── content_analyzer.py
│       │   └── seo_optimizer.py
│       ├── templates/
│       │   ├── article_template.md
│       │   └── seo_metadata_template.py
│       └── config/
│           ├── firecrawl_config.py
│           └── article_config.py
├── tests/                             # Tests unitaires et intégration
│   ├── test_seo_agents.py
│   ├── test_newsletter_agent.py
│   ├── test_article_agent.py
│   ├── test_integrations.py
│   └── test_blacksmith_performance.py
├── docs/
│   ├── plan.md                        # Plan d'architecture (principal)
│   ├── phases.md                      # Phases de développement
│   ├── agents-specs.md                # Spécifications détaillées agents
│   └── blacksmith-integration.md       # Guide Blacksmith
├── scripts/
│   ├── setup_environment.sh             # Setup environnement développement
│   ├── configure_blacksmith.sh          # Configuration Blacksmith
│   ├── run_tests.sh                   # Lancement tests complets
│   └── deploy_production.sh            # Déploiement production
└── monitoring/
    ├── performance_metrics.py           # Monitoring Blacksmith
    ├── cost_tracker.py                # Suivi économies
    └── quality_analytics.py           # Analytics qualité contenu
```

---

## 🗂️ Explication Structure

### Configuration Principale
- **.github/workflows/** : Configuration GitHub Actions + Blacksmith
- **src/** : Code source agents et outils
- **docs/** : Documentation projet et guides

### Robot SEO (CrewAI)
- **agents/** : 6 agents spécialisés multi-compétences
- **tools/** : Outils personnalisés pour scraping, analyse
- **workflows/** : Orchestration CrewAI hiérarchique

### Newsletter (PydanticAI)
- **schemas/** : Validation stricte Pydantic
- **tools/** : Intégration Exa AI et envoi emails
- **templates/** : Templates responsive pour newsletters

### Robot Articles (CrewAI)
- **agents/** : Agent analyse et génération contenu
- **tools/** : Intégration Firecrawl pour crawling
- **templates/** : Templates articles optimisés SEO

### Infrastructure
- **tests/** : Validation complète systèmes
- **scripts/** : Automatisation setup et déploiement
- **monitoring/** : Tracking performance Blacksmith

---

## 🔧 Setup Rapide

```bash
# 1. Cloner repository
git clone <repository-url>
cd robots

# 2. Environment
cp .env.example .env
# Configurer clés API dans .env

# 3. Installation
pip install -r requirements.txt

# 4. Setup Blacksmith
./scripts/configure_blacksmith.sh

# 5. Tests
./scripts/run_tests.sh

# 6. Déploiement
./scripts/deploy_production.sh
```

---

## 📊 Performance Optimisée

### Blacksmith Integration
- Workflows configurés pour runners Blacksmith
- Cache optimisé pour dépendances LLM
- Docker layer caching pour builds rapides
- Monitoring via dashboard Blacksmith

### Documentation
- Guides détaillés pour chaque composant
- Best practices et troubleshooting
- Documentation API et configuration

### Monitoring
- Performance metrics temps réel
- Suivi économies vs GitHub Actions
- Quality analytics pour contenus générés

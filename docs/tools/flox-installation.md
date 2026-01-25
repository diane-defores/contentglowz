# 🚀 Installation Guide : Flox

## Vue d'ensemble
Flox est un outil de gestion d'environnements de développement reproductibles. Ce guide détaille l'installation et l'intégration dans notre workflow de développement.

## Prérequis
- Linux, macOS, ou Windows (WSL2)
- Bash shell
- Git
- Accès internet

## Installation Officielle

### Méthode 1 : Script Automatique (Recommandé)
```bash
# Télécharger et exécuter le script d'installation
curl -fsSL https://get.flox.dev | bash
```

### Méthode 2 : Package Managers
```bash
# macOS avec Homebrew
brew install flox

# Linux (Ubuntu/Debian)
# Ajouter repo Flox
curl -fsSL https://get.flox.dev | bash
# Puis installer
apt update && apt install flox

# Arch Linux
yay -S flox

# NixOS
nix-env -iA nixpkgs.flox
```

### Méthode 3 : Binaire Direct
```bash
# Télécharger depuis releases GitHub
# https://github.com/flox/flox/releases
# Extraire et ajouter au PATH
```

## Vérification Installation
```bash
# Vérifier version
flox --version

# Vérifier statut
flox status
```

## Configuration Initiale

### Authentification FloxHub (Optionnel)
```bash
# Se connecter pour partage d'environnements
flox auth login

# Créer compte gratuit sur https://hub.flox.dev
```

### Configuration Shell
```bash
# Ajouter à ~/.bashrc ou ~/.zshrc
eval "$(flox activate)"

# Recharger shell
source ~/.bashrc
```

## Intégration dans Notre Workflow

### Remplacement Docker pour Dev
Flox n'est pas exactement un remplacement Docker, mais offre isolation similaire pour développement :

**Avantages Flox vs Docker :**
- Plus léger pour dev quotidien
- Pas besoin containers pour environnements simples
- Intégration native shell
- Partage facile entre équipe

**Quand utiliser Flox au lieu Docker :**
- Environnements dev locaux
- Outils CLI multi-langages
- Dépendances complexes sans containerisation full

### Setup Environnement Base Robots
```bash
# Créer environnement pour robots
flox init robots-env

# Installer dépendances Python
flox install python311 pip poetry

# Installer outils Go (pour opencode)
flox install go golangci-lint

# Installer Node.js pour apps web
flox install nodejs npm yarn

# Installer outils dev
flox install git gh ripgrep jq

# Activer environnement
flox activate robots-env
```

## Intégration CI/CD Blacksmith

### Workflow GitHub Actions
```yaml
# .github/workflows/ci.yml
name: CI with Flox

on: [push, pull_request]

jobs:
  test:
    runs-on: blacksmith-ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Flox
        uses: flox/install-flox-action@v1
      
      - name: Activate environment
        run: flox activate robots-env
      
      - name: Install dependencies
        run: flox install --packages python311 poetry
      
      - name: Run tests
        run: poetry run pytest
```

## Gestion Environnements par Projet

### Structure Recommandée
```
robots/
├── flox.nix          # Configuration Flox (optionnel)
├── .flox/           # Config auto-générée
└── src/
    ├── seo/
    ├── newsletter/
    └── articles/
```

### Environnements Spécialisés
```bash
# Environnement SEO (CrewAI)
flox init seo-env
flox install python311 crewai pydantic-ai exa-ai

# Environnement Newsletter
flox init newsletter-env
flox install python311 pydantic-ai firecrawl-py

# Environnement Articles
flox init articles-env
flox install python311 crewai firecrawl-py
```

## Migration depuis Docker

### Scénario 1 : Dev Local
**Avant (Docker) :**
```bash
docker run -it --rm -v $(pwd):/app python:3.11 bash
pip install -r requirements.txt
python main.py
```

**Après (Flox) :**
```bash
flox init my-project
flox install python311
flox activate my-project
pip install -r requirements.txt
python main.py
```

### Scénario 2 : Multi-Environnements
**Avant :** Containers séparés pour chaque service
**Après :** Environnements Flox isolés mais légers

## Commandes Essentielles

### Gestion Environnements
```bash
# Créer environnement
flox init <name>

# Activer environnement
flox activate <name>

# Installer packages
flox install <package>

# Lister packages
flox list

# Partager environnement
flox push <org>/<env>
```

### Collaboration
```bash
# Pull environnement partagé
flox pull <org>/<env>

# Mettre à jour
flox update

# Voir différences
flox diff
```

## Troubleshooting

### Problèmes Courants
```bash
# Reset environnement
flox reset

# Vider cache
flox cache clear

# Debug activation
flox activate --verbose
```

### Support
- [Documentation Flox](https://flox.dev/docs/)
- [Discord Flox](https://go.flox.dev/slack)
- [GitHub Issues](https://github.com/flox/flox/issues)

## Migration du Script Dokploy

### Modification /root/server-config/src/dokploy-dev.sh
Ajouter section Flox :

```bash
#!/bin/bash

# Installation Flox
echo "Installing Flox..."
curl -fsSL https://get.flox.dev | bash

# Configuration base
flox init robots-dev
flox install python311 nodejs go git gh

echo "Flox setup complete!"
```

### Alternative : Remplacement Progressif
1. Garder Docker pour production/containerisation
2. Utiliser Flox pour dev local et CI/CD
3. Migrer graduellement si bénéfices prouvés

## Métriques Succès
- **Temps Setup** : <5 min vs 30+ min Docker
- **Adoption Équipe** : 80% utilisation quotidienne
- **Erreurs CI/CD** : -90% "works on my machine"

## Prochaines Étapes
1. Test installation sur machines équipe
2. Créer environnements par projet
3. Intégrer CI/CD Blacksmith
4. Former équipe utilisation

Ce guide permet adoption Flox comme outil standard développement, potentiellement réduisant complexité Docker tout en maintenant isolation.</content>
<parameter name="filePath">docs/flox-installation.md
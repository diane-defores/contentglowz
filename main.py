#!/usr/bin/env python3
"""
Point d'entrée principal pour les robots d'automatisation
"""
import os
import sys
from pathlib import Path

def main():
    print("🤖 My Robots - Système d'automatisation intelligent")
    print("=" * 60)
    print()
    print("Robots disponibles:")
    print("  1. SEO Robot - Optimisation SEO multi-agents")
    print("  2. Newsletter Agent - Génération automatique de newsletters")
    print("  3. Article Generator - Génération d'articles avec analyse concurrence")
    print()
    print("Configuration:")
    
    # Vérifier les variables d'environnement
    env_vars = [
        "GROQ_API_KEY"
    ]
    
    missing_vars = []
    for var in env_vars:
        value = os.getenv(var, "")
        if not value or value.startswith("your_"):
            missing_vars.append(var)
            print(f"  ❌ {var}: Non configurée")
        else:
            print(f"  ✅ {var}: Configurée")
    
    print()
    print("ℹ️  Ce projet utilise Groq (gratuit, 14k requêtes/jour)")
    print("   Obtenez votre clé : https://console.groq.com")
    print()
    
    if missing_vars:
        print("⚠️  Configuration incomplète!")
        print("   1. Créez un compte gratuit : https://console.groq.com")
        print("   2. Générez une clé API")
        print("   3. Ajoutez-la dans Doppler : doppler secrets set GROQ_API_KEY=...")
        print()
        print("   Voir : docs/GROQ_SETUP.md")
        return 1
    
    print("✅ Configuration complète! Les robots sont prêts.")
    print()
    print("Pour démarrer:")
    print("  - SEO: python -m src.seo.workflows.seo_crew")
    print("  - Newsletter: python -m src.newsletter.agents.newsletter_agent")
    print("  - Articles: python -m src.articles.agents.article_generator")
    
    return 0

if __name__ == "__main__":
    # Charger les variables d'environnement depuis .env
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        print("⚠️  Module python-dotenv non trouvé")
    
    sys.exit(main())

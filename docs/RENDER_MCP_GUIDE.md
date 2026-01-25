# Render MCP Server - Guide d'utilisation

## 🎯 Qu'est-ce que c'est ?

Le **Render MCP Server** vous permet de gérer votre infrastructure Render **directement depuis votre IDE** (Cursor, Claude Code, etc.) en langage naturel.

## ✅ Cas d'usage pour votre projet

### 1. Gestion de Déploiement
```
👤 "Déploie mon service bizflowz-api avec la dernière version"
🤖 MCP → Render API → Déploiement lancé
```

### 2. Monitoring et Logs
```
👤 "Montre-moi les erreurs des dernières 24h sur bizflowz-api"
🤖 MCP → Récupère les logs → Affiche les erreurs
```

### 3. Analyse de Performance
```
👤 "Quelle était l'utilisation CPU de mon service hier ?"
🤖 MCP → Metrics API → Graphique d'utilisation
```

### 4. Gestion des Variables d'Env
```
👤 "Ajoute YDC_API_KEY à mes variables d'environnement"
🤖 MCP → Met à jour les env vars → Redéploie si besoin
```

### 5. Création de Services
```
👤 "Crée une nouvelle base de données Postgres user-db avec 5GB"
🤖 MCP → Render API → Base créée
```

### 6. Debugging
```
👤 "Pourquoi mon site bizflowz-api.onrender.com ne fonctionne pas ?"
🤖 MCP → Vérifie status, logs, métriques → Diagnostic
```

---

## 🚀 Fonctionnalités Disponibles

### Services
- ✅ Créer web services, static sites, cron jobs
- ✅ Lister tous les services du workspace
- ✅ Récupérer détails d'un service
- ✅ Modifier variables d'environnement
- ❌ Pas de suppression (sécurité)

### Déploiements
- ✅ Voir historique des déploiements
- ✅ Détails d'un déploiement spécifique
- ❌ Pas de trigger manuel de déploiement

### Logs
- ✅ Filtrer les logs par niveau (error, warn, info)
- ✅ Rechercher dans les logs
- ✅ Logs en temps réel (via prompts)

### Métriques
- ✅ CPU / Memory usage
- ✅ Instance count
- ✅ Response times (Pro workspace)
- ✅ Bandwidth usage
- ✅ Response counts par status code

### Bases de Données (Postgres)
- ✅ Créer nouvelle DB
- ✅ Lister toutes les DB
- ✅ Exécuter requêtes SQL **read-only**
- ✅ Détails d'une DB

### Key Value Store
- ✅ Créer instances
- ✅ Lister instances
- ✅ Détails d'une instance

---

## 📦 Configuration

### Option 1 : Hosted MCP (Recommandé)

**Pour Cursor** (`~/.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "render": {
      "url": "https://mcp.render.com/mcp",
      "type": "sse",
      "headers": {
        "Authorization": "Bearer <RENDER_API_KEY>"
      }
    }
  }
}
```

**Pour Claude Code**:
```bash
claude mcp add --transport http render https://mcp.render.com/mcp \
  --header "Authorization: Bearer <RENDER_API_KEY>"
```

**Pour Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "render": {
      "url": "https://mcp.render.com/mcp",
      "headers": {
        "Authorization": "Bearer <RENDER_API_KEY>"
      }
    }
  }
}
```

### Option 2 : Local Docker (Optionnel)
```json
{
  "mcpServers": {
    "render": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-e", "RENDER_API_KEY=<YOUR_API_KEY>",
        "ghcr.io/render-oss/render-mcp-server:latest"
      ]
    }
  }
}
```

---

## 🔑 Créer une API Key Render

1. Allez sur : https://dashboard.render.com/settings#api-keys
2. Cliquez "Create API Key"
3. Copiez la clé (format: `rnd_...`)
4. Ajoutez-la à votre config MCP

**⚠️ Attention :**
- La clé donne accès à **tous vos workspaces**
- Gardez-la secrète
- Ne la commitez jamais dans Git

---

## 💡 Exemples de Prompts

### Monitoring
```
"Montre-moi les métriques CPU de bizflowz-api pour aujourd'hui"
"Quels sont les derniers logs d'erreur ?"
"Affiche les temps de réponse moyens cette semaine"
```

### Debugging
```
"Pourquoi mon service ne répond pas ?"
"Analyse les erreurs des dernières 2 heures"
"Vérifie l'état de santé de mes services"
```

### Déploiement
```
"Liste mes derniers déploiements"
"Quel commit est actuellement déployé ?"
"Y a-t-il eu des erreurs de build récemment ?"
```

### Base de Données
```
"Combien d'utilisateurs ai-je dans ma DB ?"
"Montre-moi les requêtes les plus lentes"
"Quelle est l'utilisation de ma base de données ?"
```

### Configuration
```
"Ajoute FIRECRAWL_API_KEY à mes variables d'environnement"
"Liste toutes les env vars de bizflowz-api"
"Quelle est la valeur de OPENROUTER_API_KEY ?"
```

---

## ✅ Avantages pour Votre Projet

### 1. Debugging Plus Rapide
Au lieu de :
1. Ouvrir dashboard Render
2. Chercher le service
3. Onglet Logs
4. Filtrer manuellement

Vous faites :
```
"Montre les erreurs bizflowz-api des 10 dernières minutes"
```

### 2. Monitoring en Context
Pendant que vous codez dans Cursor/Claude Code :
```
"Est-ce que mon dernier déploiement a réussi ?"
"Y a-t-il des erreurs actuellement ?"
```

### 3. Modifications Rapides
```
"Ajoute YDC_API_KEY=abc123 à mes variables d'environnement"
→ MCP le fait instantanément
```

### 4. Analyse de Performance
```
"Compare l'utilisation CPU avant/après ma dernière optimisation"
→ MCP récupère les métriques et compare
```

---

## ⚠️ Limitations

### Ce qui N'EST PAS supporté :
- ❌ Supprimer des services (sécurité)
- ❌ Modifier scaling settings
- ❌ Créer des free instances
- ❌ Services image-backed
- ❌ IP allowlists
- ❌ Trigger manuel de déploiement

### Opérations Potentiellement Destructives :
- ⚠️ Modifier variables d'environnement (peut redéployer)

---

## 🎯 Recommandation pour Votre Projet

### ✅ À CONFIGURER - Très Utile

**Pourquoi ?**
1. **Monitoring simplifié** : Vérifier logs/métriques sans quitter votre IDE
2. **Debugging rapide** : Analyser erreurs pendant le développement
3. **Gestion env vars** : Ajouter API keys rapidement
4. **Analyse performance** : Suivre l'impact de vos optimisations

**Cas d'usage concrets :**
- Après un push : "Est-ce que le build a réussi ?"
- En développant : "Y a-t-il des erreurs en production ?"
- En optimisant : "Comment évolue l'utilisation mémoire ?"
- En debuggant : "Quelles sont les dernières erreurs 500 ?"

### 🚀 Configuration Rapide

1. **Créer API Key Render** (2 min)
   - https://dashboard.render.com/settings#api-keys

2. **Ajouter à votre IDE** (1 min)
   - Cursor : `~/.cursor/mcp.json`
   - Claude Code : `claude mcp add ...`

3. **Utiliser** (immédiat!)
   ```
   "Set my Render workspace to [YOUR_WORKSPACE]"
   "List my services"
   "Show recent logs for bizflowz-api"
   ```

---

## 📊 Comparaison : Avec vs Sans MCP

### Sans MCP (Workflow actuel)
```
1. Ouvrir browser
2. Dashboard Render
3. Chercher service
4. Cliquer Logs
5. Filtrer manuellement
6. Copier erreurs
7. Retourner à l'IDE
8. Debugger
```
**Temps : ~2-3 minutes**

### Avec MCP
```
"Montre les erreurs bizflowz-api des 10 dernières minutes"
```
**Temps : ~5 secondes**

**Gain de productivité : 95%** ⚡

---

## 🔒 Sécurité

### Données Sensibles
- MCP tente de **minimiser l'exposition** de secrets
- Mais Render ne **garantit pas** qu'ils ne seront jamais exposés
- ⚠️ Faites attention avec les connection strings, API keys

### Bonnes Pratiques
1. Ne partagez jamais votre `RENDER_API_KEY`
2. Ne commitez pas vos configs MCP avec des clés
3. Utilisez des prompts génériques (pas de secrets dans les prompts)
4. Vérifiez ce que MCP va faire avant de confirmer

---

## 📚 Resources

- **Render MCP Docs** : https://render.com/docs/mcp-server
- **GitHub Repo** : https://github.com/render-oss/render-mcp-server
- **MCP Protocol** : https://modelcontextprotocol.io/
- **Cursor MCP Docs** : https://docs.cursor.com/context/mcp
- **Claude Code MCP** : https://docs.anthropic.com/en/docs/claude-code/mcp

---

## ✅ Checklist de Configuration

- [ ] Créer API key Render
- [ ] Ajouter config MCP à votre IDE
- [ ] Tester avec "List my services"
- [ ] Définir workspace par défaut
- [ ] Essayer quelques prompts de monitoring
- [ ] Ajouter au workflow quotidien

**Temps total : 5-10 minutes**
**ROI : Énorme ! Vous allez gagner des heures chaque semaine** 🎉

---

## 🎊 Conclusion

**OUI, le Render MCP est très utile pour vous !**

Il va transformer votre workflow :
- ✅ Monitoring instantané depuis l'IDE
- ✅ Debugging 20x plus rapide
- ✅ Gestion env vars simplifiée
- ✅ Analyse performance en temps réel
- ✅ Moins de context switching

**Recommandation : Configurez-le maintenant, vous allez l'adorer !** 🚀

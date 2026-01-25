# 🤖 My Robots - Architecture avec Flox

## Pourquoi Flox + Nix ?

### ✅ Avantages

1. **Reproductibilité** : Le fichier `.flox/env/manifest.toml` définit TOUT l'environnement
   - Quelqu'un clone le repo → `flox activate` → environnement identique
   - Fonctionne sur Linux, macOS, peu importe la distro

2. **Isolation** : Pas de conflits avec d'autres projets
   - Chaque projet a son propre environnement Flox
   - Python et dépendances isolés

3. **Immutabilité Nix** : Paquets dans `/nix/store/` ne changent jamais
   - Pas de "ça marchait hier mais plus aujourd'hui"
   - Version de Python fixée

4. **Pas besoin d'installer Python** : Flox fournit Python 3.11
   - Plus de problèmes de versions système

### 🔧 Comment ça marche ?

```
Flox (user-friendly)
    ↓
Nix (gestionnaire de paquets)
    ↓
/nix/store/ (immutable)
    ↓
Python 3.11 read-only
    ↓
venv/ (mutable, pour nos dépendances pip)
```

**Pourquoi venv/** ?
- Nix fournit Python (immutable)
- venv/ permet d'installer des packages Python avec pip (mutable)
- Meilleur des deux mondes !

## 🚀 Setup pour un nouveau développeur

### Option 1 : Avec Flox (recommandé)

```bash
# 1. Cloner le repo
git clone https://github.com/dianedef/my-robots.git
cd my-robots

# 2. Activer l'environnement Flox (crée automatiquement venv/)
flox activate

# 3. Installer les dépendances Python (première fois seulement)
pip install -r requirements.txt

# 4. Configurer les clés API
cp .env.example .env
nano .env

# 5. Tester
python main.py
```

### Option 2 : Script automatique

```bash
./setup.sh
flox activate
```

## 📂 Fichiers clés

```
my-robots/
├── .flox/
│   └── env/
│       └── manifest.toml    # ⭐ Définition environnement Flox
├── venv/                     # ❌ Pas committé (dans .gitignore)
├── .env                      # ❌ Pas committé (secrets)
├── .env.example              # ✅ Template committé
├── requirements.txt          # ✅ Dépendances Python
├── setup.sh                  # ✅ Script setup automatique
└── main.py                   # ✅ Point d'entrée
```

## 🎯 Workflow quotidien

```bash
# Démarrer une session de travail
flox activate

# Python et pip sont maintenant dans le PATH
python main.py
pip install nouvelle-lib

# Sortir de l'environnement
exit  # ou Ctrl+D
```

## 🔄 Partager l'environnement

Le fichier `.flox/env/manifest.toml` est versionné dans Git.

**Tout le monde aura exactement** :
- ✅ Python 3.11
- ✅ Variables d'environnement définies
- ✅ Scripts d'activation automatiques
- ✅ Structure de projet identique

**Chacun configure localement** :
- `.env` avec ses propres clés API
- `venv/` créé automatiquement

## 💡 Comparaison

| Sans Flox | Avec Flox |
|-----------|-----------|
| "Installe Python 3.11" | `flox activate` → Python 3.11 dispo |
| "Ça marche sur ma machine" | Reproductible partout |
| Conflits entre projets | Isolation totale |
| `virtualenv`, `pyenv`, `conda`... | Une seule solution : Flox |

## 🛠️ Commandes utiles

```bash
# Voir les paquets installés
flox list

# Installer un nouveau paquet système
flox install git

# Éditer le manifest
flox edit

# Mettre à jour l'environnement
flox pull

# Voir les infos
flox show
```

## ❓ FAQ

**Q: Pourquoi pas juste venv/ ?**
A: venv/ seul ne garantit pas la version de Python. Avec Flox, Python 3.11 est garanti.

**Q: Dois-je committer venv/ ?**
A: NON ! venv/ est dans .gitignore. Seul requirements.txt est committé.

**Q: setup.sh est-il utile avec Flox ?**
A: Oui ! Il automatise la création de venv/ et l'installation des dépendances.

**Q: Ça marche sur Windows ?**
A: Flox fonctionne mieux sur Linux/macOS. Windows → utiliser WSL2.

## 🎓 Ressources

- [Documentation Flox](https://flox.dev/docs)
- [Pourquoi Nix ?](https://nixos.org/guides/how-nix-works.html)

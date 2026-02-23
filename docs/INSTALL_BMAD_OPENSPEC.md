# Installer BMAD Method + OpenSpec dans un repo

Guide pour installer les deux frameworks de spec-driven development cote a cote dans un meme projet, avec Claude Code comme outil AI.

## Prerequis

- **Node.js** >= 20.19.0
- **Git**
- **Claude Code** (ou autre assistant AI compatible)

## 1. Installer BMAD Method

[BMAD Method](https://github.com/bmad-code-org/BMAD-METHOD) (Breakthrough Method for Agile AI Driven Development) — framework multi-agents pour le cycle de dev agile complet (analyse, architecture, dev, QA, etc.).

### Installation rapide (non-interactive)

```bash
cd ton-projet
npx bmad-method install --directory . --modules bmm --tools claude-code --yes
```

### Installation interactive

```bash
npx bmad-method install
```

L'installeur demande :
1. **Directory** — ou installer les fichiers BMAD (`.` = racine du projet)
2. **Modules** — choisir `bmm` (BMad Method, le module de dev logiciel)
3. **Tools** — choisir `claude-code` pour Claude Code

### Ce qui est cree

```
ton-projet/
├── _bmad/                          # Coeur du framework
│   ├── core/                       # Moteur BMAD (CORE = Collaboration Optimized Reflection Engine)
│   ├── bmm/                        # Module BMad Method (agents, workflows, tasks)
│   ├── _config/                    # Configuration et manifestes
│   │   ├── agents/                 # Fichiers de customisation par agent
│   │   ├── ides/claude-code.yaml   # Config specifique Claude Code
│   │   ├── manifest.yaml           # Manifeste global
│   │   └── *-manifest.csv          # Catalogues (agents, workflows, tasks, tools)
│   └── _memory/                    # Memoire persistante BMAD
├── _bmad-output/                   # Artefacts generes
│   ├── planning-artifacts/         # PRD, architecture, briefs
│   └── implementation-artifacts/   # Stories, epics, code genere
├── .claude/
│   └── commands/                   # Slash commands pour Claude Code
│       ├── bmad-agent-*.md         # 10 agents (analyst, architect, dev, pm, qa, sm, etc.)
│       ├── bmad-bmm-*.md           # 25 workflows (create-prd, sprint-planning, code-review, etc.)
│       └── bmad-*.md               # Commandes utilitaires (help, brainstorming, etc.)
└── docs/                           # Dossier docs (cree si absent)
```

### Agents disponibles (10)

| Agent | Role |
|-------|------|
| `bmad-master` | Orchestrateur principal |
| `bmm-analyst` | Analyse de domaine et marche |
| `bmm-architect` | Architecture technique |
| `bmm-dev` | Developpement |
| `bmm-pm` | Product Manager |
| `bmm-qa` | Assurance qualite |
| `bmm-sm` | Scrum Master |
| `bmm-tech-writer` | Documentation technique |
| `bmm-ux-designer` | Design UX |
| `bmm-quick-flow-solo-dev` | Dev solo rapide |

### Commandes cles

```
/bmad-help                          # Aide et catalogue des workflows
/bmad-bmm-create-prd                # Creer un PRD
/bmad-bmm-create-architecture       # Creer l'architecture
/bmad-bmm-create-epics-and-stories  # Generer epics et stories
/bmad-bmm-dev-story                 # Implementer une story
/bmad-bmm-sprint-planning           # Planifier un sprint
/bmad-bmm-code-review               # Review de code
/bmad-bmm-quick-dev                 # Dev rapide (solo)
/bmad-bmm-quick-spec                # Spec rapide (solo)
```

---

## 2. Installer OpenSpec

[OpenSpec](https://github.com/Fission-AI/OpenSpec) — framework leger de spec-driven development (SDD) qui structure chaque changement en proposal/specs/design/tasks.

### Installation

```bash
# Installer globalement (optionnel mais recommande)
npm install -g @fission-ai/openspec@latest

# Initialiser dans le projet
cd ton-projet
openspec init --tools claude
```

Ou en une seule commande sans install globale :

```bash
npx @fission-ai/openspec@latest init --tools claude
```

### Tools disponibles

`--tools` accepte : `claude`, `cursor`, `windsurf`, `codex`, `gemini`, `github-copilot`, `roocode`, `cline`, et [20+ autres](https://github.com/Fission-AI/OpenSpec).

Utiliser `--tools all` pour tout installer, ou `--tools claude,cursor` pour plusieurs outils.

### Ce qui est cree

```
ton-projet/
├── openspec/                       # Coeur du framework
│   ├── changes/                    # Changements en cours
│   │   └── archive/                # Changements termines
│   └── specs/                      # Specifications du projet
├── .claude/
│   └── commands/
│       └── opsx/                   # Slash commands OpenSpec
│           ├── new.md              # Demarrer un nouveau changement
│           ├── ff.md               # Fast-forward : generer tous les docs de planning
│           ├── continue.md         # Creer le prochain artefact
│           ├── apply.md            # Implementer les taches
│           ├── verify.md           # Verifier l'implementation
│           ├── archive.md          # Archiver un changement termine
│           ├── bulk-archive.md     # Archiver en masse
│           ├── explore.md          # Explorer le codebase
│           ├── sync.md             # Synchroniser les specs
│           └── onboard.md          # Onboarding projet
```

### Workflow type

```
/opsx:new ma-feature       # 1. Creer un nouveau changement
/opsx:ff                    # 2. Generer proposal + specs + design + tasks
/opsx:apply                 # 3. Implementer les taches generees
/opsx:verify                # 4. Verifier l'implementation
/opsx:archive               # 5. Archiver le changement termine
```

### Commandes supplementaires

```
/opsx:continue              # Creer le prochain artefact dans la sequence
/opsx:explore               # Explorer et comprendre le codebase
/opsx:sync                  # Synchroniser les specs avec le code
/opsx:onboard               # Onboarding complet du projet
/opsx:bulk-archive          # Archiver plusieurs changements d'un coup
```

---

## 3. Les deux ensemble

### Structure finale combinee

```
ton-projet/
├── _bmad/                          # BMAD Method (agents, workflows, core)
├── _bmad-output/                   # BMAD artefacts generes
├── openspec/                       # OpenSpec (changes, specs)
├── .claude/
│   └── commands/
│       ├── bmad-*.md               # ~41 commandes BMAD
│       └── opsx/                   # ~10 commandes OpenSpec
└── docs/
```

### Quand utiliser quoi ?

| Besoin | Outil |
|--------|-------|
| Planification agile complete (PRD, architecture, sprints) | BMAD Method |
| Changement rapide et structure (feature, bugfix) | OpenSpec |
| Multi-agents specialises (analyst, architect, QA...) | BMAD Method |
| Spec-driven development leger et iteratif | OpenSpec |
| Sprint planning et retrospectives | BMAD Method |
| Tracking de changements individuels avec archivage | OpenSpec |

### Pas de conflit

Les deux frameworks coexistent sans probleme :
- **BMAD** utilise `_bmad/` et `_bmad-output/` + commandes prefixees `bmad-*`
- **OpenSpec** utilise `openspec/` + commandes dans le sous-dossier `opsx/`
- Les slash commands Claude Code ne se chevauchent pas (`/bmad-*` vs `/opsx:*`)

### .gitignore recommande

Ajouter selon les besoins :

```gitignore
# BMAD - garder _bmad/ et _bmad-output/ dans git pour le travail d'equipe
# Exclure la memoire locale si besoin
_bmad/_memory/

# OpenSpec - garder openspec/ dans git
# Les archives peuvent etre exclues si trop volumineuses
# openspec/changes/archive/
```

---

## Mise a jour

### BMAD Method

```bash
npx bmad-method install    # Re-lancer l'installeur (met a jour les fichiers)
```

### OpenSpec

```bash
openspec update            # Depuis la racine du projet
# ou
npx @fission-ai/openspec@latest update
```

---

## Liens

- BMAD Method : [GitHub](https://github.com/bmad-code-org/BMAD-METHOD) | [Docs](https://docs.bmad-method.org/)
- OpenSpec : [GitHub](https://github.com/Fission-AI/OpenSpec)

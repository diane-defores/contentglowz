# Documentation Organization

## 📁 New Documentation Structure

All robot-specific documentation has been reorganized into a clear, hierarchical structure.

---

## 🗂️ Directory Structure

```
my-robots/
├── docs/
│   ├── robots/                           # Robot-specific documentation
│   │   ├── README.md                     # Index of all robots
│   │   │
│   │   └── scheduler/                    # Scheduler Robot docs ⭐
│   │       ├── README.md                 # Documentation index
│   │       ├── architecture-specs.md     # Complete technical specs
│   │       ├── final-architecture.md     # System architecture
│   │       ├── implementation-summary.md # What was built
│   │       ├── refactoring-decisions.md  # Design rationale
│   │       ├── refactoring-complete.md   # Zero redundancy validation
│   │       └── changelog.md              # Version history
│   │
│   ├── ROBOT_ARCHITECTURE_OVERVIEW.md   # All 4 robots overview
│   ├── agents-specs.md                   # All agent specifications
│   ├── plan.md                           # Project vision
│   ├── phases.md                         # Development phases
│   └── agents/                           # (legacy - will be reorganized)
│
├── agents/
│   ├── scheduler/
│   │   ├── README.md                     # User-facing README (links to docs/)
│   │   ├── scheduler_crew.py             # Main implementation
│   │   ├── calendar_manager.py
│   │   ├── publishing_agent.py
│   │   ├── site_health_monitor.py
│   │   ├── tech_stack_analyzer.py
│   │   ├── config/
│   │   ├── schemas/
│   │   ├── tools/
│   │   └── examples/
│   │
│   └── seo/
│       ├── README.md
│       ├── on_page_technical_seo.py      # Renamed from technical_seo.py
│       └── ...
│
└── CLAUDE.md                             # Project overview
```

---

## 📚 Documentation Hierarchy

### Top Level: Project-Wide Docs
**Location:** `/docs/`

- **ROBOT_ARCHITECTURE_OVERVIEW.md** - How all 4 robots work together
- **agents-specs.md** - Specifications for all agents across all robots
- **plan.md** - Project vision and strategic objectives
- **phases.md** - Development roadmap

---

### Second Level: Robot-Specific Docs
**Location:** `/docs/robots/{robot_name}/`

Each robot gets its own documentation directory:

#### Scheduler Robot (`/docs/robots/scheduler/`)
- **README.md** - Documentation index and navigation
- **architecture-specs.md** - Technical specifications, schemas, tools
- **final-architecture.md** - System architecture, tool sharing, design patterns
- **implementation-summary.md** - What was built, file statistics, delivery checklist
- **refactoring-decisions.md** - Why agents were renamed, architectural decisions
- **refactoring-complete.md** - Zero redundancy achievement validation
- **changelog.md** - Version history, breaking changes, migration guides

#### Future Robot Docs
- `/docs/robots/seo/` - SEO Robot documentation (to be organized)
- `/docs/robots/newsletter/` - Newsletter Agent documentation (to be organized)
- `/docs/robots/articles/` - Article Generator documentation (to be organized)

---

### Third Level: Agent Implementation
**Location:** `/agents/{robot_name}/`

Agent README files are **user-facing** and link to comprehensive docs:

```python
# In /agents/scheduler/README.md
"See complete documentation in /docs/robots/scheduler/"
```

---

## 🎯 Navigation Guide

### For New Users
1. Start: **`/CLAUDE.md`** - Project overview
2. Then: **`/docs/ROBOT_ARCHITECTURE_OVERVIEW.md`** - How all robots work
3. Deep dive: **`/docs/robots/scheduler/README.md`** - Specific robot docs

### For Developers
1. Architecture: **`/docs/robots/scheduler/final-architecture.md`**
2. Specs: **`/docs/robots/scheduler/architecture-specs.md`**
3. Code: **`/agents/scheduler/`**

### For Maintainers
1. Changelog: **`/docs/robots/scheduler/changelog.md`**
2. Implementation: **`/agents/scheduler/scheduler_crew.py`**
3. Decisions: **`/docs/robots/scheduler/refactoring-decisions.md`**

---

## 📋 Documentation Standards

### File Naming
- Use **kebab-case**: `architecture-specs.md`, not `Architecture_Specs.md`
- Be descriptive: `refactoring-decisions.md`, not `refactor.md`
- Use standard names: `README.md`, `CHANGELOG.md`

### Content Structure
- **Clear headings** with emoji for visual scanning
- **Code examples** where applicable
- **Cross-references** to related docs
- **Status indicators** (✅ complete, ⚠️ warning, etc.)

### Location Guidelines
- **Project-wide concepts** → `/docs/`
- **Robot-specific details** → `/docs/robots/{robot_name}/`
- **User guides** → `/agents/{robot_name}/README.md`
- **Code** → `/agents/{robot_name}/*.py`

---

## 🔄 Migration from Old Structure

### What Changed
```
Before:
/docs/agents/scheduler-robot.md           # Mixed with other agent docs
/agents/scheduler/ARCHITECTURE_*.md       # Scattered in code directory
/agents/scheduler/IMPLEMENTATION_*.md
/agents/scheduler/CHANGELOG.md

After:
/docs/robots/scheduler/                   # All in one place
├── architecture-specs.md
├── final-architecture.md
├── implementation-summary.md
├── refactoring-decisions.md
├── refactoring-complete.md
└── changelog.md
```

### Why Better?
1. ✅ **Centralized** - All docs in one place
2. ✅ **Organized** - Clear hierarchy
3. ✅ **Scalable** - Easy to add more robots
4. ✅ **Discoverable** - README.md files guide navigation

---

## 🚀 Future Organization

As other robots mature, organize their docs similarly:

```
/docs/robots/
├── scheduler/     ✅ Done
├── seo/          🔜 To be organized
├── newsletter/   🔜 To be organized
└── articles/     🔜 To be organized
```

Each will follow the same pattern:
- README.md (index)
- architecture-specs.md
- implementation-summary.md
- changelog.md
- etc.

---

## 📝 Quick Reference

| Looking for... | Location |
|---------------|----------|
| Project overview | `/CLAUDE.md` |
| All robots architecture | `/docs/ROBOT_ARCHITECTURE_OVERVIEW.md` |
| Scheduler Robot specs | `/docs/robots/scheduler/architecture-specs.md` |
| Scheduler Robot architecture | `/docs/robots/scheduler/final-architecture.md` |
| What was built | `/docs/robots/scheduler/implementation-summary.md` |
| Why agents renamed | `/docs/robots/scheduler/refactoring-decisions.md` |
| Version history | `/docs/robots/scheduler/changelog.md` |
| Usage examples | `/agents/scheduler/README.md` |
| Code implementation | `/agents/scheduler/*.py` |

---

**Organization Date:** January 17, 2026
**Status:** ✅ Complete
**Maintained By:** Scheduler Robot Team

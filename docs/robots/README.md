# Robots Documentation

Documentation for all robots in the my-robots project.

## Available Robots

### 1. SEO Robot
Multi-agent CrewAI system for SEO content generation with STORM integration.

**Documentation:** [seo/](./seo/)
- [README](./seo/README.md) - Framework overview, audit checklist, implementation
- [Agents](./seo/agents.md) - 6 specialized agents with roles and workflow
- [STORM Integration](./seo/storm-integration.md) - Wikipedia-style article generation

**Agents:**
- Research Analyst - Competitive intelligence, SERP analysis
- Content Strategist - Topical mesh, content architecture
- Marketing Strategist - Business priorities, ROI
- Copywriter - SEO-optimized content
- Technical SEO Specialist - Schema, on-page optimization
- Editor - Final QA, consistency

---

### 2. Newsletter Robot
PydanticAI-based newsletter generation with Exa AI.

**Documentation:** [newsletter/](./newsletter/)
- [README](./newsletter/README.md) - Architecture, Exa integration, schemas

**Features:**
- Exa AI content curation
- Pydantic schema validation
- Automated weekly newsletters
- Quality filtering (relevance >0.7)

---

### 3. Article Generator
CrewAI agent using Firecrawl for competitor analysis.

**Documentation:** [articles/](./articles/)
- [README](./articles/README.md) - Workflow, Firecrawl integration, schemas

**Features:**
- Firecrawl competitor crawling
- Content gap analysis
- Original article generation
- SEO validation pipeline

---

### 4. Scheduler Robot
Multi-agent system for content scheduling, publishing, and health monitoring.

**Documentation:** [scheduler/](./scheduler/)
- [README](./scheduler/README.md) - Docs index
- [Architecture Specs](./scheduler/architecture-specs.md)
- [Final Architecture](./scheduler/final-architecture.md)
- [Implementation Summary](./scheduler/implementation-summary.md)
- [Refactoring Decisions](./scheduler/refactoring-decisions.md)
- [Changelog](./scheduler/changelog.md)

**Agents:**
- Calendar Manager - Publishing schedule optimization
- Publishing Agent - Git deployment, API integration
- Site Health Monitor - Technical SEO analysis
- Tech Stack Analyzer - Dependency and vulnerability scanning

---

## Documentation Structure

```
docs/robots/
├── README.md              # This index
├── seo/
│   ├── README.md          # SEO framework (2026 standards)
│   ├── agents.md          # 6 agent specifications
│   └── storm-integration.md # STORM article generation
├── newsletter/
│   └── README.md          # Newsletter automation
├── articles/
│   └── README.md          # Article generation
└── scheduler/
    ├── README.md
    ├── architecture-specs.md
    ├── final-architecture.md
    ├── implementation-summary.md
    ├── refactoring-decisions.md
    ├── refactoring-complete.md
    └── changelog.md
```

## Quick Links

- **Project Overview:** [/CLAUDE.md](/CLAUDE.md)
- **Agent Specifications:** [/AGENTS.md](/AGENTS.md)
- **Environment Setup:** [/docs/ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
- **LLM Configuration:** [/docs/LLM_PROVIDER_SETUP.md](./LLM_PROVIDER_SETUP.md)
- **Architecture Overview:** [/docs/ROBOT_ARCHITECTURE_OVERVIEW.md](./ROBOT_ARCHITECTURE_OVERVIEW.md)

---

*Last Updated: January 2026*

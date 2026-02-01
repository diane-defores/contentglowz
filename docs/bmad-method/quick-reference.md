# BMAD Method Quick Reference

Quick reference guide for common BMAD workflows, commands, and patterns.

## Essential Commands

### Status & Navigation
```
*workflow-status      # Check current project status
*workflow-init        # Initialize project (Analyst agent)
*help                 # Show agent-specific help menu
```

### Planning Phase
```
*prd                  # Create Product Requirements Document (PM)
*tech-spec            # Create Technical Specification (PM/Architect)
*ux-design            # Design user experience (UX Designer)
```

### Solutioning Phase
```
*architecture         # Design system architecture (Architect)
*create-epics-and-stories  # Break into stories (Scrum Master)
*adr                  # Create Architecture Decision Record (Architect)
```

### Implementation Phase
```
*sprint-planning      # Plan sprint (Scrum Master)
*dev-story [id]       # Implement story (Developer)
*code-review          # Review code (Developer/Architect)
*test-story [id]      # Create tests (Test Architect)
```

### Quick Flow
```
*quick-spec           # Minimal specification (Barry)
*quick-dev            # Rapid implementation (Barry)
```

## Agent Quick Reference

| Task | Load Agent | Command |
|------|-----------|---------|
| Start project | Analyst | `*workflow-init` |
| Define requirements | PM | `*prd` |
| Design architecture | Architect | `*architecture` |
| Plan sprint | Scrum Master | `*sprint-planning` |
| Implement feature | Developer | `*dev-story` |
| Create tests | Test Architect | `*test-story` |
| Write docs | Tech Writer | `*document` |
| Quick fix | Barry | `*quick-dev` |

## Planning Track Selection

| Track | Use For | Planning Time | Stories |
|-------|---------|---------------|---------|
| **Quick Flow** | Bugs, small features | <5 min | 1-5 |
| **BMad Method** | Products, platforms | <15 min | 10-50+ |
| **Enterprise** | Compliance, scale | <30 min | 30+ |

**Chat SDK Default**: BMad Method

## Phase Workflow Sequence

### BMad Method Track (Standard)

```
Phase 1: Analysis (Optional)
└─ *workflow-init (Analyst)
└─ *brainstorm-project (optional)
└─ *research (optional)

Phase 2: Planning (Required)
└─ *prd (PM)
└─ *tech-spec (PM/Architect)
└─ *ux-design (UX Designer, optional)

Phase 3: Solutioning (Required for >10 stories)
└─ *architecture (Architect)
└─ *create-epics-and-stories (Scrum Master)
└─ *implementation-readiness (optional)

Phase 4: Implementation (Required)
└─ *sprint-planning (Scrum Master)
   └─ For each story:
      └─ *dev-story [id] (Developer)
      └─ *test-story [id] (Test Architect)
      └─ *code-review (Developer)
      └─ Mark story complete
└─ Repeat sprints until done
```

### Quick Flow Track (Simplified)

```
1. *quick-spec (Barry)
2. *quick-dev (Barry)
3. Deploy
```

## Common Patterns

### Pattern 1: New Feature (BMad Method)

```bash
# 1. Initialize (if first time)
Load: Analyst
Run: *workflow-init
Select: BMad Method track

# 2. Create PRD
Load: PM (fresh chat)
Run: *prd
Output: docs/business/prd-[feature].md

# 3. Design Architecture
Load: Architect (fresh chat)
Provide: PRD document
Run: *architecture
Output: docs/architecture/arch-[feature].md

# 4. Create Stories
Load: Scrum Master (fresh chat)
Provide: Architecture document
Run: *create-epics-and-stories
Output: docs/business/epics-[feature].md

# 5. Plan First Sprint
Load: Scrum Master (fresh chat)
Run: *sprint-planning
Output: docs/bmad-method/sprint-[n]-plan.md

# 6. Implement Stories (repeat for each)
Load: Developer (fresh chat per story)
Run: *dev-story [story-id]
Test: Run tests
Commit: Git commit with clear message

# 7. Sprint Review & Next Sprint
Load: Scrum Master
Review: Sprint outcomes
Run: *sprint-planning (for next sprint)
```

### Pattern 2: Bug Fix (Quick Flow)

```bash
# 1. Quick spec
Load: Barry
Describe: Bug details
Run: *quick-spec

# 2. Implement
Run: *quick-dev
Test: Verify fix
Commit: Git commit

# 3. Deploy
Follow standard deployment process
```

### Pattern 3: Refactoring

```bash
# 1. Architecture Review
Load: Architect
Describe: Current issues
Run: *architecture-review

# 2. Refactoring Plan
Architect: Proposes refactoring approach
Document: Create ADR if significant

# 3. Break into Stories
Load: Scrum Master
Run: *create-epics-and-stories

# 4. Implement
Follow standard story implementation
```

## File Locations

### BMAD Installation
```
_bmad/
├── modules/
│   ├── bmm/              # BMad Method module
│   │   ├── agents/       # All agents
│   │   └── workflows/    # All workflows
│   └── cis/              # Creative Intelligence Suite
├── config/               # Project configuration
└── .bmadrc               # BMAD settings
```

### Documentation Output
```
docs/
├── bmad-method/
│   ├── bmm-workflow-status.yaml    # Status tracking
│   ├── sprint-[n]-plan.md          # Sprint plans
│   └── current-sprint.md           # Active sprint
├── business/
│   ├── prd-[feature].md            # PRDs
│   └── technical-specifications/   # Tech specs
└── architecture/
    ├── arch-[feature].md           # Architecture docs
    └── adr/                        # Decision records
```

## Chat SDK Specific

### Tech Stack Context
When working with agents, mention:
- Next.js 16 (App Router)
- TypeScript strict mode
- Ultracite linter (Biome)
- Vercel AI SDK
- Drizzle ORM + Neon PostgreSQL
- Playwright tests

### Code Standards
- Follow Ultracite rules (no enums, `import type`, semantic HTML)
- Use Server Actions for mutations
- Streaming for AI responses
- Message parts array structure
- One story at a time

### Testing Requirements
- Playwright for e2e tests
- Follow `tests/` structure
- Use existing fixtures
- Mock models in tests
- Target >80% coverage

### File Organization
```
app/              # Next.js routes
components/       # React components
lib/              # Core logic
├── ai/           # AI providers, tools
├── db/           # Database queries
└── errors.ts     # Error handling
artifacts/        # Artifact renderers
hooks/            # Custom hooks
tests/            # Test suites
```

## Git Workflow

### Branch Naming
```
feature/[feature-name]     # New features
bugfix/[bug-description]   # Bug fixes
refactor/[area]            # Refactoring
```

### Commit Messages
```
feat: add code search functionality
fix: resolve search index race condition
docs: update architecture for search
test: add e2e tests for search
refactor: extract search logic to service
```

### Story-Based Commits
```
feat(US-101): implement search index service
test(US-101): add unit tests for indexer
docs(US-101): document search API
```

## Troubleshooting

### Issue: Agent confused or off-track
**Solution**: 
- Start fresh chat
- Clearly state workflow command
- Provide required context documents

### Issue: Can't find workflow status
**Check**:
```bash
cat docs/bmad-method/bmm-workflow-status.yaml
```

### Issue: Architecture not generated
**Verify**:
- PRD completed first
- Using BMad Method or Enterprise track
- Architect agent loaded correctly

### Issue: Stories too large
**Solution**:
- Load Scrum Master
- Ask to break down further
- Target 1-2 days per story

## Best Practices

### Do's ✅
- **Fresh chat per workflow** - Prevents context contamination
- **One story at a time** - Maintains focus and quality
- **Review before accepting** - Validate agent outputs
- **Update status regularly** - Keep tracking current
- **Follow phase sequence** - Don't skip required steps
- **Document decisions** - Use ADRs for architecture
- **Test before complete** - Never skip testing

### Don'ts ❌
- **Multiple workflows in one chat** - Causes confusion
- **Parallel story work** - Increases errors
- **Skip architecture** - For complex features
- **Ignore agent warnings** - Usually valid concerns
- **Rush through planning** - Saves time later

## Keyboard Shortcuts (IDE-dependent)

### Cursor/Windsurf
```
Cmd/Ctrl + K      # Open AI chat
Cmd/Ctrl + L      # Open composer
Cmd/Ctrl + I      # Inline edit
```

### Claude Code
```
Select agent from menu or @mention
```

## Quick Wins

### First Day
1. Run `*workflow-init` on test project
2. Create simple `*prd` for small feature
3. Try `*quick-dev` for bug fix

### First Week
1. Complete one feature with BMad Method track
2. Try 3+ different agents
3. Customize one agent for project needs

### First Month
1. Master all phase workflows
2. Lead sprint planning
3. Create custom workflows

## Cheat Sheet

Print or bookmark this:

```
┌─────────────────────────────────────┐
│       BMAD Quick Commands           │
├─────────────────────────────────────┤
│ *workflow-status  │ Check status    │
│ *prd             │ Create PRD       │
│ *architecture    │ Design arch      │
│ *sprint-planning │ Plan sprint      │
│ *dev-story [id]  │ Implement story  │
│ *test-story [id] │ Create tests     │
│ *code-review     │ Review code      │
│ *quick-dev       │ Quick fix        │
├─────────────────────────────────────┤
│         Key Principles              │
├─────────────────────────────────────┤
│ ✓ Fresh chat per workflow           │
│ ✓ One story at a time               │
│ ✓ Follow phase sequence             │
│ ✓ Test before marking complete      │
│ ✓ Document architecture decisions   │
└─────────────────────────────────────┘
```

## Learning Resources

### Documentation
- [BMAD Method Overview](./overview.md)
- [Integration Guide](./integration-guide.md)
- [Agent Guide](./agent-guide.md)
- [Workflow Guide](./workflow-guide.md)

### External
- [Official BMAD Docs](https://github.com/bmad-code-org/BMAD-METHOD)
- [Video Tutorials](https://www.youtube.com/@BMadCode)
- [Discord Community](https://discord.gg/gk8jAdXWmj)

## Next Steps

1. **Practice**: Try workflows on real task
2. **Customize**: Add project-specific patterns
3. **Share**: Help team learn BMAD
4. **Improve**: Suggest documentation updates

---

**Keep this page bookmarked for quick reference during development!**

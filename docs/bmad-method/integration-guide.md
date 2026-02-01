# BMAD Method Integration Guide

This guide walks you through installing and integrating the BMAD Method into the Chat SDK project.

## Prerequisites

- Node.js >= 20.0.0
- npm or pnpm package manager
- IDE with AI assistant support (Claude Code, Cursor, Windsurf, or VS Code)
- Chat SDK project cloned locally

## Installation Steps

### Step 1: Install BMAD Method

Run the BMAD installer from your project root:

```bash
cd /home/runner/work/chatbot/chatbot
npx bmad-method@alpha install
```

The interactive installer will:
1. Detect your project structure
2. Ask configuration questions
3. Create a `_bmad/` directory with all agents and workflows
4. Set up project-specific configuration

### Step 2: Configuration Options

During installation, you'll be prompted for:

#### Installation Location
- **Recommended**: `_bmad/` (default)
- **Alternative**: `.bmad/`, `bmad/`, or custom path

#### Modules to Install
- ✅ **BMad Method (BMM)** - Core agile development (REQUIRED)
- ✅ **Creative Intelligence Suite (CIS)** - Brainstorming and innovation (RECOMMENDED)
- ⬜ **BMad Builder (BMB)** - Create custom agents (OPTIONAL)

**For Chat SDK**: Install BMM + CIS

#### Language Settings
- **Communication Language**: English (default)
- **Code Documentation Language**: English (default)
- **Code Output Language**: Match project standards

#### Customization Options
- **Agent Personalities**: Default (can customize later)
- **Workflow Paths**: Standard structure
- **Document Location**: `docs/` (aligns with our structure)

### Step 3: Verify Installation

Check that BMAD installed correctly:

```bash
# Verify _bmad directory exists
ls -la _bmad/

# Expected structure:
# _bmad/
# ├── modules/
# │   ├── bmm/          # BMad Method module
# │   │   ├── agents/   # 12+ specialized agents
# │   │   └── workflows/ # 34+ development workflows
# │   └── cis/          # Creative Intelligence Suite
# ├── config/           # Project configuration
# └── .bmadrc           # BMAD configuration file
```

### Step 4: Initialize Your Project

Load the Analyst agent in your IDE and run the initialization workflow:

1. **Open your IDE** (Cursor, Claude Code, Windsurf, or VS Code)

2. **Load the Analyst agent**:
   - **Cursor/Windsurf**: `.cursor/` → Select agent file → Add to chat
   - **Claude Code**: Use agent menu or `@analyst` mention
   - **VS Code**: Copy agent content to chat

3. **Run initialization**:
   ```
   *workflow-init
   ```

4. **Answer workflow questions**:
   - Project name: "Chat SDK"
   - Project type: "Existing codebase" or "New feature"
   - Complexity level: "Medium to High"
   - Estimated scope: "20-50 stories"

5. **Select planning track**:
   - **Choose**: "BMad Method" (recommended for Chat SDK)
   - **Why**: Complex product with multiple integrated features

### Step 5: Configure Project Status Tracking

The initialization creates `docs/bmad-method/bmm-workflow-status.yaml`:

```yaml
project:
  name: "Chat SDK"
  track: "bmad-method"
  created: "2025-12-16"
  
phase1_analysis:
  status: "optional"
  workflows: []
  
phase2_planning:
  status: "required"
  required_workflows:
    - prd
    - tech-spec
  completed: []
  
phase3_solutioning:
  status: "required"
  required_workflows:
    - architecture
    - create-epics-and-stories
  completed: []
  
phase4_implementation:
  status: "active"
  current_sprint: 1
  completed_stories: []
```

## IDE-Specific Setup

### Cursor / Windsurf

1. **Add BMAD agents to `.cursor/agents/`** (optional, for quick access):
   ```bash
   ln -s ../../_bmad/modules/bmm/agents/* .cursor/agents/
   ```

2. **Configure Cursor Rules** (`.cursor/rules/`):
   Create `bmad-integration.md`:
   ```markdown
   # BMAD Integration Rules
   
   When working on this project:
   1. Follow BMAD Method workflows for feature development
   2. Consult appropriate agent for each phase
   3. Maintain workflow status in docs/bmad-method/
   4. One story at a time discipline
   ```

### Claude Code

1. **Create agent shortcuts**:
   - Save frequently used agents as "Custom Instructions"
   - Use `@pm`, `@architect`, `@dev` shortcuts

2. **Set project context**:
   Add to Claude Project:
   ```
   This project follows the BMAD Method for development.
   Workflow status: docs/bmad-method/bmm-workflow-status.yaml
   ```

### VS Code

1. **Install GitHub Copilot** (if not already installed)

2. **Configure workspace settings** (`.vscode/settings.json`):
   ```json
   {
     "github.copilot.advanced": {
       "customInstructions": "Follow BMAD Method workflows defined in _bmad/"
     }
   }
   ```

## Workflow Integration with Existing Processes

### Align with Current Development

#### Existing Process
- Next.js 16 development with App Router
- TypeScript strict mode
- Ultracite linter (Biome-based)
- Playwright e2e tests
- Drizzle ORM migrations

#### BMAD Integration Points

1. **Planning Phase**: Use PM agent for PRDs
   - Creates: `docs/business/prd-[feature].md`
   - Aligned with: Product roadmap

2. **Architecture Phase**: Use Architect agent
   - Creates: `docs/architecture/arch-[feature].md`
   - Aligned with: ADR process

3. **Implementation Phase**: Use Developer agent
   - Follows: Existing coding standards
   - Uses: Ultracite linter rules
   - Creates: TypeScript with strict mode

4. **Testing Phase**: Use Test Architect agent
   - Creates: Playwright tests in `tests/`
   - Follows: Existing test patterns

### Git Workflow Integration

BMAD works with your existing Git workflow:

```bash
# Create feature branch as usual
git checkout -b feature/new-artifact-type

# Run BMAD workflows to plan feature
# (PM agent creates PRD, Architect creates design)

# Implement using Developer agent
# (Generates code following project patterns)

# Create PR as usual
git add .
git commit -m "feat: add new artifact type"
git push origin feature/new-artifact-type
```

### Documentation Integration

BMAD documents integrate with existing structure:

```
docs/
├── bmad-method/           # BMAD workflow tracking
│   ├── bmm-workflow-status.yaml
│   └── current-sprint.md
├── business/              # BMAD PM outputs
│   ├── prd-*.md
│   └── technical-specifications/
├── architecture/          # BMAD Architect outputs
│   ├── arch-*.md
│   └── adr/
└── development/           # BMAD process docs
    └── workflow.md
```

## Agent Usage Guidelines

### When to Use Which Agent

| Task | Agent | Workflow |
|------|-------|----------|
| Define feature requirements | PM | `*prd` |
| Design architecture | Architect | `*architecture` |
| Implement user story | Developer | `*dev-story` |
| Plan sprint | Scrum Master | `*sprint-planning` |
| Create tests | Test Architect | `*test-story` |
| Write documentation | Tech Writer | `*document` |

### Agent Best Practices

1. **Use Fresh Chats**: Start new chat for each workflow to avoid context limits
2. **One Agent at a Time**: Focus on single agent's expertise
3. **Follow Workflow Sequence**: Respect phase dependencies
4. **Validate Outputs**: Review agent recommendations before accepting
5. **Customize as Needed**: Agents are starting points, not rigid rules

## Customization

### Customize Agent Personalities

Edit agent files in `_bmad/modules/bmm/agents/`:

```bash
# Example: Customize PM agent
vi _bmad/modules/bmm/agents/pm/pm.md
```

Add project-specific instructions:
```markdown
## Chat SDK Specific Guidelines

When creating PRDs for Chat SDK:
- Consider streaming data patterns
- Address real-time UI updates
- Include accessibility requirements (Ultracite)
- Reference existing artifact patterns
```

### Add Custom Workflows

Create custom workflows in `_bmad/custom/workflows/`:

```bash
mkdir -p _bmad/custom/workflows/chat-sdk-deploy
```

Example custom workflow:
```markdown
# Deployment Workflow for Chat SDK

## Prerequisites
- Feature branch merged to main
- All tests passing
- Documentation updated

## Steps
1. Run production build
2. Verify environment variables
3. Deploy to Vercel
4. Run smoke tests
5. Monitor error rates
```

## Troubleshooting

### Issue: Agent not responding correctly

**Solution**: 
- Ensure using fresh chat window
- Verify correct agent loaded
- Check workflow prerequisites completed

### Issue: Workflow status not updating

**Solution**:
- Manually update `bmm-workflow-status.yaml`
- Verify file permissions
- Check file syntax (YAML)

### Issue: Conflicting recommendations

**Solution**:
- Consult BMad Master agent for complex decisions
- Review with team
- Document decision in ADR

### Issue: Installation fails

**Solution**:
- Ensure Node.js >= 20.0.0
- Clear npm cache: `npm cache clean --force`
- Try stable version: `npx bmad-method install`

## Verification Checklist

After installation, verify:

- [ ] `_bmad/` directory exists with modules
- [ ] `docs/bmad-method/bmm-workflow-status.yaml` created
- [ ] Can load agents in IDE
- [ ] `*workflow-status` command works
- [ ] Configuration matches project needs

## Next Steps

1. **Learn Agents**: Read [Agent Guide](./agent-guide.md)
2. **Run First Workflow**: Follow [Workflow Guide](./workflow-guide.md)
3. **Quick Reference**: Bookmark [Quick Reference](./quick-reference.md)
4. **Start Development**: Begin with current sprint story

## Support

- **Documentation**: [Complete BMAD Docs](https://github.com/bmad-code-org/BMAD-METHOD)
- **Community**: [Discord](https://discord.gg/gk8jAdXWmj)
- **Issues**: [GitHub Issues](https://github.com/bmad-code-org/BMAD-METHOD/issues)

---

**Next**: [Agent Guide](./agent-guide.md) - Learn to work with specialized AI agents

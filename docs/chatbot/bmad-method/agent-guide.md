# BMAD Method Agent Guide

This guide explains how to work with BMAD's specialized AI agents for optimal development workflow.

## Understanding BMAD Agents

BMAD agents are specialized AI assistants, each with:
- **Domain expertise** in specific development roles
- **Dedicated workflows** for their area of responsibility
- **Consistent personality** and communication style
- **Knowledge of best practices** in their domain

Think of them as expert team members you can consult at any time.

## Core Development Agents

### Product Manager (PM)

**Role**: Requirements definition, feature prioritization, stakeholder communication

**Primary Workflows**:
- `*prd` - Create Product Requirements Document
- `*refine-requirements` - Clarify and enhance requirements
- `*prioritize-backlog` - Prioritize features and stories

**When to Use**:
- Starting a new feature
- Defining acceptance criteria
- Clarifying product vision
- Resolving requirement conflicts

**Example Interaction**:
```
You: Load PM agent
PM: Ready to help with product requirements. What are we building?

You: *prd
PM: Let's create a comprehensive PRD. First, what's the feature name?

You: AI-powered code search in chat
PM: Excellent. Let me guide you through the PRD process...
```

**Best Practices**:
- Provide clear business context
- Include user personas when relevant
- Discuss constraints (technical, time, budget)
- Review PRD with stakeholders before architecture

### Solution Architect (Architect)

**Role**: System design, architecture decisions, technical strategy

**Primary Workflows**:
- `*architecture` - Design system architecture
- `*architecture-review` - Review existing architecture
- `*adr` - Create Architecture Decision Record

**When to Use**:
- Designing new features requiring architectural changes
- Making significant technical decisions
- Refactoring existing systems
- Evaluating technical approaches

**Example Interaction**:
```
You: Load Architect agent
Architect: Ready to design solutions. What are we architecting?

You: *architecture for AI code search feature
Architect: I'll need the PRD. Let me review... 
          [Reviews PRD]
          
          I recommend a three-tier approach:
          1. Search indexing service
          2. Query processing layer
          3. Results rendering component
          
          Let's detail each component...
```

**Best Practices**:
- Provide PRD or tech spec before starting
- Discuss existing system constraints
- Consider non-functional requirements (performance, security)
- Document decisions in ADRs

### Developer (DEV)

**Role**: Code implementation, technical execution, code quality

**Primary Workflows**:
- `*dev-story` - Implement user story
- `*refactor` - Refactor existing code
- `*debug` - Debug issues
- `*code-review` - Review code changes

**When to Use**:
- Implementing user stories
- Fixing bugs
- Refactoring code
- Writing new features

**Example Interaction**:
```
You: Load Developer agent
DEV: Ready to code. Which story are we implementing?

You: *dev-story US-101
DEV: [Reviews story details]
    
    Story: "As a user, I can search code in chat"
    
    I'll implement this in phases:
    1. Create search service
    2. Add UI components
    3. Integrate with chat
    4. Write tests
    
    Let's start with the search service...
```

**Best Practices**:
- Provide architecture document
- Follow existing code patterns (Ultracite rules)
- Write tests alongside code
- One story at a time
- Commit frequently with clear messages

### Test Architect (TEA)

**Role**: Testing strategy, test automation, quality assurance

**Primary Workflows**:
- `*test-strategy` - Define testing approach
- `*test-story` - Create tests for story
- `*test-automation` - Automate test suites
- `*test-review` - Review test coverage

**When to Use**:
- Defining test strategy for features
- Creating automated tests
- Reviewing test coverage
- Setting up CI/CD testing

**Example Interaction**:
```
You: Load Test Architect agent
TEA: Ready to ensure quality. What are we testing?

You: *test-story US-101
TEA: [Reviews story implementation]
    
    For code search, I'll create:
    1. Unit tests - search service logic
    2. Integration tests - API endpoints
    3. E2E tests - user search flow
    
    Using Playwright fixtures per project standards...
```

**Best Practices**:
- Test before marking story complete
- Follow existing test patterns (`tests/` structure)
- Use Playwright for e2e tests
- Aim for >80% coverage on new code

### Scrum Master (SM)

**Role**: Sprint planning, story management, workflow facilitation

**Primary Workflows**:
- `*sprint-planning` - Plan sprint
- `*create-story` - Create user story
- `*story-refinement` - Refine story details
- `*retrospective` - Sprint retrospective

**When to Use**:
- Planning next sprint
- Creating user stories from epics
- Refining story acceptance criteria
- Managing sprint progress

**Example Interaction**:
```
You: Load Scrum Master agent
SM: Ready to facilitate. What's our sprint focus?

You: *sprint-planning for sprint 5
SM: Let's plan sprint 5. Looking at our backlog...
    
    Available story points: 40
    Top priority epic: AI Code Search
    
    I recommend these stories:
    - US-101: Basic search (13 points)
    - US-102: Search filters (8 points)
    - US-103: Search UI (8 points)
    - US-104: Search tests (5 points)
    
    Total: 34 points. Buffer for unknowns.
```

**Best Practices**:
- Plan sprints based on velocity
- Keep stories small (1-2 days each)
- Define clear acceptance criteria
- Review sprint progress daily

### UX Designer (UX)

**Role**: User experience design, interaction design, usability

**Primary Workflows**:
- `*ux-design` - Create UX design
- `*user-flow` - Design user flows
- `*wireframe` - Create wireframes
- `*ux-review` - Review existing UX

**When to Use**:
- Designing new user interfaces
- Improving existing UX
- Creating user flows
- Evaluating usability

**Example Interaction**:
```
You: Load UX Designer agent
UX: Ready to design experiences. What feature needs UX?

You: *ux-design for code search
UX: Let's design an intuitive search experience.
    
    Key considerations:
    1. Search visibility - always accessible
    2. Results presentation - code highlighting
    3. Performance - real-time feedback
    
    I'll create wireframes for three views...
```

**Best Practices**:
- Consider accessibility (ARIA, semantic HTML)
- Follow shadcn/ui patterns
- Design mobile-first
- Include loading and error states

## Supporting Agents

### Business Analyst (Analyst)

**Role**: Requirements analysis, workflow initialization, research

**Primary Workflows**:
- `*workflow-init` - Initialize project
- `*requirements-analysis` - Analyze requirements
- `*research` - Research solutions

**When to Use**:
- Starting new projects
- Analyzing complex requirements
- Researching technical approaches

### Technical Writer (Tech Writer)

**Role**: Documentation, API docs, user guides

**Primary Workflows**:
- `*document` - Create documentation
- `*api-docs` - Document APIs
- `*user-guide` - Create user guides

**When to Use**:
- Documenting new features
- Creating API documentation
- Writing user guides
- Updating README files

### Barry (Quick Flow Solo Dev)

**Role**: Rapid solo development for small features

**Primary Workflows**:
- `*quick-spec` - Create minimal spec
- `*quick-dev` - Rapid development
- `*quick-deploy` - Fast deployment

**When to Use**:
- Bug fixes
- Small features (<5 stories)
- Prototypes
- Quick iterations

**Note**: Barry follows Quick Flow track, bypassing full planning

## Advanced Agents

### BMad Master

**Role**: Meta-agent for complex decisions, multi-agent coordination

**When to Use**:
- Conflicting agent recommendations
- Complex architectural decisions
- Multi-faceted problems
- Party mode facilitation

**Example**:
```
You: Load BMad Master agent
BMad Master: Orchestrating expertise. What complexity do we face?

You: PM wants feature X, but Architect says it's too complex
BMad Master: Let me facilitate this decision...
             
             [Analyzes both perspectives]
             
             Recommended compromise:
             - Phase 1: Simplified version (2 weeks)
             - Phase 2: Full complexity (4 weeks)
             - Allows early feedback while managing risk
```

## Agent Collaboration Patterns

### Pattern 1: Feature Development Flow

```
1. PM → Creates PRD
2. Architect → Designs architecture
3. SM → Creates user stories
4. UX → Designs interface
5. DEV → Implements stories
6. TEA → Creates tests
7. Tech Writer → Documents feature
```

### Pattern 2: Bug Fix Flow

```
1. Barry (Quick Flow) → Analyzes bug
2. Barry → Implements fix
3. Barry → Writes test
4. DEV → Reviews code
```

### Pattern 3: Refactoring Flow

```
1. Architect → Reviews current architecture
2. Architect → Proposes refactoring plan
3. SM → Breaks into stories
4. DEV → Implements refactoring
5. TEA → Validates no regression
```

## Party Mode

**Party Mode** allows multiple agents to collaborate in real-time:

```
You: Start party mode with PM, Architect, and DEV
BMad Master: Coordinating party of 3 agents...

[All three agents discuss feature simultaneously]
PM: From product perspective, users need...
Architect: Technically, we could implement...
DEV: I see potential issues with...

BMad Master: Synthesizing recommendations...
```

**When to Use Party Mode**:
- Strategic decisions
- Complex features
- Cross-functional issues
- Architectural debates

**Best Practices**:
- Limit to 3-5 agents
- Have clear question/goal
- BMad Master facilitates
- Document consensus

## Agent Customization

### Customize for Chat SDK

Edit agent files to add project-specific context:

**Example: Customize DEV agent**

File: `_bmad/modules/bmm/agents/dev/dev.md`

Add section:
```markdown
## Chat SDK Specific Guidelines

### Code Standards
- Follow Ultracite (Biome) linter rules
- TypeScript strict mode required
- Use `import type` for types
- Semantic HTML for accessibility

### Patterns to Follow
- Server Actions for mutations
- Streaming for AI responses
- Message parts array structure
- Artifact pattern for UI generation

### Testing Requirements
- Playwright for e2e tests
- Follow existing test fixtures
- Mock models in test environment
```

## Quick Reference

| Task | Agent | Command |
|------|-------|---------|
| Check status | Any | `*workflow-status` |
| Create PRD | PM | `*prd` |
| Design architecture | Architect | `*architecture` |
| Plan sprint | SM | `*sprint-planning` |
| Implement story | DEV | `*dev-story` |
| Create tests | TEA | `*test-story` |
| Write docs | Tech Writer | `*document` |
| Quick fix | Barry | `*quick-dev` |

## Common Pitfalls

### ❌ Don't

- Use multiple agents in same chat (causes confusion)
- Skip required workflows (breaks process)
- Ignore agent recommendations without reason
- Implement without architecture (for complex features)

### ✅ Do

- Use fresh chat for each workflow
- Follow phase sequence
- Document decisions
- Validate agent outputs
- Customize agents for your project

## Tips for Success

1. **Start Simple**: Use Quick Flow for first feature to learn
2. **Read Agent Intros**: Each agent explains their role when loaded
3. **Ask Questions**: Agents can explain their reasoning
4. **Iterate**: Don't expect perfect output first time
5. **Customize**: Adapt agents to your team's style

## Next Steps

1. **Practice**: Load PM agent and run `*prd` for a small feature
2. **Explore**: Try different agents for their specialized workflows
3. **Customize**: Add project-specific guidelines to agents
4. **Master Workflows**: Read [Workflow Guide](./workflow-guide.md)

## Resources

- [Complete Agents Guide](https://github.com/bmad-code-org/BMAD-METHOD/blob/main/src/modules/bmm/docs/agents-guide.md)
- [Party Mode Guide](https://github.com/bmad-code-org/BMAD-METHOD/blob/main/src/modules/bmm/docs/party-mode.md)
- [Agent Customization](https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/agent-customization-guide.md)

---

**Next**: [Workflow Guide](./workflow-guide.md) - Master BMAD workflows for Chat SDK

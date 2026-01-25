# BMAD Method Workflow Guide

Complete guide to running BMAD workflows for Chat SDK development.

## Understanding Workflows

**Workflows** are structured processes that guide you through specific development tasks. Each workflow:
- Has a clear purpose and outcome
- Involves specific agent(s)
- Follows a defined sequence
- Produces documented artifacts

## Workflow Execution Basics

### Starting a Workflow

1. **Load the appropriate agent** in a fresh chat
2. **Type the workflow command**: `*workflow-name`
3. **Follow agent prompts** to provide required information
4. **Review and validate** the workflow output
5. **Update workflow status** in `bmm-workflow-status.yaml`

### Workflow Commands

All workflow commands start with `*`:
```
*workflow-init       # Initialize project
*prd                # Create PRD
*architecture       # Design architecture
*sprint-planning    # Plan sprint
*dev-story          # Implement story
```

## Phase-by-Phase Workflows

## Phase 1: Analysis (Optional)

Analysis workflows help explore problem space and research solutions.

### *workflow-init

**Agent**: Analyst  
**Purpose**: Initialize project and select planning track  
**When**: Starting any new project or major initiative

**Steps**:
1. Load Analyst agent in fresh chat
2. Run `*workflow-init`
3. Answer questions about project
4. Select planning track (Quick Flow, BMad Method, or Enterprise)
5. Review generated `bmm-workflow-status.yaml`

**Output**:
- `docs/bmad-method/bmm-workflow-status.yaml`
- Track selection and phase plan

**Example**:
```
You: *workflow-init

Analyst: Let's initialize your project. First, tell me about what you're building.

You: Adding AI-powered code search to our chatbot

Analyst: Great! A few questions:
         1. Is this a new codebase or existing?
         2. How complex is this feature?
         3. Estimated number of user stories?

[Interactive Q&A continues...]

Analyst: Based on your answers, I recommend the BMad Method track.
         This gives you comprehensive planning without enterprise overhead.
         
         Shall I create the workflow status file?
```

### *brainstorm-project (Optional)

**Agent**: Analyst or Creative facilitator (CIS module)  
**Purpose**: Explore ideas and approaches  
**When**: Unclear requirements or innovative solutions needed

**Steps**:
1. Define problem statement
2. Brainstorm approaches
3. Evaluate options
4. Document top ideas

**Output**: `docs/business/brainstorm-[date].md`

### *research (Optional)

**Agent**: Analyst  
**Purpose**: Research technical approaches or market solutions  
**When**: Unfamiliar domain or technology

**Output**: `docs/business/research-[topic].md`

---

## Phase 2: Planning (Required)

Planning workflows create comprehensive requirements and specifications.

### *prd

**Agent**: PM  
**Purpose**: Create Product Requirements Document  
**When**: Starting any feature using BMad Method or Enterprise track  
**Required**: BMad Method and Enterprise tracks

**Steps**:
1. Load PM agent in fresh chat
2. Run `*prd`
3. Provide feature details:
   - Feature name and overview
   - User personas
   - User stories (high-level)
   - Success metrics
   - Constraints
4. Review generated PRD
5. Iterate if needed

**Output**: `docs/business/prd-[feature-name].md`

**Example PRD Structure**:
```markdown
# PRD: AI Code Search

## Overview
Enable users to search through code in chat conversations.

## User Personas
- **Developer**: Needs to find specific code patterns quickly
- **PM**: Wants to reference code in discussions

## User Stories
1. As a developer, I can search code by keyword
2. As a developer, I can filter by language
3. As a developer, I can see syntax-highlighted results

## Success Metrics
- 80% of searches return relevant results
- <500ms search response time
- 70% user adoption rate

## Constraints
- Must work with existing artifact system
- Needs to support multiple languages
- Performance budget: 2MB bundle increase max
```

**Best Practices**:
- Be specific about user needs
- Include measurable success criteria
- Document constraints upfront
- Review with stakeholders before architecture

### *tech-spec

**Agent**: PM or Architect  
**Purpose**: Create technical specification  
**When**: Quick Flow track OR as supplement to PRD  
**Required**: Quick Flow track (replaces PRD)

**Steps**:
1. Load PM agent
2. Run `*tech-spec`
3. Provide technical details:
   - Technical requirements
   - API specifications
   - Data models
   - Integration points
4. Review and refine

**Output**: `docs/business/technical-specifications/tech-spec-[feature].md`

**Quick Flow vs BMad Method**:
- **Quick Flow**: Tech spec replaces PRD (faster, less formal)
- **BMad Method**: Tech spec supplements PRD (more comprehensive)

### *ux (Optional but Recommended)

**Agent**: UX Designer  
**Purpose**: Design user experience  
**When**: Features with significant UI changes

**Steps**:
1. Provide PRD to UX agent
2. Run `*ux-design`
3. Discuss user flows
4. Review wireframes/mockups
5. Define interaction patterns

**Output**: `docs/business/ux-design-[feature].md`

---

## Phase 3: Solutioning (Track-dependent)

Solutioning workflows design architecture and break work into stories.

### *architecture

**Agent**: Architect  
**Purpose**: Design system architecture  
**When**: Any feature requiring new components or significant changes  
**Required**: BMad Method and Enterprise tracks (>10 stories)

**Steps**:
1. Load Architect agent in fresh chat
2. Provide PRD and tech spec
3. Run `*architecture`
4. Discuss architectural approaches
5. Review proposed design
6. Document architecture decisions
7. Create ADRs for key decisions

**Output**: 
- `docs/architecture/arch-[feature].md`
- `docs/architecture/adr/[decision-number]-[title].md`

**Example Architecture Document**:
```markdown
# Architecture: AI Code Search

## Overview
Three-tier search architecture integrating with existing chat system.

## Components

### 1. Search Index Service
- **Technology**: Lightweight in-memory index
- **Location**: `lib/search/indexer.ts`
- **Responsibility**: Index code from messages
- **Interface**: `searchIndex(query: string): SearchResult[]`

### 2. Search API
- **Technology**: Next.js Server Action
- **Location**: `app/(chat)/actions.ts`
- **Responsibility**: Handle search requests
- **Interface**: Server Action endpoint

### 3. Search UI Component
- **Technology**: React component
- **Location**: `components/search/code-search.tsx`
- **Responsibility**: Search interface and results
- **Integration**: Embedded in chat interface

## Data Flow
1. User types search query
2. UI calls search Server Action
3. Server Action queries index
4. Results streamed back to UI
5. UI renders highlighted results

## Non-Functional Requirements
- Performance: <500ms response time
- Scalability: Handle 10K+ code snippets
- Security: Rate limiting, input validation

## Architecture Decisions
See ADR-001: Choice of in-memory vs external search service
```

**Best Practices**:
- Review existing architecture first
- Consider integration points
- Document decisions (ADRs)
- Validate with technical lead
- Think about testing strategy

### *create-epics-and-stories

**Agent**: Scrum Master  
**Purpose**: Break architecture into implementable stories  
**When**: After architecture is defined  
**Required**: BMad Method and Enterprise tracks

**Steps**:
1. Load Scrum Master agent
2. Provide architecture document
3. Run `*create-epics-and-stories`
4. Review proposed epics
5. Refine story breakdown
6. Validate story independence
7. Estimate story points

**Output**: 
- `docs/business/epics-[feature].md`
- Individual story files or backlog entries

**Example Epic Breakdown**:
```markdown
# Epic: AI Code Search

## Epic 1: Search Infrastructure (21 points)
- US-101: Create search index service (8 pts)
- US-102: Implement search API (8 pts)
- US-103: Add search data models (5 pts)

## Epic 2: Search UI (13 points)
- US-104: Create search component (5 pts)
- US-105: Add results rendering (5 pts)
- US-106: Implement syntax highlighting (3 pts)

## Epic 3: Search Features (13 points)
- US-107: Add language filtering (5 pts)
- US-108: Implement search history (3 pts)
- US-109: Add keyboard shortcuts (5 pts)

## Epic 4: Testing & Polish (8 points)
- US-110: Write unit tests (3 pts)
- US-111: Create e2e tests (3 pts)
- US-112: Performance optimization (2 pts)

Total: 55 points (~3-4 sprints at 15-20 points/sprint)
```

**Best Practices**:
- Keep stories small (1-2 days each)
- Ensure stories are independent
- Include testing stories
- Order by dependencies
- Consider risks early

### *implementation-readiness (Optional)

**Agent**: BMad Master or SM  
**Purpose**: Verify ready for implementation  
**When**: Before starting Phase 4

**Output**: Readiness checklist and any gaps

---

## Phase 4: Implementation (Required)

Implementation workflows execute development sprint by sprint, story by story.

### *sprint-planning

**Agent**: Scrum Master  
**Purpose**: Plan next sprint  
**When**: Start of each sprint (every 1-2 weeks)

**Steps**:
1. Load Scrum Master agent
2. Review backlog
3. Run `*sprint-planning`
4. Select stories based on:
   - Priority
   - Dependencies
   - Team velocity
   - Story points
5. Define sprint goal
6. Commit to sprint backlog

**Output**: `docs/bmad-method/sprint-[number]-plan.md`

**Example Sprint Plan**:
```markdown
# Sprint 5 Plan

**Sprint Goal**: Complete core search functionality

**Duration**: Dec 16 - Dec 29 (2 weeks)

**Team Velocity**: 18 points/sprint (based on last 3 sprints)

**Committed Stories**:
- US-101: Create search index service (8 pts) - DEV: Alice
- US-102: Implement search API (8 pts) - DEV: Bob
- US-104: Create search component (5 pts) - DEV: Alice (day 6-10)

**Total**: 21 points (slightly above velocity, buffer included)

**Risks**:
- US-101 touches core message system (needs careful testing)
- US-102 requires API design review

**Daily Standup**: 9:30 AM via Slack
```

### *dev-story

**Agent**: Developer  
**Purpose**: Implement user story  
**When**: During sprint, one story at a time

**Steps**:
1. Load Developer agent in fresh chat
2. Provide story details (ID, description, acceptance criteria)
3. Run `*dev-story [story-id]`
4. Agent reviews:
   - Story requirements
   - Architecture document
   - Existing code patterns
5. Agent implements:
   - Creates/modifies code
   - Follows coding standards
   - Writes unit tests
   - Updates documentation
6. Review implementation
7. Run tests
8. Commit changes

**Output**: 
- Code changes
- Tests
- Documentation updates

**Example**:
```
You: *dev-story US-101

DEV: Implementing US-101: Create search index service
     
     [Reviews architecture document]
     
     I'll create the search index service per the architecture:
     
     1. File: lib/search/indexer.ts
     2. Implement SearchIndex class
     3. Methods: index(), search(), clear()
     4. Tests: lib/search/__tests__/indexer.test.ts
     
     Let's start with the core IndexSearch class...
     
     [Generates code following Ultracite rules]
```

**Best Practices**:
- One story at a time (never parallel)
- Review acceptance criteria before starting
- Follow existing patterns
- Write tests alongside code
- Commit frequently with clear messages
- Don't mark complete until tested

### *code-review

**Agent**: Developer (different from implementer) or Architect  
**Purpose**: Review implemented story  
**When**: After story implementation, before marking complete

**Steps**:
1. Load Developer agent (fresh chat)
2. Provide PR/branch details
3. Run `*code-review`
4. Agent reviews:
   - Code quality
   - Test coverage
   - Adherence to patterns
   - Performance considerations
5. Address feedback
6. Approve or request changes

**Output**: Code review comments and approval

### *test-story

**Agent**: Test Architect  
**Purpose**: Create comprehensive tests for story  
**When**: After story implementation or as separate story

**Steps**:
1. Load Test Architect agent
2. Provide story details
3. Run `*test-story [story-id]`
4. Agent creates:
   - Unit tests
   - Integration tests
   - E2E tests (if applicable)
5. Review test coverage
6. Run test suite
7. Fix any failures

**Output**: 
- `tests/unit/[feature].test.ts`
- `tests/e2e/[feature].spec.ts`

**Test Coverage Goals**:
- Unit tests: >80% coverage
- Integration tests: All API endpoints
- E2E tests: Critical user paths

---

## Quick Flow Workflows

For bug fixes and small features (<5 stories), use Quick Flow track:

### *quick-spec

**Agent**: Barry (Quick Flow Solo Dev)  
**Purpose**: Create minimal specification  
**When**: Quick Flow track

**Steps**:
1. Load Barry agent
2. Describe bug/feature
3. Run `*quick-spec`
4. Review minimal spec
5. Proceed to implementation

**Output**: Lightweight spec (inline or small doc)

### *quick-dev

**Agent**: Barry  
**Purpose**: Rapid implementation  
**When**: Quick Flow track

**Steps**:
1. Provide spec
2. Run `*quick-dev`
3. Barry implements, tests, and documents in one go
4. Review and deploy

**Output**: Complete implementation

---

## Workflow Status Tracking

### Checking Status

Any agent can check workflow status:
```
You: *workflow-status

Agent: Reviewing bmm-workflow-status.yaml...

       Project: Chat SDK
       Track: BMad Method
       Current Phase: Implementation
       
       Phase 2 (Planning): ✅ Complete
       - prd: ✅ docs/business/prd-code-search.md
       - tech-spec: ✅ docs/business/technical-specifications/tech-spec-code-search.md
       
       Phase 3 (Solutioning): ✅ Complete
       - architecture: ✅ docs/architecture/arch-code-search.md
       - create-epics-and-stories: ✅ docs/business/epics-code-search.md
       
       Phase 4 (Implementation): 🔄 In Progress
       - Sprint 5 (active): 3/5 stories complete
       - Current story: US-102 (in progress)
       - Next up: US-104
       
       Recommended action: Complete US-102, then run *dev-story US-104
```

### Updating Status

Update `docs/bmad-method/bmm-workflow-status.yaml` after each workflow:

```yaml
phase4_implementation:
  status: "active"
  current_sprint: 5
  sprint_goal: "Complete core search functionality"
  stories:
    - id: "US-101"
      title: "Create search index service"
      status: "complete"
      completed_date: "2025-12-18"
    - id: "US-102"
      title: "Implement search API"
      status: "in_progress"
      started_date: "2025-12-19"
    - id: "US-104"
      title: "Create search component"
      status: "planned"
```

## Workflow Tips

### Do's
- ✅ Use fresh chat for each workflow
- ✅ Provide required context (PRDs, architecture docs)
- ✅ Review agent outputs before proceeding
- ✅ Update workflow status regularly
- ✅ Follow phase sequence

### Don'ts
- ❌ Mix multiple workflows in one chat
- ❌ Skip required workflows
- ❌ Work on multiple stories simultaneously
- ❌ Ignore architecture for complex features
- ❌ Skip testing

## Troubleshooting Workflows

### Workflow Stuck

**Symptoms**: Agent not responding correctly, confused state

**Solutions**:
1. Start fresh chat
2. Verify correct agent loaded
3. Provide missing context
4. Check prerequisites completed

### Output Quality Low

**Symptoms**: Generic responses, missing details

**Solutions**:
1. Provide more specific context
2. Reference previous documents
3. Ask agent to elaborate
4. Iterate with feedback

### Conflicting Recommendations

**Symptoms**: Different agents suggest different approaches

**Solutions**:
1. Load BMad Master agent
2. Present both perspectives
3. Facilitate decision
4. Document in ADR

## Next Steps

1. **Practice**: Run `*workflow-init` on a test feature
2. **Reference**: Bookmark [Quick Reference](./quick-reference.md)
3. **Customize**: Adapt workflows to team needs
4. **Master**: Use workflows for every feature

## Resources

- [Workflow Documentation (Official)](https://github.com/bmad-code-org/BMAD-METHOD/tree/main/src/modules/bmm/docs)
- [Quick Start Guide](https://github.com/bmad-code-org/BMAD-METHOD/blob/main/src/modules/bmm/docs/quick-start.md)
- [Video Tutorials](https://www.youtube.com/@BMadCode)

---

**Next**: [Quick Reference](./quick-reference.md) - Commands and shortcuts for daily use

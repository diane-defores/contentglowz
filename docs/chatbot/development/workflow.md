# Development Workflow

This document describes our complete development workflow using the BMAD Method.

## Overview

We follow the BMAD Method for all feature development, which provides:
- **Structured workflows** for each development phase
- **Specialized AI agents** for different roles (PM, Architect, Developer, etc.)
- **Scale-adaptive planning** based on feature complexity
- **Consistent documentation** throughout the lifecycle

## Workflow Tracks

We use three tracks based on feature complexity:

### Quick Flow Track
**Use for**: Bug fixes, small enhancements, minor features

**Characteristics**:
- 1-5 stories
- Clear, limited scope
- Minimal architecture changes
- Fast turnaround (<1 week)

**Process**:
```
1. *quick-spec (Barry agent)
2. *quick-dev (Barry agent)
3. Test and deploy
```

### BMad Method Track (Default)
**Use for**: Standard features, new capabilities, product development

**Characteristics**:
- 10-50 stories
- Requires architecture planning
- Multiple sprints
- Complete documentation

**Process**:
```
1. Planning: *prd (PM agent)
2. Architecture: *architecture (Architect agent)
3. Stories: *create-epics-and-stories (SM agent)
4. Sprints: *sprint-planning → *dev-story per story
```

### Enterprise Method Track
**Use for**: Complex systems, compliance features, enterprise scale

**Characteristics**:
- 30+ stories
- Extensive planning and governance
- Security and compliance requirements
- Multi-team coordination

**Process**:
```
Same as BMad Method + additional governance:
- Security review
- Compliance check
- Performance validation
- Multi-stakeholder approval
```

## Development Phases

### Phase 1: Planning (Required)

**Goal**: Define what we're building and why

**Activities**:
1. **Product Requirements**
   - Load PM agent (fresh chat)
   - Run `*prd`
   - Define user stories, success metrics, constraints
   - Output: `docs/business/prd-[feature].md`

2. **Technical Specification** (if needed)
   - Load PM or Architect agent
   - Run `*tech-spec`
   - Define technical requirements, APIs, data models
   - Output: `docs/business/technical-specifications/tech-spec-[feature].md`

3. **UX Design** (if UI-heavy)
   - Load UX Designer agent
   - Run `*ux-design`
   - Create wireframes, user flows
   - Output: `docs/business/ux-design-[feature].md`

**Deliverables**:
- ✅ PRD approved by stakeholders
- ✅ Technical spec reviewed by architects
- ✅ UX design (if applicable)

### Phase 2: Architecture (For BMad Method track)

**Goal**: Design the technical solution

**Activities**:
1. **Architecture Design**
   - Load Architect agent (fresh chat)
   - Provide PRD and tech spec
   - Run `*architecture`
   - Design components, data flows, integrations
   - Output: `docs/architecture/arch-[feature].md`

2. **Architecture Decision Records**
   - For each significant decision
   - Run `*adr [decision]`
   - Document rationale and alternatives
   - Output: `docs/architecture/adr/[number]-[title].md`

3. **Technical Review**
   - Present architecture to technical team
   - Gather feedback
   - Update architecture document

**Deliverables**:
- ✅ Architecture document complete
- ✅ ADRs for key decisions
- ✅ Technical team approval

### Phase 3: Story Breakdown

**Goal**: Break work into implementable user stories

**Activities**:
1. **Epic and Story Creation**
   - Load Scrum Master agent (fresh chat)
   - Provide architecture document
   - Run `*create-epics-and-stories`
   - Create epics and user stories
   - Output: `docs/business/epics-[feature].md`

2. **Story Refinement**
   - Review each story
   - Add acceptance criteria
   - Estimate story points
   - Identify dependencies

3. **Backlog Prioritization**
   - Order stories by value and dependencies
   - Mark any blockers
   - Prepare for sprint planning

**Deliverables**:
- ✅ All stories created and estimated
- ✅ Dependencies identified
- ✅ Backlog prioritized

### Phase 4: Sprint Planning

**Goal**: Select stories for next sprint

**Activities**:
1. **Sprint Planning Meeting**
   - Load Scrum Master agent
   - Review team velocity (typically 15-20 points)
   - Run `*sprint-planning`
   - Select stories for sprint
   - Define sprint goal

2. **Sprint Commitment**
   - Team reviews selected stories
   - Confirms understanding and capacity
   - Commits to sprint goal

3. **Task Assignment**
   - Assign stories to developers
   - Identify any needed pair programming
   - Schedule daily standups

**Deliverables**:
- ✅ Sprint plan created: `docs/bmad-method/sprint-[n]-plan.md`
- ✅ Stories assigned
- ✅ Team committed

### Phase 5: Implementation

**Goal**: Build the feature, story by story

**Story Implementation Workflow**:

```
1. Select Next Story
   └─ From sprint plan
   └─ Ensure no blockers
   └─ Review acceptance criteria

2. Create Feature Branch
   └─ git checkout -b feature/[story-id]-[description]

3. Implement with Developer Agent
   └─ Load Developer agent (fresh chat)
   └─ Run *dev-story [story-id]
   └─ Provide story details and architecture
   └─ Agent implements following patterns

4. Write Tests
   └─ Unit tests for new functions
   └─ Integration tests for APIs
   └─ E2E tests for user flows
   └─ Aim for >80% coverage

5. Verify Quality
   └─ pnpm lint (Ultracite check)
   └─ pnpm test (all tests pass)
   └─ pnpm build (builds successfully)
   └─ Manual testing of feature

6. Commit Changes
   └─ git add .
   └─ git commit -m "feat([story-id]): [description]"
   └─ Follow conventional commits

7. Code Review
   └─ Push branch to GitHub
   └─ Create Pull Request
   └─ Request review from team
   └─ Address feedback

8. Merge and Deploy
   └─ Merge to main
   └─ Deploy to staging
   └─ Smoke test
   └─ Deploy to production

9. Mark Story Complete
   └─ Update workflow status
   └─ Demo to team
   └─ Close story in tracker
```

**Daily Activities**:
- **Morning Standup** (15 min)
  - What did I do yesterday?
  - What will I do today?
  - Any blockers?

- **Development** (6-7 hours)
  - Implement 1-2 stories
  - Write tests
  - Code reviews

- **End of Day**
  - Commit work in progress
  - Update status
  - Prepare for tomorrow

**Deliverables per Story**:
- ✅ Code implemented
- ✅ Tests written and passing
- ✅ Code reviewed and approved
- ✅ Documentation updated
- ✅ Story marked complete

### Phase 6: Sprint Review & Retrospective

**Goal**: Review progress and improve process

**Sprint Review**:
1. Demo completed stories
2. Gather feedback from stakeholders
3. Update product backlog
4. Celebrate wins

**Sprint Retrospective**:
1. What went well?
2. What could be improved?
3. Action items for next sprint
4. Update process documentation

**Deliverables**:
- ✅ Sprint review completed
- ✅ Retrospective notes: `docs/bmad-method/retrospectives/sprint-[n].md`
- ✅ Process improvements identified

## Git Workflow

### Branch Strategy

```
main (protected)
  ├─ feature/[story-id]-[description]
  ├─ bugfix/[issue-id]-[description]
  └─ hotfix/[critical-issue]
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat([story-id]): add code search functionality
fix([story-id]): resolve search index race condition
docs([story-id]): update architecture for search
test([story-id]): add e2e tests for search
refactor: extract search logic to service
```

### Pull Request Process

1. **Create PR**
   - Clear title with story ID
   - Description linking to PRD/architecture
   - Screenshots for UI changes
   - Link related issues

2. **Review Checklist**
   - Code follows patterns
   - Tests pass
   - Linter passes
   - Documentation updated
   - No security issues

3. **Approval**
   - At least 1 approval required
   - All comments addressed
   - CI checks pass

4. **Merge**
   - Squash and merge (preferred)
   - Delete feature branch
   - Deploy to staging

## Quality Gates

### Before Committing
- [ ] Code follows Ultracite rules
- [ ] TypeScript compiles without errors
- [ ] Tests pass locally
- [ ] No console.log statements
- [ ] Code self-documents or has comments

### Before PR
- [ ] All acceptance criteria met
- [ ] Test coverage >80% for new code
- [ ] Documentation updated
- [ ] No security vulnerabilities
- [ ] Performance acceptable

### Before Merging
- [ ] Code review approved
- [ ] CI/CD pipeline passes
- [ ] No merge conflicts
- [ ] Story marked complete in tracker

### Before Deploying
- [ ] Staging tests pass
- [ ] Smoke tests complete
- [ ] Performance verified
- [ ] Rollback plan ready

## Tools and Commands

### Development
```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run Ultracite linter
pnpm format       # Auto-fix formatting
pnpm test         # Run Playwright tests
```

### Database
```bash
pnpm db:generate  # Generate Drizzle types
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Drizzle Studio
pnpm db:push      # Push schema to database
```

### BMAD Workflows
```bash
# Load appropriate agent in IDE, then:
*workflow-status  # Check current status
*prd             # Create PRD
*architecture    # Design architecture
*sprint-planning # Plan sprint
*dev-story [id]  # Implement story
```

## Best Practices

### DO ✅
- Use fresh chat for each BMAD workflow
- One story at a time (never parallel)
- Write tests alongside code
- Commit frequently with clear messages
- Update documentation as you go
- Ask for help when blocked
- Celebrate completed stories

### DON'T ❌
- Skip planning for complex features
- Work on multiple stories simultaneously
- Commit without testing
- Push broken code
- Ignore linter warnings
- Skip code review
- Forget to update workflow status

## Troubleshooting

### Issue: Build fails
**Check**:
- TypeScript errors: `pnpm build`
- Linter errors: `pnpm lint`
- Missing dependencies: `pnpm install`

### Issue: Tests fail
**Check**:
- Test output for specific failures
- Database migrations applied
- Environment variables set
- Mock data correct

### Issue: BMAD agent confused
**Solution**:
- Start fresh chat
- Provide complete context (PRD, architecture)
- Be specific in requests
- Reference existing patterns

### Issue: Story blocked
**Actions**:
1. Identify blocker clearly
2. Communicate to team
3. Work on different story if possible
4. Escalate if critical

## Metrics

We track these metrics to improve:

### Velocity
- Story points per sprint
- Trend over time
- Capacity planning

### Quality
- Bug rate per release
- Test coverage %
- Code review cycle time

### Efficiency
- Story completion rate
- Blocked story %
- Cycle time (planning to production)

## Resources

- [BMAD Agent Guide](../bmad-method/agent-guide.md)
- [BMAD Workflow Guide](../bmad-method/workflow-guide.md)
- [Coding Standards](./coding-standards.md)
- [Testing Strategy](./testing-strategy.md)

---

**Questions about the workflow?** Ask in team chat or refer to BMAD documentation.

Last updated: 2025-12-16

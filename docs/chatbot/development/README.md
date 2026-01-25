# Development Documentation

This directory contains development processes, coding standards, and best practices for the Chat SDK project.

## 📂 Contents

- **[Development Workflow](./workflow.md)** - Our BMAD-powered development process
- **[Coding Standards](./coding-standards.md)** - Code quality and style guidelines  
- **[Testing Strategy](./testing-strategy.md)** - Testing approaches and requirements
- **[Code Review Guide](./code-review-guide.md)** - Review process and checklist

## 🎯 Development Philosophy

Our development approach is guided by these principles:

### 1. **BMAD Method First**
We use the BMAD Method for all feature development, ensuring consistent quality and comprehensive planning.

### 2. **Test-Driven Quality**
Tests are written alongside code, not as an afterthought. We target >80% coverage on new code.

### 3. **Accessibility by Default**
All UI changes must meet accessibility standards, enforced by Ultracite linter.

### 4. **Type Safety**
TypeScript strict mode is non-negotiable. Types document intent and catch errors early.

### 5. **Performance Conscious**
Every feature considers performance impact. Bundle size, response time, and render performance matter.

## 🔄 Development Lifecycle

Our development follows the BMAD Method phases:

```
1. Planning
   └─ PM creates PRD
   └─ Technical spec if needed

2. Architecture  
   └─ Architect designs solution
   └─ ADRs for key decisions
   └─ Review and approval

3. Story Breakdown
   └─ SM creates epics and stories
   └─ Story estimation
   └─ Sprint planning

4. Implementation (repeat per story)
   └─ DEV implements story
   └─ Write tests alongside code
   └─ Code review
   └─ Mark complete and demo

5. Release
   └─ Integration testing
   └─ Documentation updates
   └─ Deploy and monitor
```

See [Development Workflow](./workflow.md) for detailed process.

## 🛠️ Tech Stack

### Core Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16 | React server components, App Router |
| **Language** | TypeScript | Type safety, better DX |
| **AI** | Vercel AI SDK | Streaming, multi-model support |
| **Database** | Neon PostgreSQL | Serverless Postgres |
| **ORM** | Drizzle | Type-safe database access |
| **Storage** | Vercel Blob | File uploads |
| **Auth** | Next-Auth | Authentication |
| **Styling** | Tailwind CSS v4 | Utility-first CSS |
| **Components** | shadcn/ui | Accessible React components |
| **Testing** | Playwright | End-to-end testing |
| **Linting** | Ultracite (Biome) | Code quality, accessibility |

### Key Dependencies

```json
{
  "@ai-sdk/gateway": "^1.0.15",
  "@ai-sdk/react": "2.0.26",
  "next": "latest",
  "react": "19.0.0-rc",
  "typescript": "^5.x",
  "drizzle-orm": "^0.34.0"
}
```

## 💻 Development Setup

### Prerequisites
- Node.js >= 20.0.0
- pnpm (recommended) or npm
- Git

### Initial Setup

```bash
# Clone repository
git clone https://github.com/dianedef/chatbot.git
cd chatbot

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

### Install BMAD Method

```bash
npx bmad-method@alpha install
```

See [BMAD Integration Guide](../bmad-method/integration-guide.md) for details.

## 📋 Daily Development Flow

### Starting Your Day

1. **Pull latest changes**
   ```bash
   git pull origin main
   ```

2. **Check workflow status**
   ```bash
   cat docs/bmad-method/bmm-workflow-status.yaml
   ```

3. **Review sprint plan**
   ```bash
   cat docs/bmad-method/sprint-[current]-plan.md
   ```

4. **Pick up next story**
   - Load Developer agent
   - Run `*dev-story [story-id]`

### Implementing a Story

1. **Understand requirements**
   - Read story acceptance criteria
   - Review architecture document
   - Check for dependencies

2. **Create feature branch**
   ```bash
   git checkout -b feature/[story-id]-[description]
   ```

3. **Implement with BMAD**
   - Load Developer agent (fresh chat)
   - Run `*dev-story [story-id]`
   - Follow agent guidance
   - Write tests alongside code

4. **Verify quality**
   ```bash
   pnpm lint          # Check code quality
   pnpm test          # Run tests
   pnpm build         # Verify build
   ```

5. **Commit changes**
   ```bash
   git add .
   git commit -m "feat([story-id]): [description]"
   ```

6. **Code review**
   - Push branch
   - Create PR
   - Request review
   - Address feedback

7. **Merge and cleanup**
   ```bash
   git checkout main
   git pull origin main
   git branch -d feature/[story-id]-[description]
   ```

## 🧪 Quality Standards

### Code Quality Checklist

Before submitting PR:

- [ ] Ultracite linter passes: `pnpm lint`
- [ ] TypeScript compiles: `pnpm build`
- [ ] Tests pass: `pnpm test`
- [ ] Test coverage >80% on new code
- [ ] No console.log statements
- [ ] Comments explain "why", not "what"
- [ ] Accessibility requirements met
- [ ] Performance impact considered

### Code Review Checklist

When reviewing code:

- [ ] Logic is correct and complete
- [ ] Code follows existing patterns
- [ ] Tests are comprehensive
- [ ] Edge cases handled
- [ ] Error handling present
- [ ] Documentation updated
- [ ] No security vulnerabilities
- [ ] Performance is acceptable

See [Code Review Guide](./code-review-guide.md) for details.

## 📏 Coding Standards

### Key Rules (Ultracite)

```typescript
// ✅ DO: Use import type for types
import type { User } from './types';

// ❌ DON'T: Import types as values
import { User } from './types';

// ✅ DO: Use const assertions
const STATUS = {
  PENDING: 'pending',
  COMPLETE: 'complete',
} as const;

// ❌ DON'T: Use enums
enum Status { PENDING, COMPLETE }

// ✅ DO: Semantic HTML
<button type="button" onClick={handleClick}>
  Click me
</button>

// ❌ DON'T: Non-semantic divs for interactive elements
<div onClick={handleClick}>Click me</div>
```

See [Coding Standards](./coding-standards.md) for complete guidelines.

## 🧪 Testing Strategy

### Test Types

1. **Unit Tests** - Test individual functions/components
2. **Integration Tests** - Test API endpoints and data flows
3. **E2E Tests** - Test complete user journeys (Playwright)

### Testing Guidelines

```typescript
// Unit test example
describe('searchIndex', () => {
  it('should find code by keyword', () => {
    const index = new SearchIndex();
    index.add({ id: '1', code: 'const foo = "bar"' });
    
    const results = index.search('foo');
    expect(results).toHaveLength(1);
    expect(results[0].code).toContain('foo');
  });
});

// E2E test example  
test('user can search code in chat', async ({ page }) => {
  await page.goto('/');
  await page.fill('[data-testid="search-input"]', 'useState');
  await page.click('[data-testid="search-button"]');
  
  await expect(page.locator('[data-testid="search-results"]'))
    .toContainText('useState');
});
```

See [Testing Strategy](./testing-strategy.md) for comprehensive guide.

## 🔍 Debugging

### Development Tools

- **React DevTools** - Component hierarchy and state
- **Next.js DevTools** - Server components and caching
- **Network Tab** - API requests and streaming
- **Console** - Logs and errors (remove before commit)

### Common Issues

See troubleshooting section in [Development Workflow](./workflow.md).

## 🚀 Deployment

### Vercel Deployment (Recommended)

```bash
# Deploy preview
vercel

# Deploy to production
vercel --prod
```

### Self-Hosted Deployment

See [Deployment Guide](./deployment.md) (to be created).

## 📚 Learning Resources

### Internal
- [BMAD Method Documentation](../bmad-method/)
- [Architecture Documentation](../architecture/)
- [GitHub Copilot Instructions](../../.github/copilot-instructions.md)

### External
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Drizzle ORM](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)

## 🤝 Contributing

### For Core Team

Follow the BMAD Method workflow outlined in this documentation.

### For External Contributors

1. Read [Contributing Guide](../../CONTRIBUTING.md)
2. Check [Good First Issues](https://github.com/dianedef/chatbot/labels/good%20first%20issue)
3. Follow coding standards and testing requirements
4. Submit PR with clear description

## 📊 Metrics

We track these development metrics:

- **Velocity**: Story points per sprint
- **Quality**: Bug rate, test coverage
- **Cycle Time**: Idea to production
- **Code Health**: Linter compliance, tech debt

## 🔄 Continuous Improvement

### Retrospectives

After each sprint:
1. What went well?
2. What could improve?
3. Action items for next sprint

Document in `docs/bmad-method/retrospectives/`.

### Process Updates

This documentation evolves:
- Review quarterly
- Update based on team feedback
- Keep aligned with BMAD Method

---

**Questions?** Ask in team chat or open a GitHub discussion.

Last updated: 2025-12-16

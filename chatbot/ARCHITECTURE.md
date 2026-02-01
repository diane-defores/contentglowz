# Architecture Documentation

This directory contains system architecture documentation, design decisions, and technical patterns for the Chat SDK project.

## 📂 Contents

- **[Architecture Overview](./overview.md)** - High-level system architecture
- **[Tech Stack](./tech-stack.md)** - Technology choices and rationale
- **[Architecture Decision Records (ADRs)](./adr/)** - Key architectural decisions

## 🏗️ System Architecture

Chat SDK is built as a modern, scalable Next.js application with these key characteristics:

### Core Principles

1. **Server-First Architecture**
   - Server Components for initial rendering
   - Server Actions for mutations
   - Streaming for real-time data

2. **Type-Safe Data Flow**
   - TypeScript strict mode throughout
   - Drizzle ORM for database
   - Zod for runtime validation

3. **Modular Design**
   - Feature-based organization
   - Clear separation of concerns
   - Reusable components and utilities

4. **Performance Optimized**
   - Streaming responses
   - Optimistic updates
   - Efficient caching strategy

5. **Accessibility First**
   - ARIA attributes where needed
   - Semantic HTML
   - Keyboard navigation

## 🎨 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
├─────────────────────────────────────────────────────────────┤
│  React 19 Components (Client & Server)                      │
│  ├─ Chat Interface                                           │
│  ├─ Artifact Renderers (Code, Text, Image, Sheet)          │
│  ├─ Authentication UI                                        │
│  └─ Settings & Preferences                                   │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
├─────────────────────────────────────────────────────────────┤
│  Next.js 16 App Router                                      │
│  ├─ API Routes (/api/chat)                                  │
│  ├─ Server Actions (mutations, title generation)           │
│  ├─ Middleware (auth, rate limiting)                       │
│  └─ Server Components (SSR, data fetching)                  │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Business Logic                         │
├─────────────────────────────────────────────────────────────┤
│  Core Services                                               │
│  ├─ AI Service (Vercel AI SDK)                             │
│  │   ├─ Model abstraction (myProvider)                     │
│  │   ├─ Tool system (4 tools)                              │
│  │   └─ Streaming handlers                                 │
│  ├─ Database Service (Drizzle ORM)                         │
│  │   ├─ User management                                     │
│  │   ├─ Chat persistence                                    │
│  │   └─ Message storage                                     │
│  ├─ Storage Service (Vercel Blob)                          │
│  │   └─ File uploads                                        │
│  └─ Auth Service (Next-Auth)                               │
│      ├─ Guest sessions                                       │
│      └─ Credential auth                                      │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                             │
├─────────────────────────────────────────────────────────────┤
│  ├─ Neon PostgreSQL (primary data store)                   │
│  ├─ Vercel Blob (file storage)                             │
│  ├─ Vercel KV (Redis - transient data)                     │
│  └─ AI Gateway (xAI Grok models)                           │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Module Organization

### Directory Structure

```
/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (chat)/            # Chat application routes
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── chat.tsx          # Main chat orchestration
│   ├── artifact.tsx      # Artifact routing
│   └── ...               # Feature components
├── artifacts/            # Artifact type implementations
│   ├── code/            # Code editor artifact
│   ├── text/            # Rich text artifact
│   ├── image/           # Image artifact
│   └── sheet/           # Spreadsheet artifact
├── lib/                  # Core business logic
│   ├── ai/              # AI integration
│   │   ├── providers.ts # Model abstraction
│   │   ├── models.ts    # Model configurations
│   │   └── tools/       # AI tools
│   ├── db/              # Database
│   │   ├── schema.ts    # Drizzle schema
│   │   ├── queries.ts   # Database queries
│   │   └── migrate.ts   # Migrations
│   ├── types.ts         # Shared types
│   └── errors.ts        # Error handling
├── hooks/               # Custom React hooks
├── tests/               # Test suites
└── public/              # Static assets
```

### Key Patterns

#### Server Actions Pattern
```typescript
// app/(chat)/actions.ts
'use server';

export async function saveChatModelAsCookie(model: string) {
  cookies().set('chat-model', model);
}

export async function generateTitleFromUserMessage(chatId: string) {
  // Server-side AI call for title generation
}
```

#### Streaming Pattern
```typescript
// app/api/chat/route.ts
export async function POST(request: Request) {
  const result = streamText({
    model: myProvider.languageModel(model),
    messages,
    tools,
    onFinish: async ({ response }) => {
      // Save to database
    }
  });

  return result.toDataStreamResponse();
}
```

#### Artifact Pattern
```typescript
// components/artifact.tsx
export function Artifact({ artifact }: ArtifactProps) {
  switch (artifact.kind) {
    case 'code':
      return <CodeArtifact {...artifact} />;
    case 'text':
      return <TextArtifact {...artifact} />;
    case 'image':
      return <ImageArtifact {...artifact} />;
    case 'sheet':
      return <SheetArtifact {...artifact} />;
  }
}
```

## 🔐 Security Architecture

### Authentication Flow

```
1. User visits app
2. Middleware checks session
3. If no session → Redirect to /api/auth/guest (auto-login)
4. If guest → Create ephemeral user
5. If credential → Verify against database
6. Session stored in cookie
7. All requests include session context
```

### Security Measures

- **Input Validation**: Zod schemas for all inputs
- **SQL Injection**: Drizzle ORM parameterized queries
- **XSS Protection**: React auto-escaping, CSP headers
- **CSRF Protection**: Next.js built-in protection
- **Rate Limiting**: API route rate limits
- **Secrets Management**: Environment variables only

## 🚀 Performance Architecture

### Optimization Strategies

1. **Server Components**
   - Reduce client bundle size
   - Faster initial page load
   - Better SEO

2. **Streaming**
   - Progressive rendering
   - Perceived performance improvement
   - Handle large responses

3. **Caching**
   - Static generation where possible
   - Redis for session data
   - Browser caching for static assets

4. **Code Splitting**
   - Dynamic imports for heavy components
   - Route-based splitting
   - Lazy loading artifacts

5. **Database Optimization**
   - Indexed queries
   - Connection pooling (Neon)
   - Efficient query patterns

## 🔄 Data Flow Patterns

### Message Flow

```
User Input → Chat Component → useChat Hook
                                    ↓
                              POST /api/chat
                                    ↓
                        streamText() with tools
                                    ↓
                        AI Gateway (Grok models)
                                    ↓
                    Stream Response (text/data)
                                    ↓
                        useChat processes stream
                                    ↓
                    Update UI (optimistic updates)
                                    ↓
                    Save to database (onFinish)
```

### Artifact Generation Flow

```
AI Tool Call (createDocument/updateDocument)
                    ↓
          Stream artifact metadata
          (kind, id, title)
                    ↓
          Stream content deltas
          (codeDelta, textDelta, etc.)
                    ↓
      Client receives and accumulates
                    ↓
      Artifact component renders
      (CodeMirror, ProseMirror, Canvas, Grid)
```

## 🏛️ Architecture Decision Records (ADRs)

ADRs document significant architectural decisions:

### Creating an ADR

Use the Architect agent:
```
*adr [decision title]
```

Or manually create:
```markdown
# ADR-XXX: [Decision Title]

## Status
[Proposed | Accepted | Deprecated | Superseded]

## Context
[What is the issue we're facing?]

## Decision
[What decision did we make?]

## Consequences
[What are the implications?]

## Alternatives Considered
[What other options did we evaluate?]
```

### Existing ADRs

See `docs/architecture/adr/` directory for all decisions.

## 🎯 Design Principles

### 1. Convention over Configuration
- Follow Next.js conventions
- Standard file structure
- Minimal configuration files

### 2. Type Safety Everywhere
- TypeScript strict mode
- Runtime validation with Zod
- Database types from Drizzle

### 3. Progressive Enhancement
- Works without JavaScript where possible
- Graceful degradation
- Accessibility first

### 4. Separation of Concerns
- Business logic in `lib/`
- UI components in `components/`
- Routes in `app/`
- Tests separate from implementation

### 5. Testability
- Pure functions where possible
- Dependency injection
- Mock-friendly abstractions

## 🔧 Technology Decisions

### Why Next.js 16?
- Server Components reduce bundle size
- App Router provides better routing
- Built-in optimization (images, fonts, etc.)
- Excellent TypeScript support
- Vercel integration

### Why Vercel AI SDK?
- Framework-agnostic
- Streaming support built-in
- Multiple provider support
- Tool calling standardized
- React hooks included

### Why Drizzle ORM?
- Type-safe by design
- Lightweight (minimal overhead)
- SQL-like API (familiar)
- Excellent TypeScript inference
- Migration system

### Why Tailwind CSS?
- Utility-first (fast development)
- Great IDE support
- Small production bundle
- Customizable
- Well documented

### Why shadcn/ui?
- Accessible by default (Radix UI)
- Copy-paste components (not package)
- Customizable
- Tailwind-based
- TypeScript support

## 📊 Scalability Considerations

### Current Scale
- Single region deployment
- Serverless architecture (auto-scaling)
- PostgreSQL connection pooling
- CDN for static assets

### Future Scale
- Multi-region deployment capability
- Read replicas for database
- Redis for distributed caching
- CDN optimization
- Rate limiting per user

## 🔍 Monitoring & Observability

### Current Setup
- Vercel Analytics (web vitals)
- OpenTelemetry instrumentation
- Error logging
- Performance monitoring

### Metrics Tracked
- Response times
- Error rates
- Database query performance
- AI API latency
- User engagement

## 🚧 Known Limitations

1. **Single Model Family**: Currently xAI Grok only
   - **Mitigation**: AI SDK supports easy multi-provider
   
2. **No Real-time Collaboration**: Single user per chat
   - **Mitigation**: Planned for future (see roadmap)

3. **Limited File Types**: Specific artifact types only
   - **Mitigation**: Extensible artifact system

4. **Guest Session Limits**: Ephemeral, no cross-device
   - **Mitigation**: Credential auth available

## 📚 References

### Internal
- [Development Workflow](../development/workflow.md)
- [BMAD Method Integration](../bmad-method/integration-guide.md)

### External
- [Next.js Architecture](https://nextjs.org/docs/app/building-your-application)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [React Server Components](https://react.dev/reference/rsc/server-components)

---

**Contributing to architecture?** Always create an ADR for significant decisions.

Last updated: 2025-12-16

# AI Copilot Instructions for Chat SDK

## Project Overview

**Chat SDK** is an open-source Next.js 16 AI chatbot template built on the Vercel AI SDK, enabling rapid development of multimodal chat applications. The architecture emphasizes **server-side rendering**, **streaming data flows**, and **artifact-based UI generation**.

### Core Stack
- **Frontend**: Next.js 16 (App Router), React 19 RC, TypeScript strict mode
- **AI Integration**: Vercel AI SDK (`@ai-sdk/react`, `@ai-sdk/gateway`)
- **Models**: xAI Grok (vision & reasoning models via Vercel AI Gateway)
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Storage**: Vercel Blob (file uploads), Redis (transient data)
- **Auth**: Next-Auth (support for guest & credential-based auth)
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Code Quality**: Ultracite linter (Biome-based) with strict accessibility rules

---

## Architecture Patterns

### 1. **Message Flow: Server Actions → Streaming → Client State**

The chat system implements an **asymmetric streaming pattern**:

- **Server Actions** (`app/(chat)/actions.ts`) handle mutations: title generation, message deletion, chat visibility
- **Chat endpoint** (`app/api/chat/route.ts`) streams AI responses with structured data parts
- **Client hook** (`@ai-sdk/react`'s `useChat`) manages optimistic updates, message history, and auto-resume

**Key files**: `components/chat.tsx` (orchestration), `app/(chat)/actions.ts`, `lib/types.ts` (message shape)

### 2. **Artifact Pattern: AI-Generated UI Components**

When the AI generates code, sheets, or text, it streams **artifact metadata** (`kind`, `id`, `title`) followed by content increments. The `<Artifact>` component routes rendering:

- **`code`**: CodeMirror editor with language detection
- **`text`**: ProseMirror-based rich text editor with diff view
- **`image`**: Controlled canvas preview
- **`sheet`**: React Data Grid with CSV/JSON import

See: `components/artifact.tsx`, `artifacts/code/client.tsx`, `artifacts/text/client.tsx`

### 3. **Data Streams & Custom Types**

Messages use `CustomUIDataTypes` (defined in `lib/types.ts`) for non-standard content:
- `textDelta`, `codeDelta`, `imageDelta`, `sheetDelta` for streaming
- `suggestion` (from tools) for inline recommendations
- `finish`, `clear` for control signals

Maps to Drizzle schema: `message.parts` = `json[]` of `{ type, content }`

---

## Developer Workflows

### Build & Development
```bash
pnpm install              # Bootstrap dependencies
pnpm dev                  # Start Next.js turbo server (localhost:3000)
pnpm build                # Compile + run DB migrations
pnpm start                # Production server
```

### Database
```bash
pnpm db:generate          # Generate Drizzle types from schema
pnpm db:migrate           # Apply pending migrations
pnpm db:studio            # Open Drizzle Studio UI (localhost:5555)
pnpm db:push              # Push schema to database
```

### Code Quality
```bash
pnpm lint                 # Check with Ultracite (Biome)
pnpm format               # Auto-fix formatting & accessibility issues
```

### Testing
```bash
pnpm test                 # Run Playwright e2e tests (sets PLAYWRIGHT=True env)
```

**Key insight**: Biome linting is **very opinionated** (defined in `.cursor/rules/ultracite.mdc`). When generating code, strictly follow Ultracite rules: no enums, `import type`, use `as const`, semantic HTML, etc.

---

## Critical Integration Points

### AI Provider Configuration
The `myProvider` custom provider (`lib/ai/providers.ts`) abstracts model access:

```typescript
gateway.languageModel("xai/grok-2-vision-1212")      // Default chat model
gateway.languageModel("xai/grok-3-mini")             // Reasoning model (with extractReasoningMiddleware)
```

In test env, models are mocked via `models.mock.ts`. **Always use `myProvider.languageModel(modelId)` instead of direct provider calls**.

### Tool System
Four tool definitions in `lib/ai/tools/`:
- `createDocument.ts`: Create artifact with content
- `updateDocument.ts`: Stream changes to existing artifact
- `getWeather.ts`: External weather API (tool calling example)
- `requestSuggestions.ts`: Generate inline suggestions

Tools are registered via `generateText()` or `streamText()` calls in the chat endpoint.

### Authentication Context
Auth runs in **two modes**:
1. **Guest**: Auto-created ephemeral user (for demos)
2. **Regular**: Email/password credentials stored in DB

Both flows populate `session.user.id` and `session.user.type` for server-side queries. See `app/(auth)/auth.ts`.

---

## Conventions & Patterns

### File Organization
- `/app` — Route handlers, layouts, auth config
- `/components` — React components, client/server split
- `/lib/ai` — Model config, tools, prompts, providers
- `/lib/db` — Drizzle schema, migrations, queries
- `/artifacts` — Artifact renderers (code, text, image, sheet)
- `/hooks` — Custom React hooks (chat, visibility, auto-resume)

### Naming Conventions
- Server Actions: `verb + Noun` (e.g., `saveChatModelAsCookie`, `generateTitleFromUserMessage`)
- Database queries: `verb + By + FilterField` (e.g., `getMessageById`, `deleteMessagesByChatIdAfterTimestamp`)
- Components: PascalCase, no prefix (except `use` for hooks)

### Message Shape in Database
Messages are stored as `parts[]` (JSON array), each part has `{ type: string; content: any }`. This allows streaming different data types into one message without table changes. Old schema (`messageDeprecated`) is still present but shouldn't be used—consult migration guide.

### Styling
- **Utility-first**: Tailwind classes via `className` prop
- **Dark mode**: `next-themes` provider auto-injects `.dark` class
- **Components**: shadcn/ui (Radix UI primitives + Tailwind) in `/components/ui`
- **Animations**: `framer-motion` for key UI transitions

### Error Handling
Implement domain errors via `ChatSDKError` (in `lib/errors.ts`). Errors should include:
- Clear message for end users
- Category/type for routing (network, auth, validation)
- Context for debugging

---

## Testing & Validation

- **e2e tests**: Playwright in `/tests/e2e`, fixtures in `/tests/fixtures.ts`
- **Type safety**: `strict: true` in `tsconfig.json`; leverage TypeScript inference via `InferSelectModel`, `InferUITool`
- **Accessibility**: Ultracite enforces ARIA/semantic HTML; never skip a11y rules

---

## Common Gotchas

1. **Message Hydration**: `useChat()` expects consistent message shape. Always use `generateUUID()` for message IDs to avoid hydration mismatches.
2. **Streaming Data Parts**: Custom UI data streams must be declared in `CustomUIDataTypes` and handled in the client stream listener.
3. **Auth Redirect**: Guest sessions redirect to `/api/auth/guest` on first visit; don't manually override this.
4. **DB Schema Changes**: Update `schema.ts`, run `pnpm db:generate`, then create a migration via Drizzle Kit.
5. **Provider Model Names**: Always reference model IDs via `chatModels` array in `lib/ai/models.ts`; hardcoding breaks mock tests.

---

## When Unsure

1. Check **existing patterns** before inventing new ones (e.g., how do other artifacts handle streaming?)
2. **Run tests locally**: `pnpm test` catches integration issues early
3. **Follow Ultracite**: If linter complains, fix it—don't override rules
4. **Refer to file comments**: Many patterns document "why" in JSDoc or inline comments


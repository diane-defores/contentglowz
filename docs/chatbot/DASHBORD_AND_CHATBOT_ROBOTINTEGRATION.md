# Dashboard and Chatbot Integration Task List

This document outlines the steps required to integrate new features into both the Next.js Dashboard and the AI Chatbot. It serves as a guide for future robot integrations, ensuring consistency and completeness.

---

## **Phase 1: Dashboard Feature Integration**

### **1. Backend API Client Extension**
- [ ] Extend `chatbot/lib/seo-api-client.ts` (`SEOApiclient`) to include new API endpoints for the feature.
    -   Ensure the client respects `authToken` for authenticated requests.

### **2. Custom React Hook Development**
- [ ] Create a new file `chatbot/lib/hooks/use-<feature-name>.ts`.
- [ ] Define types for feature-specific data (`<Feature>Stats`, `<Feature>Config`, etc.) based on API responses.
- [ ] Implement core logic, state management, and API calls using the extended `seo-api-client`.
- [ ] Export state variables (`data`, `config`, `loading`, `error`), setters (`setConfig`), and action functions (`analyze<Feature>`, `generate<Feature>Strategy`, `apply<Feature>`).
- [ ] Pass `authToken` as a parameter to the hook and use it to instantiate `seoApiClient`.

### **3. Dashboard Component (`<Feature>Card.tsx`)**
- [ ] Create a new component `chatbot/components/dashboard/<feature-name>-card.tsx`.
- [ ] Accept necessary props (e.g., `repoUrl`, `authToken`).
- [ ] Integrate the custom hook (`use<Feature>`) to manage feature-specific state and logic.
- [ ] Design and implement the UI to display data from the hook and interact with its functions (buttons, configuration modals).
- [ ] Implement `useEffect` to trigger initial analysis or data fetching when the component mounts.

### **4. Dashboard Configuration Component (`<Feature>ConfigModal.tsx`)**
- [ ] Create `chatbot/components/dashboard/<feature-name>-config.tsx`.
- [ ] Implement a modal or form for configuring feature-specific settings.
- [ ] Connect configuration inputs to the `config` state and `setConfig` function from the custom hook.
- [ ] Ensure `onSave` actions trigger the appropriate strategy generation or update functions from the hook.

### **5. Dashboard Page Integration (`app/dashboard/page.tsx`)**
- [ ] Import the new `<Feature>Card` component.
- [ ] Fetch any necessary data (e.g., `authToken` from `auth()`) that needs to be passed as props to the `<Feature>Card`.
- [ ] Render the `<Feature>Card` component, passing all required props.

---

## **Phase 2: AI Chatbot Feature Integration**

### **1. AI SDK Tool Definition**
- [ ] Create a new file `chatbot/lib/ai/tools/<feature-name>-commands.ts`.
- [ ] Define chatbot commands (e.g., `analyze<Feature>`, `generate<Feature>Strategy`, `apply<Feature>`) as AI SDK tools using `tool` from `@ai-sdk/react`.
- [ ] Implement `Zod` schemas for each tool's parameters.
- [ ] Implement the `execute` method for each tool:
    -   Make actual API calls to the backend (`seo-api-client.ts`).
    -   Process the API response and return a suitable message for the chatbot.

### **2. Chat API Route Integration (`app/(chat)/api/chat/route.ts`)**
- [ ] Import the new AI SDK tools from `chatbot/lib/ai/tools/<feature-name>-commands.ts`.
- [ ] Add these tools to the `experimental_activeTools` array.
- [ ] Add these tools to the `tools` object passed to `streamText`.

---

## **Phase 3: Testing and Quality Assurance**

### **1. End-to-End Testing (Playwright)**
- [ ] Create a new E2E test file `chatbot/tests/e2e/<feature-name>.test.ts`.
- [ ] Write tests covering the full user workflow:
    -   Initial rendering of the dashboard card.
    -   Triggering analysis/actions and observing UI updates.
    -   Interaction with configuration modals (opening, changing settings, saving).
    -   Applying recommendations or strategies.
    -   Chatbot command invocation and response verification.

### **2. Linting and Typing Cleanup**
- [ ] Run `pnpm lint` in the `chatbot` directory.
- [ ] Resolve all linting errors and type errors introduced by the new feature.
    -   **Current Blocker**: Investigate and fix `biome.jsonc` configuration issues if present. This may involve examining `ultracite` rules or adjusting local overrides.

---

## **Phase 4: Manual Verification**

### **1. Local Application Testing**
- [ ] Run the Next.js application locally (`pnpm dev` in `chatbot/`).
- [ ] Manually verify the new feature's functionality on the dashboard page.
- [ ] Interact with the chatbot, invoking the new commands, and confirm correct behavior and responses.

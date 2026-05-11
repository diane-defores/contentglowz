---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "contentflow"
created: "2026-05-11"
created_at: "2026-05-11 13:15:23 UTC"
updated: "2026-05-11"
updated_at: "2026-05-11 13:15:23 UTC"
status: draft
source_skill: sf-spec
source_model: "GPT-5 Codex"
scope: "feature"
owner: "Diane"
confidence: "high"
user_story: "En tant que creatrice connectee a un projet ContentFlow, je veux generer des images IA coherentes avec les formats, personnages et caracteristiques de mon projet, afin d'alimenter mes articles, thumbnails et posts sans sortir du workflow existant."
risk_level: "high"
security_impact: "yes"
docs_impact: "yes"
linked_systems:
  - "contentflow_lab"
  - "contentflow_app"
  - "contentflowz/v0-flux-2-playground"
  - "api/images"
  - "agents/images"
  - "Bunny CDN"
  - "Clerk"
  - "Turso/libSQL"
depends_on:
  - artifact: "contentflow_lab/shipflow_data/technical/guidelines.md"
    artifact_version: "1.0.0"
    required_status: "reviewed"
  - artifact: "contentflow_app/shipflow_data/technical/guidelines.md"
    artifact_version: "1.1.0"
    required_status: "reviewed"
  - artifact: "contentflowz/INSPIRATION.md"
    artifact_version: "unknown"
    required_status: "unknown"
  - artifact: "contentflowz/GUIDELINES.md"
    artifact_version: "unknown"
    required_status: "unknown"
supersedes: []
evidence:
  - "User decision 2026-05-11: keep existing Flutter + FastAPI + Clerk + Turso/Bunny stack; use contentflowz as inspiration, not as a stack migration."
  - "User decision 2026-05-11: choose spec 1, Provider Flux pour Image Robot."
  - "User decision 2026-05-11: no free playground and no anonymous generation for now."
  - "User decision 2026-05-11: image AI should serve blog images, thumbnails, and post visuals inside existing guided workflows; video images may come later."
  - "Audit evidence: contentflow_lab already exposes Image Robot endpoints in api/routers/images.py and agents/images with Robolly/OpenAI/Bunny patterns."
  - "Audit evidence: contentflowz/v0-flux-2-playground uses FLUX.2 Pro prompt, aspect ratio, reference images, generated history, and image reuse concepts, but depends on Next/Supabase/Vercel Blob/Vercel OAuth."
  - "External docs checked 2026-05-11: Black Forest Labs FLUX.2 Pro API supports generation/editing task submission, input_image through input_image_8, width/height, seed, safety_tolerance and output_format."
next_step: "/sf-ready shipflow_data/workflow/specs/SPEC-flux-ai-provider-image-robot-2026-05-11.md"
---

# Title

Flux AI Provider For Image Robot

## Status

Draft. This spec defines the backend foundation for AI-generated project images inside the existing ContentFlow Image Robot. It intentionally avoids adding a free-form playground, Supabase, Vercel Blob, Vercel OAuth, or anonymous generation.

## User Story

En tant que creatrice connectee a un projet ContentFlow, je veux generer des images IA coherentes avec les formats, personnages et caracteristiques de mon projet, afin d'alimenter mes articles, thumbnails et posts sans sortir du workflow existant.

## Minimal Behavior Contract

When an authenticated user generates an image for a project using an Image Robot profile whose provider is `flux`, the backend validates project ownership, resolves the profile's guided format and visual memory, builds a structured prompt, optionally attaches up to eight approved project reference images, submits the request to the configured Flux provider, uploads the resulting image to Bunny CDN, stores generation metadata, and returns the same response shape used by existing profile-based image generation. If Flux is not configured, the provider rejects the request with a clear non-secret error and does not fall back silently to template generation. The easy edge case to miss is treating reference images as a playground upload instead of a controlled project visual memory, which would break consistency, privacy, and product guidance.

## Success Behavior

- Given an authenticated user owns a project, when they generate from a `flux` image profile for blog hero, OG card, thumbnail, or social visual, then the API returns a generated image URL stored on Bunny CDN with profile, provider, prompt, model, dimensions, seed if present, reference image IDs, and timing metadata.
- Given a project has visual memory references, when the user generates an image with consistency enabled, then the backend passes only approved project reference images to Flux and records which references were used.
- Given the profile defines a target format, when generation runs, then the backend maps the format to explicit dimensions rather than exposing arbitrary free-form size controls.
- Given generation succeeds but CDN upload fails, then the API reports failure for the stored asset and does not return a transient provider URL as if it were durable.
- Given Flux credentials are missing, invalid, rate-limited, or the provider rejects the prompt, then the API returns a typed error suitable for the app UI and does not expose keys, raw tokens, or provider internals.
- Given the user refreshes image history for a project, then Flux generations appear alongside existing Image Robot results without requiring Supabase or local JSON as the source of truth.
- Given existing Robolly/OpenAI template/profile flows are used, when Flux is added, then those flows keep their current behavior and response contracts.

## Error Behavior

- If the user is not authenticated through Clerk, return `401` via existing `require_current_user` behavior.
- If the project does not exist or is not owned by the current user, return `404` or `403` using the existing ownership convention; never rely on the placeholder `default-user`.
- If a requested profile does not allow `flux`, return `400` with an unsupported provider/profile message.
- If a reference image belongs to another project or is not approved for visual memory, return `403` or ignore it only when the request explicitly marks references as optional.
- If the provider returns moderation or safety failure, return a typed `provider_safety_rejected` error and store only minimal failure metadata.
- If provider output is empty, malformed, or not a supported image MIME type, return `provider_invalid_output`.
- If Turso persistence fails after Bunny upload, return the image response with a visible `history_persisted: false` flag only if the generation asset is durable; otherwise return failure.
- What must never happen: anonymous generation in this feature, unverified user/project access, provider secrets in responses/logs, generated outputs stored only on third-party temporary URLs, image references copied across projects, or a new Next/Supabase subsystem.

## Problem

ContentFlow already has Image Robot infrastructure, but it is centered on template-driven generation such as Robolly and profile-driven OpenAI image generation. The `contentflowz/v0-flux-2-playground` prototype shows a useful AI image workflow with prompt, ratio, reference images, history, and result reuse, but its implementation is not compatible with the production stack. Users need AI-generated visuals that match their project formats and recurring visual identity, without being pushed into an unguided playground.

## Solution

Extend `contentflow_lab` Image Robot with a first-class `flux` provider that fits the existing profile, project, auth, Bunny CDN, and app contracts. Add controlled project visual memory for consistency across characters, products, brand traits, and recurring motifs. Expose the feature to `contentflow_app` only through guided formats such as blog hero, OG/social card, thumbnail, and post visual.

## Scope In

- Add `flux` as an allowed image provider in Image Robot profiles.
- Implement a backend Flux provider service in `contentflow_lab` that calls the configured BFL-compatible API.
- Support text-to-image and reference-guided generation for up to eight approved project reference images.
- Map guided profile formats to explicit dimensions for blog hero, OG/social card, thumbnail, and post visuals.
- Store generated assets in Bunny CDN and return optimizer/responsive URLs using the existing CDN manager path.
- Persist generation history and provider metadata in a project/user-scoped durable store.
- Add model, provider, prompt, resolved dimensions, seed, safety tolerance, output format, reference IDs, status, error category, provider cost if available, and timing metadata.
- Preserve existing `/api/images/generate-from-profile` semantics where possible and add only the fields needed for Flux.
- Add API tests for ownership, provider resolution, reference validation, provider error mapping, CDN upload failure, and history persistence.
- Add app-facing copy/state requirements so Flutter can present Flux as guided image generation, not a blank playground.

## Scope Out

- Anonymous/free public generation.
- Supabase, Vercel Blob, Vercel OAuth, or Next.js route migration from the prototype.
- A standalone playground screen with arbitrary model controls.
- Video image generation workflows; include only future-compatible metadata where cheap.
- Fine-tuning, LoRA training, custom model hosting, or local Flux inference.
- Full asset library UI for managing all project images; only the minimal visual memory/reference contract is included.
- Billing, quotas, and plan limits beyond recording cost metadata when the provider returns it.
- Automatic insertion into articles/posts; this provider returns durable generated assets for existing or future workflows to use.

## Constraints

- `contentflow_lab` is the source of truth for backend generation; `contentflow_app` consumes FastAPI only.
- Authentication must use existing Clerk/FastAPI dependencies.
- Project access must use real current user identity, not the current `get_current_user_id()` placeholder in `api/routers/images.py`.
- Storage remains Bunny CDN.
- If Turso tables are introduced for history/visual memory, startup ensures or migrations must ship in the same implementation.
- Provider keys must live in environment variables and never be stored in project profiles.
- The app should expose guided presets and profile choices, not raw provider internals.

## Dependencies

- Existing backend router: `contentflow_lab/api/routers/images.py`.
- Existing image models: `contentflow_lab/api/models/images.py`.
- Existing OpenAI image service pattern: `contentflow_lab/api/services/ai_image_generation.py`.
- Existing image profile store: `contentflow_lab/api/services/image_profiles.py`.
- Existing Image Robot pipeline: `contentflow_lab/agents/images/**`.
- Existing Bunny CDN manager: `contentflow_lab/agents/images/cdn_manager.py`.
- Existing auth dependency: `contentflow_lab/api/dependencies/auth.py`.
- Existing project store/ownership patterns: `contentflow_lab/agents/seo/config/project_store.py` and ownership helpers where applicable.
- Existing Flutter API service/provider conventions: `contentflow_app/lib/data/services/api_service.dart` and `contentflow_app/lib/providers/providers.dart`.
- Fresh external docs: `fresh-docs checked`. Official Black Forest Labs docs were checked on 2026-05-11:
  - `https://docs.bfl.ai/flux_2/flux2_overview`
  - `https://docs.bfl.ml/api-reference/models/generate-or-edit-an-image-with-flux2-%5Bpro%5D`

## Invariants

- All generation belongs to a project and an authenticated user.
- A generated image returned to the app is durable only after Bunny CDN upload succeeds.
- Reference images used for consistency must be project-scoped and approved.
- Robolly and existing OpenAI profile behavior must remain backward compatible.
- Provider errors are normalized before reaching the app.
- The first implementation supports consistent visual direction through references and structured prompts, not through training or custom weights.

## Links & Consequences

- `contentflow_lab/api/routers/images.py`: needs real current-user ownership checks before project-scoped image features can be trusted.
- `contentflow_lab/api/models/images.py`: needs provider enum expansion, Flux request metadata, and response fields for history/persistence status.
- `contentflow_lab/api/services/ai_image_generation.py`: should either become a provider abstraction or delegate to a new Flux-specific service.
- `contentflow_lab/api/services/image_profiles.py`: needs built-in Flux profiles for blog hero, social card, thumbnail, and post visual.
- `contentflow_lab/agents/images/cdn_manager.py`: should remain the durable storage path; no Vercel Blob path is introduced.
- `contentflow_app/lib/data/services/api_service.dart`: needs typed calls once the backend endpoint contract is ready.
- Turso/libSQL: likely needs new tables for image generation history and project visual memory; migration decision is `yes` unless an existing durable table is reused.
- Docs/support: update backend setup docs with Flux env vars and Image Robot provider behavior.

## Documentation Coherence

- Update `contentflow_lab` environment/setup documentation with required Flux variables, expected Bunny variables, and failure modes.
- Update Image Robot API docs or README to distinguish template providers from AI generative providers.
- Update app copy only after UI work begins, keeping wording guided by output type rather than model name.
- Add a short implementation note explaining that consistency V1 uses approved reference images and structured project prompts; fine-tuning is out of scope.

## Edge Cases

- A project has no visual memory references yet: generation still works from profile prompt and brand traits, with UI suggesting adding references later.
- A project has more than eight references: backend chooses the profile-approved priority order and records the selected references.
- A reference image is too large or unsupported: backend rejects it before provider call or uses a normalized Bunny/CDN source if already processed.
- Provider supports multiple Flux variants: V1 uses a configured default, while the profile may store a stable model ID for reproducibility.
- The provider returns an async polling URL rather than final bytes immediately: backend must poll with timeout or enqueue a job; do not block indefinitely.
- Flux can edit from references, but the user expects identical character consistency: spec language and UI must present it as consistency guidance, not a perfect identity guarantee.
- Generated images may include readable text: prompts should avoid relying on exact text unless the format needs it, and failures should be editable/regenerable later.

## Implementation Tasks

- [ ] Task 1: Fix Image Robot project ownership foundation
  - File: `contentflow_lab/api/routers/images.py`
  - Action: Replace the `get_current_user_id()` placeholder with the authenticated `CurrentUser` from `require_current_user` in project-scoped endpoints and helpers.
  - User story link: Prevents generated assets and references from crossing project/user boundaries.
  - Depends on: none.
  - Validate with: backend tests for owned, missing, and foreign project IDs.

- [ ] Task 2: Define durable image generation and visual memory schema
  - File: `contentflow_lab/api/models/images.py`
  - Action: Add request/response models for `flux` provider metadata, generation history items, visual memory references, and normalized provider errors.
  - User story link: Makes Flux outputs traceable and project-scoped.
  - Depends on: Task 1.
  - Validate with: model validation tests for provider, ratios/dimensions, references, and error categories.

- [ ] Task 3: Add Turso persistence for image generations and references
  - File: `contentflow_lab/api/services/image_generation_store.py`
  - Action: Create a store for project image generations and visual memory references with idempotent table ensure or migration.
  - User story link: Gives users durable history and project consistency memory.
  - Depends on: Task 2.
  - Validate with: repository/store tests against SQLite/libSQL test DB.

- [ ] Task 4: Implement Flux provider service
  - File: `contentflow_lab/api/services/flux_image_generation.py`
  - Action: Submit Flux generation/edit requests with prompt, dimensions, optional seed, output format, safety tolerance, and up to eight references; poll or resolve provider output; normalize provider errors.
  - User story link: Adds AI-native image generation without changing the app stack.
  - Depends on: Task 2.
  - Validate with: mocked HTTP tests for success, async polling, safety rejection, rate limit, invalid output, timeout, and missing API key.

- [ ] Task 5: Integrate Flux into profile-based generation
  - File: `contentflow_lab/api/routers/images.py`
  - Action: Extend `/api/images/generate-from-profile` or add a narrowly compatible endpoint so `image_provider: flux` generates via Flux, uploads via Bunny, persists history, and returns the existing response shape plus Flux metadata.
  - User story link: Keeps AI images inside the current Image Robot flow.
  - Depends on: Tasks 1, 3, and 4.
  - Validate with: API tests for profile resolution, Bunny upload, persisted history, and backward compatibility with Robolly/OpenAI.

- [ ] Task 6: Add guided Flux profiles
  - File: `contentflow_lab/api/services/image_profiles.py`
  - Action: Add built-in profiles for AI blog hero, AI social card, AI thumbnail, and AI post visual with `image_provider: flux`, guided base prompts, path types, and format defaults.
  - User story link: Prevents the feature from becoming an unguided playground.
  - Depends on: Task 5.
  - Validate with: profile listing tests and generated prompt snapshots.

- [ ] Task 7: Add project visual memory endpoints
  - File: `contentflow_lab/api/routers/images.py`
  - Action: Add authenticated endpoints to list/add/remove/approve project reference images or wire this through the generation store if a simpler endpoint set already exists.
  - User story link: Enables consistent recurring characters, products, and visual traits per project.
  - Depends on: Task 3.
  - Validate with: ownership tests, MIME/size validation tests, and cross-project rejection tests.

- [ ] Task 8: Prepare Flutter API integration contract
  - File: `contentflow_app/lib/data/services/api_service.dart`
  - Action: Add typed client methods for listing Flux-capable profiles, generating from a profile, reading project generation history, and selecting visual memory references.
  - User story link: Allows the app to consume the backend without a separate web playground.
  - Depends on: Task 5 and Task 7.
  - Validate with: Dart unit tests for request serialization, response parsing, and error mapping.

- [ ] Task 9: Document configuration and operations
  - File: `contentflow_lab/shipflow_data/technical/README.md`
  - Action: Document Flux env vars, Bunny dependency, safety/error behavior, and the V1 consistency model.
  - User story link: Makes the feature operable and debuggable.
  - Depends on: Tasks 4 and 5.
  - Validate with: docs review and config validation test if available.

## Acceptance Criteria

- Authenticated generation from a `flux` profile produces a Bunny CDN image URL for an owned project.
- Generated image history is durable and project-scoped.
- Reference-guided generation uses only approved references from the same project.
- Blog hero, social/OG card, thumbnail, and post visual profiles are available without exposing raw provider controls.
- Existing Robolly and OpenAI image flows still pass their tests and contracts.
- Provider failures are visible to the app as normalized errors.
- No anonymous generation or public demo path is introduced.
- Turso migration/ensure conclusion is explicitly recorded during implementation.

## Test Plan

- Python unit tests for model validation and profile provider selection.
- Python service tests with mocked Flux API responses.
- FastAPI route tests for auth, ownership, successful generation, provider failures, Bunny upload failures, and history persistence.
- Store tests for Turso/libSQL schema and project-scoped queries.
- Dart tests for API client parsing once Flutter integration starts.
- Manual smoke after implementation: create/select project, generate AI blog hero from profile, verify CDN URL, verify history, verify references are scoped.

## Rollout Plan

- Ship backend provider behind an environment/config gate.
- Enable built-in Flux profiles only when `BFL_API_KEY` or the chosen provider key is present.
- Keep existing Image Robot providers enabled.
- Release Flutter UI separately after backend contract passes `/sf-ready` and implementation verification.
- Monitor provider errors, generation latency, CDN upload failures, and storage history persistence.

## Security & Privacy

- Flux API keys remain server-side only.
- Reference images must be project-scoped and should not be sent to Flux unless the user intentionally uses a visual memory feature.
- Logs must include generation IDs and error categories, not raw base64 images or secrets.
- History stores prompts and image URLs, so access must be owner/project scoped.
- Safety rejection and moderation failures must not store unsafe generated content.

## Open Questions

- Which Flux variant is the default for production: stable `flux-2-pro`, latest preview, or a provider-abstracted alias?
- Should visual memory references be uploaded through an existing asset/capture path or through a new minimal Image Robot endpoint?
- Should generation be synchronous with polling timeout or queued as an async job for long-running provider calls?
- Do we need per-plan quotas in V1, or only cost/timing metadata for later billing?

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-05-11 13:15:23 UTC | sf-spec | GPT-5 Codex | Created draft spec from contentflowz Flux audit and user decisions. | Draft spec created. | /sf-ready shipflow_data/workflow/specs/SPEC-flux-ai-provider-image-robot-2026-05-11.md |

## Current Chantier Flow

sf-spec: draft created
sf-ready: pending
sf-start: pending
sf-verify: pending
sf-end: pending
sf-ship: pending

---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "contentflow"
created: "2026-05-11"
created_at: "2026-05-11 09:15:20 UTC"
updated: "2026-05-11"
updated_at: "2026-05-11 09:43:54 UTC"
status: draft
source_skill: sf-spec
source_model: "GPT-5 Codex"
scope: "feature"
owner: "Diane"
confidence: "medium"
user_story: "En tant que createur ContentFlow authentifie, je veux lancer un rendu Remotion depuis un contenu existant, afin d'obtenir une preview puis un MP4 local depuis l'app."
risk_level: "high"
security_impact: "yes"
docs_impact: "yes"
linked_systems:
  - contentflow_app
  - contentflow_lab
  - contentflow_remotion_worker
  - contentflowz/remotion-template
  - Turso jobs
  - Clerk auth
depends_on:
  - artifact: "contentflow_app/CLAUDE.md"
    artifact_version: "1.1.0"
    required_status: "reviewed"
  - artifact: "contentflow_lab/CLAUDE.md"
    artifact_version: "1.0.0"
    required_status: "reviewed"
  - artifact: "contentflowz/GUIDELINES.md"
    artifact_version: "unknown"
    required_status: "active"
  - artifact: "contentflowz/remotion-template/README.md"
    artifact_version: "unknown"
    required_status: "unknown"
  - artifact: "Remotion renderMedia docs"
    artifact_version: "2026-05-09"
    required_status: "official"
  - artifact: "Remotion bundle docs"
    artifact_version: "2026-05-09"
    required_status: "official"
supersedes: []
evidence:
  - "contentflowz/remotion-template/server/index.ts"
  - "contentflowz/remotion-template/server/render-queue.ts"
  - "contentflowz/remotion-template/remotion/QuizVideo.tsx"
  - "contentflow_lab/api/routers/reels.py"
  - "contentflow_lab/api/services/job_store.py"
  - "contentflow_lab/api/dependencies/auth.py"
  - "contentflow_lab/api/dependencies/ownership.py"
  - "contentflow_app/lib/presentation/screens/reels/reels_screen.dart"
  - "https://www.remotion.dev/docs/renderer/render-media"
  - "https://www.remotion.dev/docs/bundle"
  - "https://www.remotion.dev/docs/renderer/select-composition"
next_step: "/sf-spec Remotion render service integration"
---

## Title

Remotion render service integration

## Status

Draft. This spec defines the technical integration layer only. The user-facing `/reels` workflow is covered by `shipflow_data/workflow/specs/monorepo/reels-from-content-preview-workflow.md`.

## User Story

En tant que createur ContentFlow authentifie, je veux lancer un rendu Remotion depuis un contenu existant, afin d'obtenir une preview puis un MP4 local depuis l'app.

## Minimal Behavior Contract

ContentFlow accepte une demande de rendu pour un contenu existant appartenant a l'utilisateur courant, cree un job persistant, transforme ce contenu en props de composition Remotion, delegue le rendu a un worker Remotion local et expose un statut ainsi qu'une URL d'artefact local signee et courte duree quand le rendu est termine. Si le contenu est absent, n'appartient pas a l'utilisateur, n'a pas de corps exploitable, ou si le worker echoue, le job devient observable en erreur sans produire d'artefact annonce comme pret. Le cas facile a rater est la separation entre `preview` et `final`: un rendu final ne doit pas etre considere valide s'il reprend un ancien artefact preview ou un job d'un autre utilisateur.

## Success Behavior

- Given un utilisateur Clerk authentifie et un `content_id` appartenant a son projet actif, when the API receives a preview render request, then it creates a `jobs` row with `job_type=reel_render`, `status=queued`, `progress=0`, `render_mode=preview`, and the selected content metadata.
- Given the worker is reachable, when the lab API dispatches the job, then the worker renders an MP4 preview into the shared local render directory and the API returns status `completed`, `progress=100`, and a signed artifact URL with an explicit expiry.
- Given the preview has completed, when the client requests a final render for the same job family, then the API creates or updates a final render job and returns a final MP4 artifact endpoint after completion.
- Given a terminal job, when the user polls the job endpoint, then the response is stable and includes timestamps, mode, template id, status, progress, message, and artifact metadata when available.
- Proof of success is a local MP4 file under the configured render directory, a persisted job record, a successful API status response, and passing API tests with a fake worker.

## Error Behavior

- Missing or invalid bearer token returns `401` through existing `require_current_user`.
- A `content_id` outside the current user's projects returns `403` or `404` via `require_owned_content_record`; it must not leak title, path, metadata, or render status.
- Empty body, missing title, unsupported template id, unsupported render mode, or invalid duration returns `400` and does not dispatch the worker.
- Worker unavailable, timeout, invalid worker response, Remotion failure, or disk write failure marks the job `failed` with a sanitized message and no ready artifact URL.
- Cancellation of a queued or in-progress job marks the job `cancelled` if the worker confirms cancellation; if cancellation fails, the job remains observable and can still complete or fail.
- Expired, malformed, or job-mismatched artifact tokens return `403` and do not reveal whether the file exists.
- File paths supplied by requests are ignored. Artifact paths are generated server-side from job ids and safe extensions only.
- No secret, bearer token, local absolute content path, or raw worker token is logged or returned.

## Problem

The `contentflowz/remotion-template` prototype proves that Remotion can render a vertical MP4, but it is a standalone Node/Express server with an in-memory queue, Telegram side effects, and a quiz-specific schema. ContentFlow's production backend is FastAPI with Clerk auth, Turso-backed job persistence, project ownership checks, and Flutter clients. Copying the prototype directly would bypass existing security, persistence, and app patterns.

## Solution

Introduce a small isolated Remotion worker as a companion service and make `contentflow_lab` the only authenticated public API. The lab API validates the content and user, persists job state in the existing `JobStore`, dispatches sanitized render props to the worker over an internal HTTP contract, and serves local artifacts from a configured shared render directory.

## Scope In

- Create a new local service directory `contentflow_remotion_worker/` derived from the Remotion prototype, with Node, TypeScript, React, Remotion, and a minimal HTTP API.
- Add a `ReelFromContent` Remotion composition that accepts structured content props, not raw arbitrary files.
- Support two render modes: `preview` and `final`.
- Use vertical 9:16 H.264 MP4 output for MVP.
- Use local shared artifact storage through `CONTENTFLOW_RENDER_DIR`.
- Add lab API models and endpoints under `/api/reels/render-jobs`.
- Use existing Clerk auth and content ownership helpers before dispatching any render.
- Use existing `api.services.job_store.job_store` for persistent job state.
- Add a lab-side Remotion worker client using `httpx.AsyncClient`.
- Add job polling that refreshes worker status when a job is not terminal.
- Add signed local artifact serving through lab API, not direct public worker access. Creation and polling endpoints stay Clerk-authenticated; media playback uses a short-lived signed artifact URL because Flutter Web video playback cannot rely on bearer headers.
- Add cancellation support for queued or in-progress jobs.
- Add tests for API validation, ownership behavior, worker error mapping, and artifact path safety.

## Scope Out

- CDN or object storage upload.
- Cloud rendering, Remotion Lambda, Railway deployment, or autoscaling.
- Social publishing of the MP4.
- Telegram delivery from the prototype.
- A full timeline editor.
- Multi-template marketplace.
- Audio generation, voiceover, captions, or music.
- Browser-embedded Remotion Player in Flutter.
- New Turso tables beyond the existing `jobs` table.

## Constraints

- `contentflow_lab` remains the public API boundary. The Remotion worker is internal and must require an internal token if reachable over HTTP.
- The worker and lab API are co-located for MVP and share `CONTENTFLOW_RENDER_DIR`.
- Local files are acceptable for MVP; production object storage is a later migration.
- The API must stay compatible with degraded app behavior: render creation is not offline-queued and should fail clearly when backend or worker is unavailable.
- The worker must not bundle Remotion on every render. The official Remotion docs call repeated `bundle()` per video an anti-pattern.
- `inputProps` must be passed consistently to both `selectComposition()` and `renderMedia()`.
- Artifact serving must use allowlisted paths under `CONTENTFLOW_RENDER_DIR`.
- Artifact playback URLs must be signed, scoped to `job_id` and `render_mode`, and short-lived. They must not require a browser video element to send Clerk bearer headers.
- A Turso migration is not required for MVP because the existing `jobs` table stores extra JSON data.

## Dependencies

- `contentflow_lab`: FastAPI, Clerk auth, ownership helpers, `JobStore`, `httpx`.
- `contentflow_remotion_worker`: `@remotion/bundler`, `@remotion/renderer`, `remotion`, React, TypeScript, Express or a similarly small Node HTTP server.
- Local environment variables:
  - `REMOTION_WORKER_URL`
  - `REMOTION_WORKER_TOKEN`
  - `CONTENTFLOW_RENDER_DIR`
  - `RENDER_ARTIFACT_SIGNING_KEY`
  - `REMOTION_SERVE_URL` optional, for a prebuilt bundle.
- Fresh external docs checked:
  - `fresh-docs checked`: Remotion `renderMedia()` official docs confirm programmatic rendering, `outputLocation`, `inputProps`, `onProgress`, and `cancelSignal`.
  - `fresh-docs checked`: Remotion `bundle()` official docs confirm that a bundle can render multiple parametrized videos and should not be called for every video.
  - `fresh-docs checked`: Remotion `selectComposition()` official docs confirm composition selection from a bundle and the need for JSON `inputProps`.

## Invariants

- Every render job is tied to `user_id`, `project_id`, `content_id`, `template_id`, and `render_mode`.
- `preview` and `final` artifacts are separate files with separate metadata.
- A user can only see, poll, cancel, or download jobs whose `user_id` matches their Clerk user and whose content is still in an owned project.
- Artifact URLs are signed and expire; the signature payload includes `job_id`, `render_mode`, `artifact_path_hash`, and expiry.
- Worker endpoints never become a public user-facing API.
- Job status values are normalized by lab API: `queued`, `in_progress`, `completed`, `failed`, `cancelled`.
- Completion requires an existing MP4 file with non-zero byte size under `CONTENTFLOW_RENDER_DIR`.
- Worker errors are sanitized before storage and response.

## Links & Consequences

- `contentflow_app` will consume the new endpoints in the follow-up workflow spec.
- `contentflow_lab/api/routers/reels.py` currently handles Instagram import; render endpoints should be added in a separate router module to keep responsibilities readable.
- `contentflow_lab/api/main.py` and `contentflow_lab/api/routers/__init__.py` must include the new router.
- Existing `JobStore.ensure_table()` remains sufficient; no new DB migration is required for this spec.
- Local render files need a retention policy to avoid unbounded disk growth.
- Render output URLs will be signed API URLs, not permanent CDN URLs.

## Documentation Coherence

- Update `contentflow_lab/README.md` or `contentflow_lab/ENVIRONMENT_SETUP.md` with the worker URL, token, render directory, and local startup steps.
- Add `contentflow_remotion_worker/README.md` with install, dev, render, and test commands.
- Add a short note in `contentflow_app/README.md` only after the app workflow spec is implemented.
- Changelog entry required for new `/api/reels/render-jobs` API contract.

## Edge Cases

- Content record exists but body cannot be read from disk or cache.
- Content body is too long for the template and must be summarized or truncated deterministically.
- Content contains markdown, HTML, code blocks, emoji, or unsupported characters.
- Worker finishes but output file is missing or zero bytes.
- Worker returns completed for an unknown external render id.
- API restarts while worker render continues; next poll must recover by checking stored worker id.
- User loses access to the project after job creation but before artifact download.
- Signed artifact URL expires while the preview player is open; the app must refresh job status to receive a fresh URL.
- Concurrent preview and final requests for the same content should not overwrite each other's file.
- Disk full or render directory missing.
- Path traversal attempt through job id or artifact file name.

## Implementation Tasks

- [ ] Tache 1: Scaffold the isolated Remotion worker package.
  - Fichier: `contentflow_remotion_worker/package.json`
  - Action: Create a Node/TypeScript package based on `contentflowz/remotion-template/package.json`, keeping Remotion dependencies and removing Telegram-specific dependencies unless used nowhere else.
  - User story link: Provides the render engine without replacing the FastAPI stack.
  - Depends on: None.
  - Validate with: `npm install` and `npm run lint` from `contentflow_remotion_worker`.
  - Notes: Keep this out of `contentflowz/`; that directory remains inspiration/prototype material.

- [ ] Tache 2: Port the Remotion root and add a content-based composition.
  - Fichier: `contentflow_remotion_worker/remotion/Root.tsx`
  - Action: Register `ReelFromContent` with 1080x1920, 30fps, and zod-validated props.
  - User story link: Produces vertical reels from ContentFlow content.
  - Depends on: Tache 1.
  - Validate with: `npm run remotion:studio` and a sample props JSON.
  - Notes: Do not keep quiz-only assumptions as the primary composition.

- [ ] Tache 3: Implement worker render API and local artifact writes.
  - Fichier: `contentflow_remotion_worker/server/index.ts`
  - Action: Add `POST /renders`, `GET /renders/:workerJobId`, `DELETE /renders/:workerJobId`, and internal artifact metadata. Use `outputLocation` instead of in-memory buffers for MVP.
  - User story link: Lets lab create and track preview/final MP4 renders.
  - Depends on: Tache 2.
  - Validate with: Curl a sample render and confirm a non-empty MP4 under `CONTENTFLOW_RENDER_DIR`.
  - Notes: Require `REMOTION_WORKER_TOKEN` on non-health endpoints.

- [ ] Tache 4: Add worker path safety and retention helpers.
  - Fichier: `contentflow_remotion_worker/server/render-storage.ts`
  - Action: Generate safe output paths from server-side ids, validate all paths stay under `CONTENTFLOW_RENDER_DIR`, and expose a cleanup helper for old artifacts.
  - User story link: Prevents unsafe local file exposure.
  - Depends on: Tache 3.
  - Validate with: Unit tests for path traversal attempts and extension allowlist.
  - Notes: Allowed output extension for MVP is `.mp4`.

- [ ] Tache 5: Define lab API request/response models.
  - Fichier: `contentflow_lab/api/models/reel_render.py`
  - Action: Add Pydantic models for create preview, create final, job response, artifact metadata, and cancellation response.
  - User story link: Creates a stable contract for the Flutter app.
  - Depends on: None.
  - Validate with: `python -m compileall api/models/reel_render.py`.
  - Notes: Include `content_id`, `template_id`, `render_mode`, `duration_seconds`, `status`, `progress`, `artifact_url`, and `artifact_expires_at`.

- [ ] Tache 6: Add a lab-side Remotion worker client.
  - Fichier: `contentflow_lab/api/services/remotion_render_client.py`
  - Action: Wrap worker calls with internal token, timeout handling, sanitized error mapping, and response validation.
  - User story link: Keeps worker details outside routers.
  - Depends on: Tache 5.
  - Validate with: Unit tests using a mocked `httpx.AsyncClient`.
  - Notes: Do not log request bodies containing content text.

- [ ] Tache 7: Add signed artifact URL helper.
  - Fichier: `contentflow_lab/api/services/render_artifact_tokens.py`
  - Action: Implement HMAC signing and verification for artifact URLs using `RENDER_ARTIFACT_SIGNING_KEY`, scoped to job id, render mode, artifact path hash, and expiry.
  - User story link: Allows Flutter Web video playback without exposing public worker URLs or relying on bearer headers in the video element.
  - Depends on: Tache 5.
  - Validate with: Unit tests for valid token, expired token, wrong job id, wrong path hash, and malformed token.
  - Notes: Do not reuse `USER_SECRETS_MASTER_KEY`; use a dedicated signing env var.

- [ ] Tache 8: Add authenticated render endpoints.
  - Fichier: `contentflow_lab/api/routers/reel_renders.py`
  - Action: Implement `/api/reels/render-jobs`, `/api/reels/render-jobs/{job_id}`, `/api/reels/render-jobs/{job_id}/export`, `/api/reels/render-jobs/{job_id}/artifact`, and cancellation. Job create/poll/cancel endpoints require Clerk auth; artifact endpoint accepts a valid signed artifact token.
  - User story link: Public API for the app to create, poll, export, and download local videos.
  - Depends on: Taches 5, 6, and 7.
  - Validate with: Pytest API tests covering success, invalid input, unauthorized content, worker failure, and artifact safety.
  - Notes: Use `require_current_user`, `require_owned_content_record`, and `job_store` for non-artifact endpoints; use token verification plus stored job metadata for artifact reads.

- [ ] Tache 9: Register the new lab router.
  - Fichier: `contentflow_lab/api/routers/__init__.py`
  - Action: Export `reel_renders_router`.
  - User story link: Makes the API route available.
  - Depends on: Tache 8.
  - Validate with: `python -m compileall api/routers`.
  - Notes: Keep existing Instagram `reels_router` unchanged.

- [ ] Tache 10: Include the new router in FastAPI.
  - Fichier: `contentflow_lab/api/main.py`
  - Action: Import and include `reel_renders_router`.
  - User story link: Activates render endpoints.
  - Depends on: Tache 9.
  - Validate with: API startup and OpenAPI schema containing `/api/reels/render-jobs`.
  - Notes: No PM2 or production restart in agent work.

- [ ] Tache 11: Add tests.
  - Fichier: `contentflow_lab/tests/test_reel_renders.py`
  - Action: Test ownership, validation, worker error handling, status refresh, signed artifact token behavior, and artifact endpoint path safety.
  - User story link: Guards the security and reliability contract.
  - Depends on: Taches 5-10.
  - Validate with: `pytest tests/test_reel_renders.py`.
  - Notes: Use fake worker responses; do not require real Remotion in API tests.

- [ ] Tache 12: Document local setup.
  - Fichier: `contentflow_remotion_worker/README.md`
  - Action: Document env vars, commands, API examples, and local render directory behavior.
  - User story link: Makes the worker operable by a fresh agent or developer.
  - Depends on: Taches 1-4.
  - Validate with: Manual command copy review.
  - Notes: Include explicit statement that worker is internal and token-protected.

- [ ] Tache 13: Update lab backend docs.
  - Fichier: `contentflow_lab/README.md`
  - Action: Add a short "Reel render worker" section and link to the worker README.
  - User story link: Keeps backend run instructions coherent.
  - Depends on: Taches 8-12.
  - Validate with: Documentation review.
  - Notes: Include "Turso migration required: no, uses existing jobs table".

## Acceptance Criteria

- [ ] CA 1: Given an authenticated user and owned content with a readable body, when the user creates a preview render job, then the API returns `202` or `200` with a `job_id`, `status=queued`, and `render_mode=preview`.
- [ ] CA 2: Given a queued job and a reachable worker, when the job is polled until completion, then the API returns `status=completed`, `progress=100`, a signed `artifact_url`, and an `artifact_expires_at`.
- [ ] CA 3: Given a completed preview job, when the user requests final export, then a final render is created with `render_mode=final` and a separate final MP4 artifact.
- [ ] CA 4: Given a content id outside the user's projects, when render creation is requested, then the API returns `403` or `404` without content metadata.
- [ ] CA 5: Given empty content or unsupported template id, when render creation is requested, then the API returns `400` and no worker job is created.
- [ ] CA 6: Given the worker is down, when render creation or status refresh happens, then the job is marked `failed` or the response explains worker unavailability without crashing the API.
- [ ] CA 7: Given a malicious artifact path attempt or invalid artifact token, when the artifact endpoint is called, then the API rejects it and never reads outside `CONTENTFLOW_RENDER_DIR`.
- [ ] CA 8: Given a terminal failed job, when it is polled repeatedly, then the response stays failed with a sanitized message and no ready artifact URL.
- [ ] CA 9: Given an API restart after dispatch, when a non-terminal job with a worker id is polled, then lab refreshes status from the worker and persists the latest state.
- [ ] CA 10: Given a queued or in-progress job, when cancellation is requested by its owner, then the worker cancellation is attempted and the normalized job status becomes `cancelled` or remains observable with a clear failure message.

## Test Strategy

- Unit test worker storage helpers for safe path generation.
- Worker smoke test with sample props to generate a local MP4.
- Lab unit tests for Pydantic validation and worker client error mapping.
- Lab API tests with fake auth/current user and fake worker client.
- Manual local test: run FastAPI and worker, create a preview job from known content, poll, and download artifact.
- Regression check: existing `/api/reels/download` Instagram flow still imports and routes unchanged.
- Validation commands:
  - `python -m compileall api`
  - `pytest tests/test_reel_renders.py`
  - `npm run lint` in `contentflow_remotion_worker`
  - `curl` smoke test against local worker and lab API

## Risks

- High integration risk: Python API, Node worker, local filesystem, and Flutter consumer must agree on contracts.
- Security risk: local artifact serving can expose files if path validation is weak.
- Operational risk: local disk can fill up without cleanup.
- Reliability risk: worker queue state can diverge from persisted job state after restarts.
- Performance risk: Remotion renders are CPU-heavy and can block small hosts.
- Media auth risk: browser video playback cannot reliably attach Clerk bearer headers, so signed artifact URLs must be implemented carefully with short TTLs.
- Licensing/commercial risk: Remotion's commercial terms should be reviewed before production SaaS use.

## Execution Notes

- Read first:
  - `contentflowz/remotion-template/server/index.ts`
  - `contentflowz/remotion-template/server/render-queue.ts`
  - `contentflow_lab/api/services/job_store.py`
  - `contentflow_lab/api/dependencies/ownership.py`
  - `contentflow_lab/api/routers/reels.py`
- Implement foundation first: worker package, composition, worker API, then lab models/client/router.
- Keep Remotion code isolated in `contentflow_remotion_worker/`; do not add Node dependencies to `contentflow_lab/requirements`.
- Keep lab API as the auth and ownership gate. Do not expose worker URLs directly to Flutter.
- Use `outputLocation` for file output to avoid large in-memory buffers.
- Do not implement CDN, voiceover, captions, or social publishing in this chantier.
- Stop and reroute if worker and lab cannot share a local directory in the intended deployment environment; that requires an object-storage spec.

## Open Questions

None blocking for MVP. Deferred decisions are CDN storage, cloud rendering, retention duration, and production Remotion licensing.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-05-11 09:15:20 | sf-spec | GPT-5 Codex | Created spec from `contentflowz/remotion-template` and user decisions. | Draft saved. | /sf-ready remotion-render-service-integration |
| 2026-05-11 09:43:54 | sf-ready | GPT-5 Codex | Evaluated readiness gate for Remotion worker, FastAPI render jobs, signed local artifacts, and local storage. | Not ready: security/availability limits, artifact token contract, final render relationship, and retention policy need concrete decisions. | /sf-spec Remotion render service integration |

## Current Chantier Flow

- sf-spec: done
- sf-ready: not ready
- sf-start: not launched
- sf-verify: not launched
- sf-end: not launched
- sf-ship: not launched

Next command: `/sf-spec Remotion render service integration`

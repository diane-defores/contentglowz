---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "contentflow_app"
created: "2026-05-10"
created_at: "2026-05-10 22:48:42 UTC"
updated: "2026-05-11"
updated_at: "2026-05-11 05:26:00 UTC"
status: draft
source_skill: sf-spec
source_model: "GPT-5 Codex"
scope: feature
owner: "Diane"
user_story: "En tant que createur ContentFlow, je veux transformer une idee ou un angle en script video structure pour Short, Reel, TikTok, YouTube Shorts ou video generale, afin de preparer un contenu filmable et revisable sans encore produire la video finale."
risk_level: medium
security_impact: "yes"
docs_impact: "yes"
linked_systems:
  - "contentflow_app Flutter Angles"
  - "contentflow_app Flutter Reels"
  - "contentflow_app Flutter Editor"
  - "contentflow_app ContentItem model"
  - "contentflow_lab dispatch-pipeline"
  - "contentflow_lab ShortContentCrew"
  - "contentflow_lab template defaults"
  - "contentflow_lab status/content body versioning"
depends_on:
  - artifact: "shipflow_data/business/product.md"
    artifact_version: "1.0.0"
    required_status: "reviewed"
  - artifact: "shipflow_data/technical/architecture.md"
    artifact_version: "1.0.0"
    required_status: "reviewed"
  - artifact: "shipflow_data/technical/guidelines.md"
    artifact_version: "1.0.0"
    required_status: "reviewed"
  - artifact: "specs/SPEC-content-pipeline-unification.md"
    artifact_version: "1.0.0"
    required_status: "ready"
  - artifact: "specs/SPEC-content-editing-full-body-preview.md"
    artifact_version: "1.0.0"
    required_status: "ready"
  - artifact: "specs/SPEC-content-editor-multiformat.md"
    artifact_version: "0.1.0"
    required_status: "ready"
supersedes: []
evidence:
  - "User clarified on 2026-05-10 that the near-term goal is script creation, not real video generation."
  - "contentflow_app/specs/SPEC-content-pipeline-unification.md already defines a Short Pipeline with hook, timecoded script, platform targets, hashtags, CTA, and visual notes."
  - "contentflow_lab/agents/short/short_crew.py generates hook, script, duration_seconds, on_screen_text, hashtags, cta, visual_notes, and thumbnail_concept."
  - "contentflow_lab/api/routers/psychology.py dispatches target_format=short to ShortContentCrew and persists the script body."
  - "contentflow_lab/api/services/template_defaults.py includes a Short-form Video template with title, hook, script body, captions, hashtags, and thumbnail text."
  - "contentflow_app/lib/data/models/content_item.dart supports ContentType.videoScript, ContentType.reel, and ContentType.short with metadata helpers for platform, duration, and hashtags."
  - "contentflow_app/lib/presentation/screens/editor/editor_screen.dart is the current review/edit surface for generated content bodies."
  - "contentflow_app/lib/presentation/screens/reels/reels_screen.dart is currently a repurposing/download surface, not a script workbench."
next_step: "/sf-spec Video Script Creation Workbench"
---

# Title

Video Script Creation Workbench

## Status

Draft spec for a script-first video creation surface. The target is a practical workbench for creating, reviewing, and refining video scripts and short-form packages. It deliberately stops before real video rendering, video editing, timeline trimming, voiceover generation, caption burn-in, upload automation, or social publishing.

## User Story

En tant que createur ContentFlow, je veux transformer une idee ou un angle en script video structure pour Short, Reel, TikTok, YouTube Shorts ou video generale, afin de preparer un contenu filmable et revisable sans encore produire la video finale.

## Minimal Behavior Contract

When a creator starts from an idea, an angle, or a blank video-script request, ContentFlow must let them choose a video script format, target platform, duration, and creative constraints, generate or save a structured script package containing hook, timed script, on-screen text, visual notes, CTA, hashtags, and cover concept, then route that package into the normal review/editor lifecycle as an authoritative content body with safe metadata; if generation, validation, body persistence, or editor loading fails, the creator sees a recoverable error and no incomplete script is presented as ready to film. The easy edge case is mixing `video_script`, `short`, and `reel`: the UI may label them differently, but the saved content must remain one coherent script package and must not imply that a rendered video already exists.

## Success Behavior

- Given a creator opens the script workbench, when the page loads, then they can choose a script type: short vertical video, reel, TikTok, YouTube Shorts, or general video script.
- Given an existing angle is available, when the creator chooses "Create script", then the request reuses the angle title, hook, audience pain point, project, and creator voice context.
- Given the creator starts blank, when they enter a topic and constraints, then the workbench can still create a script request without requiring an existing angle.
- Given the target is a short-form platform, when the creator sets duration, then the UI constrains expected duration to platform-appropriate values and stores the selected value in metadata.
- Given generation succeeds, when the backend returns a package, then the app displays a structured preview with hook, timecoded script, on-screen text, visual notes, CTA, hashtags, and cover concept.
- Given the creator accepts the package, when it is persisted, then a `ContentItem` exists in review with `content_type` mapped consistently to `short` or `video_script`, full body saved through content body versioning, and metadata carrying platform, duration, hashtags, on-screen text, visual notes, CTA, and thumbnail concept.
- Given the creator edits the script from the review queue, when the editor opens, then it loads the full body through `contentDetailProvider` and shows relevant video/short metadata chips without falling back to preview text.
- Given the generated package contains structured fields, when it is converted into body text, then the body remains human-readable and filmable, not raw JSON unless explicitly shown as a debug fallback.
- Given the script is approved, when publish channels are not configured for real video output, then approval can proceed as content review state but the UI does not claim that a video was published.
- Given no video rendering exists, when the user opens Reels or Editor surfaces, then copy and labels stay script-first and do not promise automatic video creation.

## Error Behavior

- If the creator submits an empty topic and no source angle exists, block generation and show a field-level validation error.
- If a platform/duration combination is invalid, show the allowed duration range and keep the form state intact.
- If BYOK/OpenRouter runtime is required and missing, reuse the existing AI runtime error path and route the creator to Settings without creating a partial content record.
- If `dispatch-pipeline` returns an unsupported format or backend route error, keep the request editable and show a recoverable diagnostic.
- If the short crew returns malformed JSON or missing structured fields, save only after normalizing to a safe script body and mark missing metadata as absent rather than inventing values.
- If body persistence fails after generation, do not show the script as review-ready; keep the generated result visible for retry if it is available in memory.
- If metadata persistence succeeds but body save fails, the content must not be publishable because the full body is authoritative.
- If a user tries to treat an imported Instagram reel as a generated script, the Reels repurposing flow must stay separate unless a later import-to-script spec defines transcription and rights handling.
- If another user or project id is supplied, backend ownership checks remain authoritative and no cross-user script body or metadata is shown.
- If social/video publishing accounts are unavailable, approving the script must not trigger external video posting or imply a rendered media asset exists.

## Problem

ContentFlow already has pieces of a video-script system: short-form generation in `ShortContentCrew`, a multi-format dispatch route, content types for `video_script`, `short`, and `reel`, a template for short-form video scripts, review queue cards, and the generic editor. These pieces are not yet assembled into a clear product flow for "build me a script I can film." The current `/reels` page handles Instagram reel download/audio extraction, which is a different job. The risk is product confusion: users may see "Reels" and expect script creation or video building, while the actual reliable capability today is script generation and review.

## Solution

Create a dedicated script-first workbench that sits between Angles, Templates, ShortContentCrew, and the existing Editor/Review Queue. V1 produces structured script packages and persists them as reviewable text content with metadata; it does not render, edit, upload, or publish final video media.

## Scope In

- A Flutter workbench entry point for video script creation, likely under `/reels` or a new `/video-scripts` route depending on navigation fit.
- Source modes: from existing angle, from blank topic, and from reusable template defaults.
- Format selection for `short`, `reel`, `tiktok`, `youtube_shorts`, and general `video_script`.
- Controls for platform, duration, tone, audience, CTA intent, filming style, and optional visual constraints.
- Backend request path using existing `dispatch-pipeline` for `short` where possible, with a narrow extension for general `video_script` if needed.
- Structured script package shape: title/caption, hook, timecoded script, on-screen captions/text, visual notes, CTA, hashtags, cover/thumbnail concept, duration, target platform.
- Human-readable body formatter for review/editor use.
- Metadata mapping into `ContentItem.metadata` and existing metadata chips.
- Review queue integration through existing content body versioning and status lifecycle.
- Tests for form validation, request mapping, body formatting, metadata parsing, editor load, and malformed generation fallback.
- Copy updates so "Reels" does not imply rendered video creation.

## Scope Out

- No video rendering, Remotion-style composition, FFmpeg montage, template-based video generation, or export of MP4.
- No timeline editor, trimming, scene drag-and-drop, caption burn-in, audio mixing, voice cloning, voiceover generation, or automatic subtitles.
- No real upload to TikTok, Instagram, YouTube, or LATE as a video asset.
- No transcription of existing Instagram reels into scripts.
- No rights management for third-party reel reuse.
- No new CDN storage, binary upload, or video asset table.
- No teleprompter in V1; it remains a follow-up once scripts are structured reliably.
- No replacement of the generic editor with a specialized rich document model.
- No new rich text package unless a later editor spec explicitly chooses one.

## Constraints

- Preserve the full-body invariant: generated script bodies must be loaded from the authoritative body endpoint before editing or publishing.
- Keep the canonical saved body plain text or Markdown-compatible text; structured metadata may live in `metadata`.
- Do not persist raw malformed LLM JSON as the default user-facing body if a normalized script view can be constructed.
- Use existing Riverpod providers and `ApiService`; no direct HTTP calls from widgets.
- Use existing auth and ownership boundaries on content records, project ids, and body endpoints.
- Keep external publish online-only and do not add media side effects.
- Avoid coupling this workbench to the Instagram reel downloader; repurposing/download and script creation are separate flows in V1.
- Keep labels honest: "script", "shot notes", "cover concept", not "generated video" or "published video".
- Fresh external docs verdict: `fresh-docs not needed` for V1 because it uses existing local Flutter/FastAPI/CrewAI integration points and does not add a new SDK, platform API, rendering engine, storage provider, or social publishing API.

## Dependencies

- App files:
  - `contentflow_app/lib/router.dart`
  - `contentflow_app/lib/presentation/screens/app_shell.dart`
  - `contentflow_app/lib/presentation/screens/reels/reels_screen.dart`
  - `contentflow_app/lib/presentation/screens/angles/angles_screen.dart`
  - `contentflow_app/lib/presentation/screens/editor/editor_screen.dart`
  - `contentflow_app/lib/presentation/screens/feed/content_card.dart`
  - `contentflow_app/lib/data/models/content_item.dart`
  - `contentflow_app/lib/data/services/api_service.dart`
  - `contentflow_app/lib/providers/providers.dart`
  - `contentflow_app/lib/l10n/app_localizations.dart`
- Backend files:
  - `contentflow_lab/api/routers/psychology.py`
  - `contentflow_lab/api/models/psychology.py`
  - `contentflow_lab/agents/short/short_crew.py`
  - `contentflow_lab/agents/short/prompts/short_form_writer.yaml`
  - `contentflow_lab/api/services/template_defaults.py`
  - `contentflow_lab/status/service.py`
- Existing specs:
  - `contentflow_app/specs/SPEC-content-pipeline-unification.md`
  - `contentflow_app/specs/SPEC-content-editing-full-body-preview.md`
  - `contentflow_app/specs/SPEC-content-editor-multiformat.md`
  - `contentflow_lab/specs/SPEC-dual-mode-ai-runtime-all-providers.md`
  - `contentflow_lab/specs/SPEC-strict-byok-llm-app-visible-ai.md`
- Test areas:
  - `contentflow_app/test/data/content_item_test.dart`
  - `contentflow_app/test/presentation/screens/editor/editor_screen_test.dart`
  - new app tests under `contentflow_app/test/presentation/screens/reels/` or `video_scripts/`
  - `contentflow_lab/tests/test_dispatch_pipeline_runtime.py`
  - `contentflow_lab/tests/test_ai_runtime_service.py`

## Invariants

- A script package is content, not media.
- Review-ready means the script body was persisted and can be loaded through the body endpoint.
- `content_preview` remains display-only and cannot become the editable script body.
- `short`, `reel`, and `video_script` labels may differ in UI, but metadata and body contracts must be coherent.
- No UI action in this chantier creates, uploads, or publishes an MP4.
- User-owned project and auth context remain mandatory for generated content records.
- Generated metadata is helpful but non-authoritative compared with the saved body.
- Malformed LLM output must degrade to recoverable text review, not broken UI or silent data loss.

## Links & Consequences

- Product: the app gains a concrete "prepare a video script" workflow before true video generation exists.
- Navigation: `/reels` may need to become a script workbench with a secondary "repurpose Instagram reel" action, or the app may add `/video-scripts` and keep `/reels` for imports. The implementation should choose the least confusing route and update labels accordingly.
- Data: no database migration is expected if metadata remains in existing JSON and body versions remain in existing content body storage.
- Backend: `dispatch-pipeline` currently maps `short` to `ShortContentCrew`; general `video_script` may require either a new target format or a wrapper that uses the template defaults.
- Editor: video scripts can continue using the universal editor, but script-specific metadata chips and preview formatting should not corrupt JSON-like short outputs.
- Reels downloader: existing Bunny/Instagram flow remains separate and may need copy cleanup so users do not confuse import/repurpose with script generation.
- Analytics: if event tracking exists for content creation by type, this feature should emit or preserve content type as `short` or `video_script`.
- Accessibility: form controls need labels, validation text, and keyboard-friendly progression.
- Security: prompt input is user content; do not log full prompts, generated body, API keys, cookies, or private project context in diagnostics.

## Documentation Coherence

- Update `contentflow_app/README.md` if app feature docs list creator tools or content formats.
- Update `contentflow_app/CHANGELOG.md` after implementation ships.
- Update `contentflow_app/shipflow_data/business/product.md` only if product positioning changes from "content review/prep" to explicitly include video script preparation.
- Update `contentflow_app/shipflow_data/technical/context-function-tree.md` if a new route, provider, or backend contract is introduced.
- Update `contentflow_site` marketing copy only after the workbench is implemented and verified; do not claim real video generation.
- Update localization strings for all new workbench labels, validation messages, and honest no-video copy.

## Edge Cases

- Existing angle has `content_type=video_script` but the workbench maps target format to `short`.
- User chooses YouTube Shorts with duration above platform constraint.
- Short crew returns valid script text but invalid JSON wrapper.
- Generated `hashtags` are a list in one path and a platform-keyed map in another path.
- `on_screen_text` is too long for compact cards.
- General video script has no hashtags or cover concept.
- Creator edits body manually and metadata becomes stale.
- Save body succeeds but metadata update fails.
- User opens editor directly after generation while pending list is stale.
- BYOK mode has no usable model key.
- Backend creates a content record but body save fails.
- User is offline after generation but before save.
- Project switch happens while a generation request is in flight.
- Reels downloader dependency is unavailable because `instagrapi` is isolated; script workbench must remain usable.

## Implementation Tasks

- [ ] Task 1: Confirm the route and naming decision.
  - File: `contentflow_app/lib/router.dart`
  - Action: Decide whether V1 uses `/reels` as the script workbench with repurposing as a secondary panel, or creates `/video-scripts` and keeps `/reels` for downloads; update route labels consistently.
  - User story link: Gives creators one obvious place to create scripts without confusing it with rendered video.
  - Depends on: None.
  - Validate with: route/widget smoke test and manual navigation check.
  - Notes: Prefer the least disruptive route, but copy must say "script" when no video is rendered.

- [ ] Task 2: Define the script package model and formatter.
  - File: `contentflow_app/lib/data/models/content_item.dart`
  - Action: Add typed helper parsing for script metadata fields such as hook, duration, platform, hashtags, on-screen text, visual notes, CTA, and cover concept; add a pure formatter if needed to convert package maps into Markdown-compatible body text.
  - User story link: Preserves a coherent, filmable script package through review and editing.
  - Depends on: Task 1.
  - Validate with: unit tests for metadata variants, malformed fields, and body formatting.
  - Notes: Keep raw body authoritative; metadata helps display and filtering.

- [ ] Task 3: Add app service method for video script generation.
  - File: `contentflow_app/lib/data/services/api_service.dart`
  - Action: Add or refine a method that sends topic/angle/project/format/platform/duration constraints to the existing dispatch route, maps errors through existing `ApiException`, and returns a normalized content item or generation preview.
  - User story link: Connects the workbench to real generation instead of a local mock.
  - Depends on: Task 2.
  - Validate with: service tests using mocked successful, malformed, missing-key, and route-unavailable responses.
  - Notes: Reuse existing `dispatchPipeline` if it already covers the request shape.

- [ ] Task 4: Tighten backend target-format contract for scripts.
  - File: `contentflow_lab/api/routers/psychology.py`
  - Action: Ensure `short` generation preserves structured fields in metadata and body; decide whether `video_script` should route to the short crew, template defaults, or a separate script branch for general videos.
  - User story link: Makes generated scripts stable across short and general video use cases.
  - Depends on: Task 3.
  - Validate with: backend tests for `target_format=short` and, if added, `target_format=video_script`.
  - Notes: Do not create duplicate content records in nested crews when dispatch-pipeline owns persistence.

- [ ] Task 5: Make ShortContentCrew output normalization explicit.
  - File: `contentflow_lab/agents/short/short_crew.py`
  - Action: Normalize output into a predictable dict with required and optional script-package fields, including safe fallbacks for non-JSON LLM output.
  - User story link: Prevents broken or raw model output from becoming the creator's script workbench result.
  - Depends on: Task 4.
  - Validate with: unit tests or focused agent tests for parsed JSON and raw-text fallback.
  - Notes: Avoid logging full generated scripts in exception paths.

- [ ] Task 6: Build the Flutter workbench UI.
  - File: `contentflow_app/lib/presentation/screens/reels/reels_screen.dart`
  - Action: Replace or extend the current single URL downloader screen with script creation controls: source/topic, format, platform, duration, tone, CTA, visual style, generate action, loading/error states, and result preview.
  - User story link: Gives creators the primary script creation experience.
  - Depends on: Tasks 1-3.
  - Validate with: widget tests for empty validation, successful generation preview, backend error, and no-video copy.
  - Notes: If keeping Instagram download, visually separate it as "Repurpose existing reel" and do not make it the default primary action.

- [ ] Task 7: Integrate from Angles into script creation.
  - File: `contentflow_app/lib/presentation/screens/angles/angles_screen.dart`
  - Action: Add or refine an action that opens the workbench or dispatches directly with selected angle context for `short`/`video_script`.
  - User story link: Lets users turn validated ideas into scripts quickly.
  - Depends on: Task 6.
  - Validate with: widget test or provider test proving angle title/type/project are passed.
  - Notes: Preserve existing article/newsletter/social dispatch behavior.

- [ ] Task 8: Improve script cards and editor metadata display.
  - File: `contentflow_app/lib/presentation/screens/feed/content_card.dart`
  - Action: Show concise script metadata on cards: platform, duration, hook or first line, and hashtags without overflowing compact/mobile layouts.
  - User story link: Makes generated script packages recognizable in the review queue.
  - Depends on: Task 2.
  - Validate with: content card widget tests for `short`, `reel`, and `video_script`.
  - Notes: Do not display long `on_screen_text` arrays directly on cards.

- [ ] Task 9: Preserve editor and publish behavior.
  - File: `contentflow_app/lib/presentation/screens/editor/editor_screen.dart`
  - Action: Ensure the universal editor opens script bodies from `contentDetailProvider`, displays script metadata chips, saves full body versions, and does not expose unsupported video actions.
  - User story link: Keeps creator review/control before any future filming or publishing step.
  - Depends on: Tasks 2 and 8.
  - Validate with: editor widget tests for a script item with body and metadata.
  - Notes: Teleprompter controls stay out of scope.

- [ ] Task 10: Add localization and documentation updates.
  - File: `contentflow_app/lib/l10n/app_localizations.dart`
  - Action: Add workbench labels, validation messages, no-video copy, and route labels in EN/FR.
  - User story link: Makes the script flow understandable and honest.
  - Depends on: UI copy from Tasks 6-9.
  - Validate with: widget tests finding labels/tooltips and manual FR/EN spot check.
  - Notes: Update README/changelog in the same implementation slice if user-facing behavior ships.

## Acceptance Criteria

- [ ] CA 1: Given a creator opens the script workbench, when the page renders, then the primary action is script creation and no UI text claims that a video file will be generated.
- [ ] CA 2: Given a blank topic is submitted, when no source angle is selected, then generation is blocked with a validation message.
- [ ] CA 3: Given a selected angle and `short` target, when the creator generates a script, then the backend creates one reviewable content record with a persisted full body.
- [ ] CA 4: Given the generated package includes hook, timecoded script, on-screen text, CTA, hashtags, visual notes, and cover concept, when the app shows the result, then these fields are visible in structured form before review.
- [ ] CA 5: Given the creator accepts the generated result, when they open the editor, then the editor body matches the full saved script body, not the preview.
- [ ] CA 6: Given YouTube Shorts or TikTok is selected, when duration exceeds the allowed range, then the app shows a constraint error and does not send the invalid request.
- [ ] CA 7: Given the short crew returns raw non-JSON text, when dispatch completes, then the system preserves it as a readable script body and marks missing optional metadata as absent.
- [ ] CA 8: Given body persistence fails, when generation otherwise succeeds, then no review-ready card is shown and the creator can retry without losing the visible generated text if still in session.
- [ ] CA 9: Given a script card appears in the feed, when displayed on mobile, then platform/duration/hook metadata does not overflow or hide approve/reject/edit actions.
- [ ] CA 10: Given a user approves a script with no video publishing channel, when approval completes, then the result is content-state approval only and no external video upload is attempted.
- [ ] CA 11: Given a user opens the existing Instagram reel download function, when it is available, then it is clearly labeled as repurposing/import and not as script generation.
- [ ] CA 12: Given another user's content id is supplied, when editor/detail endpoints are called, then backend ownership checks block access and cached script content is not shown.

## Test Strategy

- Unit test `ContentItem` metadata parsing for `short`, `reel`, and `video_script`.
- Unit test script body formatter with complete package, missing optional fields, malformed hashtags, and raw fallback.
- App service tests for successful dispatch, validation failure, backend route unavailable, missing OpenRouter key, and malformed response.
- Backend tests for `dispatch-pipeline` with `target_format=short` and any new `video_script` path.
- Widget tests for workbench validation, form state preservation after error, successful preview, and no-video wording.
- Widget tests for feed cards and editor metadata chips with compact script metadata.
- Manual QA on mobile and desktop widths for the workbench, review queue card, and editor.
- Regression check that article/newsletter/social dispatch still works.

## Risks

- Product confusion: users may still interpret "Reels" as video rendering. Mitigation: route/copy decision in Task 1 and explicit no-video copy.
- Data drift: metadata may not match edited body after manual edits. Mitigation: body remains authoritative and metadata is treated as display aid.
- LLM shape instability: generated output may not be valid JSON. Mitigation: normalization and raw-text fallback.
- Backend duplication: nested crew status writes can create duplicate records. Mitigation: keep `create_content_record=False` in dispatch-owned paths and test it.
- Security/privacy: prompts may include private project context. Mitigation: do not log full prompts, scripts, user keys, or private project data.
- Scope creep into video creation. Mitigation: explicit Scope Out and no media storage/rendering tasks.

## Execution Notes

- Read first: `contentflow_app/specs/SPEC-content-pipeline-unification.md`, `contentflow_lab/api/routers/psychology.py`, `contentflow_lab/agents/short/short_crew.py`, `contentflow_app/lib/presentation/screens/reels/reels_screen.dart`, and `contentflow_app/lib/presentation/screens/editor/editor_screen.dart`.
- Implement foundations before UI: package model/formatter, service contract, backend normalization, then Flutter workbench.
- Avoid new packages for V1; use existing Flutter/Riverpod/Dio/FastAPI patterns.
- Do not touch binary upload, CDN storage, Instagram cookies, FFmpeg, or native capture code for script creation.
- Stop and reroute to a new spec if the work requires MP4 rendering, transcription of third-party reels, social video upload, teleprompter mode, or a dedicated document editor model.
- Validation commands likely include `flutter test` targeted under `contentflow_app` and focused backend `pytest` tests under `contentflow_lab`.
- Turso migration expected: no, because the intended implementation uses existing content records, body versions, and metadata JSON. Re-evaluate only if metadata cannot fit the existing status model.

## Open Questions

- None blocking for this draft. Implementation may still choose between reusing `/reels` or adding `/video-scripts`; Task 1 makes that an explicit product/navigation decision before code.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-05-10 22:48:42 UTC | sf-spec | GPT-5 Codex | Created the script-first video workbench spec from repo investigation and user clarification. | Draft spec saved. | /sf-ready video script creation workbench |
| 2026-05-11 05:26:00 UTC | sf-ready | GPT-5 Codex | Evaluated readiness before `/sf-start`. | Not ready: route/format contract, generation preview versus persistence flow, security abuse bounds, and dependency metadata need spec decisions. | /sf-spec Video Script Creation Workbench |

## Current Chantier Flow

- sf-spec: done, draft saved in `contentflow_app/specs/SPEC-video-script-creation-workbench.md`.
- sf-ready: not ready on 2026-05-11; route/format contract, generation persistence flow, and security requirements need spec updates.
- sf-start: blocked until `/sf-ready` passes.
- sf-verify: not launched.
- sf-end: not launched.
- sf-ship: not launched.

Next command: `/sf-spec Video Script Creation Workbench`.

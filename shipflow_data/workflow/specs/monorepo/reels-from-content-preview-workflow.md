---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "contentflow"
created: "2026-05-11"
created_at: "2026-05-11 09:15:20 UTC"
updated: "2026-05-11"
updated_at: "2026-05-11 09:46:04 UTC"
status: draft
source_skill: sf-spec
source_model: "GPT-5 Codex"
scope: "feature"
owner: "Diane"
confidence: "medium"
user_story: "En tant que createur ContentFlow authentifie, je veux transformer un contenu existant en reel depuis l'ecran Reels, afin de previsualiser puis exporter un MP4 local."
risk_level: "high"
security_impact: "yes"
docs_impact: "yes"
linked_systems:
  - contentflow_app
  - contentflow_lab
  - contentflow_remotion_worker
  - Clerk auth
  - active project selection
depends_on:
  - artifact: "shipflow_data/workflow/specs/monorepo/remotion-render-service-integration.md"
    artifact_version: "0.1.0"
    required_status: "ready"
  - artifact: "contentflow_app/CLAUDE.md"
    artifact_version: "1.1.0"
    required_status: "reviewed"
  - artifact: "contentflow_lab/CLAUDE.md"
    artifact_version: "1.0.0"
    required_status: "reviewed"
  - artifact: "pub.dev video_player"
    artifact_version: "2.11.1"
    required_status: "official"
supersedes: []
evidence:
  - "contentflow_app/lib/presentation/screens/reels/reels_screen.dart"
  - "contentflow_app/lib/data/services/api_service.dart"
  - "contentflow_app/lib/providers/providers.dart"
  - "contentflow_app/lib/data/models/content_item.dart"
  - "contentflow_app/lib/router.dart"
  - "contentflow_lab/api/routers/reels.py"
  - "shipflow_data/workflow/specs/monorepo/remotion-render-service-integration.md"
  - "https://pub.dev/packages/video_player"
next_step: "/sf-spec Reels from existing content preview workflow"
---

## Title

Reels from existing content preview workflow

## Status

Draft. sf-ready verdict 2026-05-11: not ready. This spec depends on `shipflow_data/workflow/specs/monorepo/remotion-render-service-integration.md`, which is not ready; it should not be implemented until the render API contract is ready and the app-level gaps from the readiness report are resolved.

## User Story

En tant que createur ContentFlow authentifie, je veux transformer un contenu existant en reel depuis l'ecran Reels, afin de previsualiser puis exporter un MP4 local.

## Minimal Behavior Contract

Dans `/reels`, ContentFlow affiche un parcours "Create from content" ou l'utilisateur choisit un contenu de son projet actif, configure quelques options simples, lance une preview, voit le statut du job, lit la preview video dans l'app via une URL d'artefact signee, puis lance l'export final seulement apres une preview terminee. Si le contenu manque, si l'utilisateur est hors ligne, si le rendu echoue, ou si l'artefact video ne peut pas etre lu, l'ecran garde un etat recuperable avec une action de retry ou un message clair. Le cas facile a rater est la lecture video Flutter Web: la preview doit utiliser une URL reseau API signee, pas un `VideoPlayerController.file` ni une URL qui exige un bearer header.

## Success Behavior

- Given an authenticated user with an active project and existing content, when they open `/reels`, then they can switch between the current Instagram import flow and the new create-from-content flow.
- Given content is selected and options are valid, when the user clicks preview, then the app creates a preview render job through the lab API and shows polling progress.
- Given the preview job completes, when the app receives a signed `artifact_url`, then it displays an inline vertical video preview with play/pause controls and enables final export.
- Given final export completes, when the app receives the final artifact URL, then it shows the final MP4 status and an open/download action using existing URL-launch behavior.
- Proof of success is a working `/reels` flow, app tests for state transitions, API method tests with fake responses, and a manual local preview using the render service.

## Error Behavior

- If there is no active project or no available content, the screen shows an empty state and disables preview creation.
- If selected content has no body, the API returns validation failure and the screen shows a message telling the user to sync or open the content detail first.
- If the user is offline or the lab API is unavailable, preview creation fails immediately; render jobs are not queued offline.
- If polling fails once, the UI can retry; if repeated polling fails or the API returns failed, the job card shows a failed state and a retry action.
- If `video_player` cannot initialize the preview URL, the UI shows an open-in-browser fallback using `url_launcher`.
- If the signed artifact URL expires, the UI refreshes job status to obtain a new signed URL before telling the user the preview failed.
- If a job belongs to a different user/project, the API denies it and the app shows a generic unavailable message without leaking details.
- If the user changes active project while a job is in progress, the UI stops mutating the old project context and requires the user to restart from the new project.

## Problem

`ReelsScreen` currently supports only Instagram reel download and audio extraction. It does not let ContentFlow users turn their own articles, posts, scripts, or shorts into a video output. The app already has content lists, active project selection, and status/content APIs, so the first Remotion-powered user feature should extend `/reels` instead of introducing a separate tool surface.

## Solution

Refactor `/reels` into a two-tab workspace: "Create from content" for ContentFlow-generated reels and "Import Instagram" for the existing download flow. The new tab uses existing content providers, calls the render job API from `shipflow_data/workflow/specs/monorepo/remotion-render-service-integration.md`, polls job status, previews the returned MP4 through `video_player`, and exposes final export only after preview succeeds.

## Scope In

- Add a "Create from content" tab to `ReelsScreen`.
- Preserve the existing Instagram download flow in a second tab.
- Let the user select content from the active project's pending and historical content lists.
- MVP options:
  - template id: `content-summary-v1`
  - aspect ratio: fixed vertical 9:16
  - duration: 30, 45, or 60 seconds
  - render mode: preview first, final second
- Add app models for render job status and artifact metadata.
- Add `ApiService` methods for create preview, poll status, create final export, and cancel.
- Add Riverpod state for selected content, selected duration, active job, and polling lifecycle.
- Add inline video preview using `video_player` and a network URL.
- Add fallback "Open preview" or "Open final MP4" action using `url_launcher`.
- Add localized strings used by the new flow.
- Add Flutter tests for empty, loading, failed, preview complete, and final complete states.

## Scope Out

- Full video editor or timeline editing.
- Drag/drop scene ordering.
- Manual caption timing.
- Audio, voiceover, or music selection.
- CDN upload or permanent hosting.
- Mobile local file save/share sheet.
- Posting directly to TikTok, Instagram, or YouTube.
- Template marketplace.
- Offline job creation or replay.
- Replacing the existing Instagram import flow.

## Constraints

- Follow existing Flutter patterns: Riverpod providers, `ApiService`, `AppErrorView`, `showDiagnosticSnackBar`, `ProjectPickerAction`, and `context.tr`.
- Render creation is online-only and must not use the offline write queue.
- Preview video uses a signed API artifact URL through `VideoPlayerController.networkUrl`.
- Do not use `VideoPlayerController.file` for web.
- Do not hardcode a user id like the existing `downloadReel(userId: 'current')` pattern in the new render flow; rely on bearer auth and backend ownership.
- Keep the first UX compact and utilitarian inside `/reels`; no landing page or marketing copy.
- Final export is disabled until preview status is `completed`.
- No Turso migration is required by this app workflow if `shipflow_data/workflow/specs/monorepo/remotion-render-service-integration.md` keeps using the existing `jobs` table.

## Dependencies

- Ready API contract from `shipflow_data/workflow/specs/monorepo/remotion-render-service-integration.md`.
- `contentflow_app` dependencies already present: Dio, Riverpod, GoRouter, url_launcher.
- New Flutter dependency: `video_player: ^2.11.1`.
- Fresh external docs checked:
  - `fresh-docs checked`: pub.dev `video_player` confirms Android, iOS, macOS, and web support and shows `VideoPlayerController.networkUrl`.
  - `fresh-docs checked`: pub.dev `video_player` warns that web does not support `VideoPlayerController.file`, which shapes the preview implementation.

## Invariants

- Only authenticated users can create render jobs, via existing `ApiService` auth token injection.
- Content shown in the selector must be scoped to the active project when `activeProjectIdProvider` is set.
- The selected content id is the only content identifier sent to the render API; the app does not send raw full content body for rendering.
- Preview state and final export state are separate.
- The UI never marks an MP4 ready until the API job is `completed` and has a signed `artifact_url`.
- Changing active project clears selected content and current draft render state.
- Existing Instagram import behavior remains available and testable.

## Links & Consequences

- `contentflow_app/lib/presentation/screens/reels/reels_screen.dart` will become larger unless split into child widgets.
- `contentflow_app/lib/data/services/api_service.dart` gains render job methods.
- `contentflow_app/lib/providers/providers.dart` gains state/polling providers or a notifier for the render workflow.
- `contentflow_app/pubspec.yaml` changes with `video_player`.
- `contentflow_app/lib/l10n/app_localizations.dart` needs new strings.
- `contentflow_lab` must already expose `/api/reels/render-jobs`; otherwise the app feature stays blocked.
- Web preview depends on the API serving MP4 with a browser-compatible codec and signed URL behavior that does not require bearer headers in the video element.

## Documentation Coherence

- Update `contentflow_app/README.md` with a short note that the Reels create-from-content flow requires the Remotion worker and lab API env vars.
- Update lab docs through the integration spec, not this app spec.
- Add changelog entry for the new user-facing `/reels` workflow after implementation.
- Support docs should say local MP4 links are local/dev artifacts until CDN storage is added.

## Edge Cases

- Active project is not selected.
- Active project changes after content selection.
- Pending and historical providers return duplicate content ids.
- Selected content exists in cached app state but backend rejects it because access changed.
- Preview completes but video player cannot decode or load the MP4.
- API returns completed job with missing artifact URL.
- API returns completed job with an expired artifact URL.
- User starts preview, navigates away, then returns.
- User clicks preview multiple times quickly.
- User cancels a job while polling request is in flight.
- Browser blocks autoplay; preview must still show a play control.
- Very long titles or content summaries overflow compact cards.

## Implementation Tasks

- [ ] Tache 1: Add render job models.
  - Fichier: `contentflow_app/lib/data/models/reel_render.dart`
  - Action: Define `ReelRenderJob`, `ReelRenderArtifact`, and enum parsing for normalized job statuses.
  - User story link: Lets the app reason about preview and final render states.
  - Depends on: Ready API response schema from `shipflow_data/workflow/specs/monorepo/remotion-render-service-integration.md`.
  - Validate with: Dart unit tests for JSON parsing, missing optional fields, and unknown status fallback.
  - Notes: Keep raw `Map<String, dynamic>` only for forward-compatible metadata.

- [ ] Tache 2: Add render API methods.
  - Fichier: `contentflow_app/lib/data/services/api_service.dart`
  - Action: Add methods to create preview jobs, fetch render job status, start final export, and cancel jobs under `/api/reels/render-jobs`.
  - User story link: Connects `/reels` to the lab render API.
  - Depends on: Tache 1.
  - Validate with: Service tests using mocked Dio or existing API test pattern.
  - Notes: Do not add offline queue handling for these methods.

- [ ] Tache 3: Add render workflow state provider.
  - Fichier: `contentflow_app/lib/providers/providers.dart`
  - Action: Add a notifier/provider that stores selected content id, duration, current preview job, current final job, and polling lifecycle.
  - User story link: Keeps the multi-step preview/export flow consistent.
  - Depends on: Tache 2.
  - Validate with: Provider tests for preview start, poll completion, failure, cancel, and project-change reset.
  - Notes: Poll every 2 seconds while non-terminal; stop polling on dispose or project change.

- [ ] Tache 4: Add video preview widget.
  - Fichier: `contentflow_app/lib/presentation/screens/reels/reel_preview_player.dart`
  - Action: Implement an inline 9:16 preview using `video_player` with `VideoPlayerController.networkUrl`, play/pause, loading, expired-URL refresh, error, and open fallback.
  - User story link: Satisfies the preview requirement before final export.
  - Depends on: Tache 1.
  - Validate with: Widget test for loading/error states and manual browser playback.
  - Notes: Avoid `VideoPlayerController.file`.

- [ ] Tache 5: Add `video_player` dependency.
  - Fichier: `contentflow_app/pubspec.yaml`
  - Action: Add `video_player: ^2.11.1`.
  - User story link: Enables in-app MP4 preview.
  - Depends on: Tache 4 can be drafted before this but cannot compile without it.
  - Validate with: `flutter pub get`, `flutter analyze`.
  - Notes: Check generated lockfile change during implementation.

- [ ] Tache 6: Refactor Reels screen into tabs.
  - Fichier: `contentflow_app/lib/presentation/screens/reels/reels_screen.dart`
  - Action: Replace the single Instagram form with a tabbed screen containing "Create from content" and "Import Instagram"; preserve existing import behavior.
  - User story link: Makes the new feature discoverable at `/reels` without deleting current tooling.
  - Depends on: Taches 1-4.
  - Validate with: Widget tests that both tabs render and existing Instagram validation still works.
  - Notes: Split child widgets if the file becomes hard to read.

- [ ] Tache 7: Implement content selector and options UI.
  - Fichier: `contentflow_app/lib/presentation/screens/reels/reels_screen.dart`
  - Action: Use `pendingContentProvider`, `contentHistoryProvider`, and `activeProjectIdProvider` to show selectable content cards plus duration segmented control.
  - User story link: Lets the user choose what content becomes a reel.
  - Depends on: Tache 6.
  - Validate with: Widget test for empty state, duplicate id dedupe, selection, and disabled preview button.
  - Notes: Include title, type, status, and short summary; keep cards compact.

- [ ] Tache 8: Implement preview and final export actions.
  - Fichier: `contentflow_app/lib/presentation/screens/reels/reels_screen.dart`
  - Action: Wire buttons to provider actions, show progress, render preview player on completion, enable final export only after preview completion, and show final MP4 action on completion.
  - User story link: Completes the user workflow.
  - Depends on: Taches 3, 4, 7.
  - Validate with: Widget/provider tests for button states and terminal statuses.
  - Notes: Use `showDiagnosticSnackBar` for failures.

- [ ] Tache 9: Add localized strings.
  - Fichier: `contentflow_app/lib/l10n/app_localizations.dart`
  - Action: Add strings for tab labels, empty states, render statuses, preview/export buttons, retry/cancel, and video preview errors.
  - User story link: Keeps app copy consistent with current localization approach.
  - Depends on: Taches 6-8.
  - Validate with: `flutter analyze` and spot check rendered labels.
  - Notes: Keep English keys compatible with `context.tr` usage.

- [ ] Tache 10: Add Flutter tests.
  - Fichier: `contentflow_app/test/reels_from_content_test.dart`
  - Action: Cover no content, content selection, preview loading, preview completed, preview failed, final export enabled, and project-change reset.
  - User story link: Protects the main user flow.
  - Depends on: Taches 1-9.
  - Validate with: `flutter test test/reels_from_content_test.dart`.
  - Notes: Mock API/provider responses; do not require real Remotion.

- [ ] Tache 11: Update app docs.
  - Fichier: `contentflow_app/README.md`
  - Action: Add local prerequisites for the Reels render workflow and point to the lab/worker setup docs.
  - User story link: Makes the feature reproducible locally.
  - Depends on: Taches 1-10 and integration spec docs.
  - Validate with: Documentation review.
  - Notes: State that local MP4 storage is an MVP limitation.

## Acceptance Criteria

- [ ] CA 1: Given a user opens `/reels`, when the page loads, then they see both "Create from content" and "Import Instagram" flows.
- [ ] CA 2: Given no active project content exists, when the user opens "Create from content", then an empty state is shown and preview is disabled.
- [ ] CA 3: Given content exists in the active project, when the user selects one item and a duration, then the preview action becomes enabled.
- [ ] CA 4: Given the user starts preview, when the API returns a queued job, then the UI shows progress and polls until terminal status.
- [ ] CA 5: Given preview completes with a signed artifact URL, when the job status updates, then the inline video preview appears and final export becomes enabled.
- [ ] CA 6: Given preview fails, when the job status updates, then the UI shows a failed state with retry and final export remains disabled.
- [ ] CA 7: Given final export completes, when the job status updates, then the UI shows a final MP4 action.
- [ ] CA 8: Given the video player cannot initialize the preview, when an error occurs, then the UI shows an open fallback instead of a blank player.
- [ ] CA 9: Given the active project changes, when the provider observes the new project, then selected content and render state reset.
- [ ] CA 10: Given the user switches to "Import Instagram", when they submit a valid URL, then the existing download flow still calls `downloadReel` and displays the result card.

## Test Strategy

- Model parsing tests for `ReelRenderJob`.
- Provider tests for preview lifecycle, final lifecycle, cancellation, retry, and project reset.
- Widget tests for `/reels` tab layout, empty state, button enablement, status rendering, and video preview error fallback.
- Manual local browser test against the integration spec worker: create preview, play MP4, export final, open final URL.
- Regression test or manual check for existing Instagram import.
- Validation commands:
  - `flutter pub get`
  - `flutter analyze`
  - `flutter test test/reels_from_content_test.dart`
  - Optional web smoke: `./build.sh --serve` in `contentflow_app`

## Risks

- High cross-domain risk because the user flow depends on API, worker, local file serving, and Flutter playback.
- UX risk if preview generation is slow; progress states must make waiting clear.
- Web playback risk if local MP4 responses lack browser-compatible headers or codec.
- Security risk if app displays signed artifact URLs too broadly; backend must scope and expire tokens.
- Regression risk in existing Instagram Reels flow while refactoring the screen.
- Product risk: a content-summary template may feel too simple, but that is acceptable for the first MVP.

## Execution Notes

- Read first:
  - `contentflow_app/lib/presentation/screens/reels/reels_screen.dart`
  - `contentflow_app/lib/data/services/api_service.dart`
  - `contentflow_app/lib/providers/providers.dart`
  - `contentflow_app/lib/data/models/content_item.dart`
  - `shipflow_data/workflow/specs/monorepo/remotion-render-service-integration.md`
- Implement models and API service before UI.
- Keep render state isolated so it can be reset when project changes.
- Prefer a compact tabbed flow over a new route.
- Use existing app theme and widgets; do not add a landing page or decorative hero.
- Stop and reroute if the render API does not provide a browser-playable signed artifact URL; the app cannot satisfy preview without it.
- Stop and reroute if `video_player` conflicts with Flutter web build constraints in this repo.

## Open Questions

None blocking for MVP. Deferred decisions are template variety, share sheet, CDN storage, generated captions, and social publishing.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-05-11 09:15:20 | sf-spec | GPT-5 Codex | Created app workflow spec from user decisions and existing `/reels` screen. | Draft saved. | /sf-ready reels-from-content-preview-workflow |
| 2026-05-11 09:46:04 | sf-ready | GPT-5 Codex | Evaluated readiness gate for app `/reels` preview/export workflow and required render-service dependency. | Not ready: required render-service spec is not ready; app spec needs concrete API/UI concurrency, access-state, validation, and error contracts before implementation. | /sf-spec Reels from existing content preview workflow |

## Current Chantier Flow

- sf-spec: done
- sf-ready: not ready
- sf-start: not launched
- sf-verify: not launched
- sf-end: not launched
- sf-ship: not launched

Next command: `/sf-spec Reels from existing content preview workflow`

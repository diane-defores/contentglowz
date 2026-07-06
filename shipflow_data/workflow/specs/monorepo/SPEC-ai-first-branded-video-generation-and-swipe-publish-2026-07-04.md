---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "contentglowz"
created: "2026-07-04"
created_at: "2026-07-04 00:00:00 UTC"
updated: "2026-07-04"
updated_at: "2026-07-04 00:00:00 UTC"
status: draft
source_skill: sf-spec
source_model: "GPT-5 Codex"
scope: "feature"
owner: "Diane"
confidence: "high"
user_story: "En tant que creatrice ContentGlowz authentifiee, je veux fournir du contenu, des images, des videos et un branding, puis recevoir automatiquement une video prete a publier que je peux swiper pour publier ou ajuster rapidement si besoin."
risk_level: "high"
security_impact: "yes"
docs_impact: "yes"
linked_systems:
  - "app"
  - "lab"
  - "worker"
  - "Clerk auth"
  - "Turso/libSQL"
  - "Bunny Storage/CDN"
  - "Project Asset Library"
  - "Unified ContentGlowz Video Timeline"
  - "Templates"
  - "Branding system"
  - "publish accounts"
depends_on:
  - artifact: "shipflow_data/workflow/specs/monorepo/SPEC-unified-contentglowz-video-timeline-2026-05-14.md"
    artifact_version: "0.1.0"
    required_status: "ready"
  - artifact: "shipflow_data/workflow/specs/monorepo/SPEC-text-based-media-editing-social-video-2026-05-12.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipflow_data/workflow/specs/monorepo/SPEC-ai-video-broll-generation-workflow-2026-05-13.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipflow_data/workflow/specs/monorepo/SPEC-video-editor-ai-audio-music-backgrounds-2026-05-11.md"
    artifact_version: "1.0.0"
    required_status: "ready"
  - artifact: "shipflow_data/business/business.md"
    artifact_version: "1.0.0"
    required_status: "reviewed"
  - artifact: "shipflow_data/branding/branding.md"
    artifact_version: "1.0.0"
    required_status: "reviewed"
  - artifact: "shipflow_data/product/app/product.md"
    artifact_version: "1.0.0"
    required_status: "reviewed"
supersedes: []
evidence:
  - "User direction 2026-07-04: the platform should propose already-made content by default, swipe to publish, with optional modification before publication."
  - "User direction 2026-07-04: give images and videos as inputs to AI and let it output a complete video that follows a specific branding."
  - "User direction 2026-07-04: editing should remain possible from the video editor or from the branding editor."
  - "Business and product docs were updated 2026-07-04 to shift canonical positioning from human-in-the-loop review-first to ready-made output with optional edits."
  - "The canonical video model already exists as one ContentGlowz-owned timeline; this spec must not create a second competing editor model."
next_step: "/sf-ready AI-first branded video generation and swipe publish"
---

## Title

AI-first branded video generation and swipe publish

## Status

Draft. This spec defines the target default experience for ContentGlowz video: users provide source content, media assets and a brand system, ContentGlowz assembles a ready-made branded video draft automatically, previews it through the existing render stack, and lets the user publish fast with a swipe-style confirmation or perform optional edits through the canonical video timeline or a dedicated branding editor. The product default is no longer "open an editor and start assembling." The default is "receive a finished draft, then approve, tweak, or regenerate."

## User Story

En tant que creatrice ContentGlowz authentifiee, je veux fournir du contenu, des images, des videos et un branding, puis recevoir automatiquement une video prete a publier que je peux swiper pour publier ou ajuster rapidement si besoin.

## Minimal Behavior Contract

Depuis un contenu appartenant au projet actif, avec des assets media eligibles et un profil de marque defini, ContentGlowz cree ou met a jour automatiquement un draft video brande dans la timeline canonique, lance une preview serveur de cette version, puis presente a l'utilisateur une decision simple: publier, modifier legerement, changer le branding, ou regenerer avec des contraintes. Si le branding est incomplet, si les assets sont insuffisants, si la timeline auto-generee n'est pas valide, si le rendu echoue, si le publish preflight echoue ou si les droits d'acces ne correspondent pas au projet actif, l'utilisateur voit un etat recuperable avec explication courte et action suivante claire. Le cas facile a rater est la derive de modele: le "draft pret a publier" doit etre une version normale de la timeline ContentGlowz, pas un objet cache ou un rendu jetable impossible a corriger.

## Success Behavior

- Given an authenticated user with an active project, owned content, eligible media assets and a selected brand profile, when they ask for a video from the content editor or a publish workflow, then ContentGlowz creates or refreshes a branded draft in the canonical video timeline automatically.
- Given the brand profile contains approved defaults for typography, colors, logo treatment, caption style, intro/outro, CTA behavior, scene rhythm and transition family, when the auto-assembly runs, then those rules shape the generated scene order and visual treatment without requiring manual keyframe editing.
- Given the source content has text, assets and optional transcript or hook candidates, when the assembly runs, then the backend creates a complete first-cut timeline with scene sequencing, text overlays, media placements, audio defaults, caption defaults and export preset selection.
- Given a branded draft version is created, when preview is requested or auto-triggered under allowed cost rules, then the existing render stack produces a preview MP4 tied to that exact immutable timeline version.
- Given the preview completes and publish prerequisites pass, when the user reaches the final approval surface, then the app presents a compact review card with playback, key metadata, channel/format, and a swipe-to-publish confirmation.
- Given the user accepts the draft, when they complete the swipe action, then ContentGlowz triggers the publish flow or queues the final publish action through the owned publish account path for the active project.
- Given the user wants changes, when they choose "Edit video", then the app opens the canonical `/editor/:id/video` timeline with the already-generated version loaded.
- Given the user wants systemic rather than one-off changes, when they choose "Edit branding", then the app opens a branding editor for that brand profile and can offer regeneration against the new rules.
- Given the user wants a new automatic cut, when they choose regenerate, then ContentGlowz preserves explicit locks such as chosen assets, locked scenes, forbidden colors, fixed captions or CTA copy according to the request.
- Proof of success is a flow where a user can go from owned content plus brand inputs to a previewable, publishable video without doing manual montage first, while still keeping optional timeline and branding edits on the same canonical data.

## Error Behavior

- Missing, expired or invalid Clerk auth returns `401`; no draft, preview, render job or publish action is created.
- Foreign project, content, brand profile, asset, timeline or publish account returns `403` or `404` without leaking prompts, asset URLs, brand rules, preview artifacts or destination metadata.
- If the project has no usable brand profile and no safe default fallback, the auto-assembly is blocked with a clear "brand setup required" state and a path into the branding editor.
- If source content is too thin, missing transcript/body, or lacks enough eligible assets for the requested video archetype, the backend returns a typed insufficiency error and offers deterministic fallback paths rather than a broken draft.
- If auto-assembly generates an invalid timeline under current renderer limits, the draft is rejected before preview and the previous valid timeline remains active.
- If preview fails, the user may still edit or regenerate, but swipe-to-publish remains disabled until a current completed preview exists.
- If a publish account is missing, disconnected or not authorized for the active project, swipe-to-publish is unavailable and the UI routes to integration or export actions instead.
- If a user edits branding while another draft generation is in flight, stale draft results must not overwrite the newer brand revision.
- If a user edits the timeline after preview, that preview becomes stale and publish is blocked until a fresh preview completes for the new version.
- If regeneration is requested with locked constraints that cannot all be satisfied, the system returns a partial-constraint conflict instead of silently ignoring locks.
- What must never happen: a hidden non-canonical draft bypasses the timeline model, brand rules are applied from another project, a stale preview is published, a draft publishes to an unauthorized account, or the system claims "ready to publish" without a current valid preview.

## Problem

ContentGlowz now has the foundations for a canonical video timeline, render preview/final workflows, templates, project assets and a stronger product promise around ready-made outputs. But the current direction of the video system still assumes too much manual assembly and too much editor-first thinking. That is the wrong default for the stated product goal.

Users do not want to spend time doing montage. They want the platform to output already-made, on-brand videos from their content and source assets. Editing must remain available, but as a correction layer. Without an explicit spec, the system risks drifting into a general-purpose editor, a disconnected AI playground, or a brittle set of one-off templates with no canonical tie to the timeline or publish flow.

## Solution

Introduce an AI-first branded video generation workflow where the default path is:

1. choose or infer the content and source media,
2. choose or infer the brand profile and video archetype,
3. auto-assemble a complete branded draft in the canonical timeline,
4. render preview for that exact timeline version,
5. present a compact review surface with swipe-to-publish,
6. allow optional edits either in the timeline editor or the branding editor,
7. allow regeneration with explicit constraints.

This keeps one canonical video model, one preview truth, and one publish gate, while shifting the product experience from "manual assembly first" to "publish-ready by default."

## Scope In

- A canonical `BrandVideoBlueprint` concept that maps a brand profile to reusable video rules.
- Automatic draft assembly from owned content plus owned/eligible media assets.
- Branded defaults for:
  - layouts
  - typography
  - logo treatment
  - intro/outro modules
  - CTA modules
  - caption styling
  - transition family
  - motion intensity
  - scene grammar
  - export defaults by channel
- Video archetypes such as:
  - `ugc_ad`
  - `product_demo`
  - `faceless_reel`
  - `talking_head_highlight`
  - `testimonial_cut`
  - `recap`
- An auto-assembly service that outputs a normal ContentGlowz timeline draft version rather than a parallel format.
- Preview orchestration tied to the current immutable timeline version.
- A compact approval surface in the app with playback, metadata, warnings and swipe-to-publish confirmation.
- Optional transitions into:
  - the canonical timeline editor for one-off edits
  - the branding editor for systemic edits
  - regeneration with constraints
- Brand-aware regeneration that can preserve locks such as:
  - selected assets
  - scene order
  - CTA copy
  - caption timing
  - excluded colors or styles
  - required scenes
- Publish preflight integration so swipe-to-publish checks preview freshness, channel readiness, duration/ratio constraints, destination authorization and project ownership.
- Server-side persistence for brand video blueprints, draft generation runs, regeneration constraints and publish decisions.
- Tests for ownership, stale preview blocking, brand revision conflicts, deterministic fallback behavior, publish preflight and regeneration lock preservation.

## Scope Out

- A second storyboard source of truth separate from the canonical timeline.
- A freeform professional editor as the default product entry point.
- Blind autopublish with no visible preview or approval state.
- Public claim that every output is perfect without review.
- Cross-project reusable public marketplace for brand kits in V1.
- Avatar/likeness generation, celebrity prompts or identity cloning.
- Direct provider-specific UI exposing arbitrary model controls to Flutter users.
- Full multi-user brand governance workflow with approvals, comments and audit permissions beyond project ownership.
- Autonomous campaign planning across many channels without explicit content or brand selection.
- Generic marketing-site copy overhaul in this spec; site changes follow product implementation.

## Constraints

- The canonical timeline remains the only editable video source of truth.
- The branding editor does not own a second renderable model; it only edits brand rules that shape draft generation and regeneration.
- Any auto-generated draft must be persisted as a standard timeline version before preview or publish.
- Swipe-to-publish requires:
  - a completed preview for the current version,
  - a ready publish account for the target destination,
  - passing channel constraints,
  - ownership-safe project context.
- Auto-generation may be triggered by user action or safe product defaults, but expensive preview/render work must still respect quota, concurrency and provider policy constraints.
- The system must support incomplete projects gracefully:
  - if brand data is partial, use only safe defaults that are explicitly allowed;
  - if asset coverage is weak, degrade to simpler archetypes instead of fabricating unsupported complexity.
- Brand rules are project-scoped unless an explicit future org-level spec says otherwise.
- Regeneration must be explicit and traceable; it cannot silently mutate published or approved drafts.
- Publish must stay explainable:
  - the app shows why a draft is ready,
  - why it is blocked,
  - and what changed after regeneration or edit.
- Signed preview/final URLs, provider secrets and publish tokens must never be persisted in durable client state or visible diagnostics.

## Dependencies

- Canonical timeline spec:
  - `shipflow_data/workflow/specs/monorepo/SPEC-unified-contentglowz-video-timeline-2026-05-14.md`
- Existing video generation/editor-related specs:
  - `shipflow_data/workflow/specs/monorepo/SPEC-ai-video-broll-generation-workflow-2026-05-13.md`
  - `shipflow_data/workflow/specs/monorepo/SPEC-text-based-media-editing-social-video-2026-05-12.md`
  - `shipflow_data/workflow/specs/monorepo/SPEC-video-editor-ai-audio-music-backgrounds-2026-05-11.md`
- Canonical business and product truth:
  - `shipflow_data/business/business.md`
  - `shipflow_data/branding/branding.md`
  - `shipflow_data/product/app/product.md`
- Existing publish account and render job contracts in `lab`.

## Data Model Additions

### `BrandProfile`

Project-scoped brand identity and base rules.

Suggested fields:
- `id`
- `project_id`
- `name`
- `logo_asset_id`
- `primary_colors`
- `secondary_colors`
- `font_heading`
- `font_body`
- `tone_keywords`
- `cta_defaults`
- `caption_style_defaults`
- `motion_intensity`
- `transition_family`
- `intro_module_enabled`
- `outro_module_enabled`
- `updated_at`

### `BrandVideoBlueprint`

Project-scoped video system derived from a brand profile.

Suggested fields:
- `id`
- `project_id`
- `brand_profile_id`
- `name`
- `status`
- `default_archetype`
- `scene_rules_json`
- `layout_rules_json`
- `motion_rules_json`
- `caption_rules_json`
- `cta_rules_json`
- `audio_rules_json`
- `export_rules_json`
- `allowed_regeneration_locks_json`
- `revision`
- `created_at`
- `updated_at`

### `VideoDraftGenerationRun`

Tracks each automatic assembly or regeneration run.

Suggested fields:
- `id`
- `project_id`
- `content_id`
- `timeline_id`
- `result_timeline_version_id`
- `brand_profile_id`
- `brand_video_blueprint_id`
- `video_archetype`
- `trigger_source`
- `status`
- `constraint_locks_json`
- `warnings_json`
- `preview_job_id`
- `created_by`
- `created_at`
- `completed_at`

### `SwipePublishDecision`

Tracks final approval and publish intent.

Suggested fields:
- `id`
- `project_id`
- `content_id`
- `timeline_id`
- `timeline_version_id`
- `preview_job_id`
- `publish_account_id`
- `destination_channel`
- `status`
- `decision_source`
- `decided_by`
- `created_at`
- `published_at`

## API Shape

Expected new or expanded API family:

- `POST /api/brand-profiles`
- `PATCH /api/brand-profiles/{brand_profile_id}`
- `GET /api/brand-profiles/{brand_profile_id}`
- `POST /api/brand-video-blueprints`
- `PATCH /api/brand-video-blueprints/{blueprint_id}`
- `GET /api/brand-video-blueprints/{blueprint_id}`
- `POST /api/video-drafts/from-content`
- `POST /api/video-drafts/{draft_run_id}/regenerate`
- `GET /api/video-drafts/{draft_run_id}`
- `POST /api/video-timelines/{timeline_id}/preview`
- `POST /api/video-publish-decisions/{timeline_id}/swipe-publish`
- `GET /api/video-publish-decisions/{decision_id}`

Key request/response expectations:

- Draft generation accepts ids and high-level intent, not raw arbitrary render JSON.
- Regeneration accepts explicit locks and optional requested changes.
- Swipe publish accepts only the current timeline id/version context and a destination account id; the server verifies preview freshness and authorization.
- All responses must be ownership-scoped and redact signed URLs/tokens from non-artifact contexts.

## App UX

Primary user flow:

1. user opens content detail or a video creation CTA;
2. app shows selected brand profile and video archetype;
3. user launches or accepts automatic draft generation;
4. app shows progress and then preview;
5. app shows actions:
   - `Swipe to publish`
   - `Edit video`
   - `Edit branding`
   - `Regenerate`
6. app blocks publish if preview is stale or preflight fails.

The approval UI should stay compact and operational:

- preview player
- brand name
- archetype
- destination channel
- duration
- warnings
- last generated timestamp
- explicit state if user changes brand or timeline after preview

## Branding Editor UX

The branding editor is not Photoshop and not a timeline. It edits the system that controls future drafts.

V1 controls:
- fonts
- colors
- logo treatment
- lower-third style
- caption style
- intro/outro modules
- transition family
- motion intensity
- CTA style
- default archetypes per channel

V1 behavior:
- saves a new brand or blueprint revision;
- can trigger regeneration of the current draft using the new revision;
- never edits the timeline directly except through explicit regeneration or allowed derived updates.

## Timeline Editor UX

The timeline editor remains available for:

- changing scene order
- swapping assets
- editing text
- trimming clips
- adjusting captions
- locking scenes before regeneration

But it is not the default entry point for V1 of this product direction.

## Invariants

- There is one canonical video timeline per active draft context, not one hidden AI draft plus one user-edit draft.
- Every publishable video corresponds to a current immutable timeline version.
- Every swipe-to-publish action is bound to a fresh completed preview for that exact version.
- Brand revisions do not silently overwrite already-approved timeline versions.
- Regeneration never publishes automatically.
- Optional edits must not break the ability to reason about what brand rules or source assets produced the draft.

## Edge Cases

- Project has content but no brand profile.
- Project has a brand profile but no usable media assets.
- Brand profile changes while preview is rendering.
- User edits timeline after preview but before swipe action.
- User edits branding after preview but before swipe action.
- Destination publish account disconnects after preview.
- Auto-assembly produces too many scenes for duration cap.
- Locked scene order conflicts with requested archetype change.
- Chosen assets violate destination safe-zone or ratio constraints.
- Regeneration requested on a published draft.
- Two tabs attempt regeneration with different lock sets.

## Implementation Tasks

- [ ] Tache 1: Define canonical brand video data models.
  - Fichiers: `lab/api/models/brand_video.py`, migration file, store/service layer.
  - Action: Add `BrandProfile`, `BrandVideoBlueprint`, `VideoDraftGenerationRun`, and `SwipePublishDecision` models plus persistence.
  - Validate with: store tests for ownership, revisioning and serialization.

- [ ] Tache 2: Build auto-assembly service into canonical timeline.
  - Fichiers: `lab/api/services/video_draft_assembly.py` or equivalent, timeline adapter layer.
  - Action: Transform content, assets and blueprint rules into a valid timeline draft version.
  - Validate with: deterministic assembly tests for archetypes, asset fallback and duration caps.

- [ ] Tache 3: Add branding editor API contracts.
  - Fichiers: new `lab/api/routers/brand_video.py` or equivalent.
  - Action: Add CRUD for brand profiles and blueprints with revision safety.
  - Validate with: auth and ownership API tests.

- [ ] Tache 4: Add regeneration-with-constraints workflow.
  - Fichiers: assembly service, request models, timeline/version glue.
  - Action: Support explicit lock preservation and explainable regeneration warnings.
  - Validate with: tests for preserved assets/scenes/captions and typed constraint conflicts.

- [ ] Tache 5: Add swipe-to-publish server contract.
  - Fichiers: publish router/service area in `lab`.
  - Action: Add preflight validation and publish decision recording tied to exact timeline version and preview job.
  - Validate with: tests for stale preview rejection, foreign account refusal, and successful publish decision creation.

- [ ] Tache 6: Add compact app approval flow.
  - Fichiers: `app/lib/presentation/screens/editor/` and related providers/services.
  - Action: Show generated draft preview and actions for publish, edit video, edit branding and regenerate.
  - Validate with: Flutter state tests for ready, blocked, stale and regenerated flows.

- [ ] Tache 7: Add branding editor app surface.
  - Fichiers: new branding editor route/screen/provider models in `app`.
  - Action: Support editing blueprint rules and rerunning current draft generation.
  - Validate with: form state and API interaction tests.

- [ ] Tache 8: Keep docs and promise aligned.
  - Fichiers: product/branding/site docs and user-facing copy.
  - Action: Ensure implementation language uses `ready-made`, `optional edits`, and `swipe to publish` consistently without implying blind autopilot.
  - Validate with: docs audit and UX copy review.

## Validation Notes

- Targeted metadata validation passes for this artifact:
  - `python3 /home/claude/shipflow/tools/shipflow_metadata_lint.py shipflow_data/workflow/specs/monorepo/SPEC-ai-first-branded-video-generation-and-swipe-publish-2026-07-04.md`
- Global `shipflow_data/workflow/specs` metadata lint still fails as of `2026-07-04`, but due to pre-existing invalid artifacts outside this chantier, not due to this spec.
- Historical invalid specs currently reported by the global lint:
  - `shipflow_data/workflow/specs/SPEC-ai-asset-understanding-auto-tagging-2026-05-13.md`
  - `shipflow_data/workflow/specs/app/SPEC-contentglowz-app-dependency-hygiene-and-reproducible-flutter-install-2026-06-12.md`
  - `shipflow_data/workflow/specs/app/SPEC-record-package-migration-flutter-3-41.md`
  - `shipflow_data/workflow/specs/app/android-back-history-outside-onboarding-2026-05-16.md`
  - `shipflow_data/workflow/specs/lab/SPEC-dual-mode-ai-runtime-all-providers.md`
  - `shipflow_data/workflow/specs/lab/SPEC-google-search-console-intelligence.md`
  - `shipflow_data/workflow/specs/lab/SPEC-project-intelligence-engine-data-layer-2026-05-13.md`
  - `shipflow_data/workflow/specs/lab/SPEC-strict-byok-llm-app-visible-ai.md`
  - `shipflow_data/workflow/specs/monorepo/SPEC-remotion-cloud-run-gcs-render-deployment-2026-05-14.md`
  - `shipflow_data/workflow/specs/monorepo/SPEC-unified-contentglowz-video-timeline-2026-05-14.md`
  - `shipflow_data/workflow/specs/site/SPEC-bilingual-fr-en-blog-routing-and-locale-metadata-2026-06-12.md`
  - `shipflow_data/workflow/specs/site/SPEC-bilingual-fr-en-routing-seo-metadata-core-pages-2026-06-12.md`

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-07-04 00:00:00 UTC | sf-spec | GPT-5 Codex | Created canonical draft spec for AI-first branded video generation, preview, swipe-to-publish, optional editing, and brand-driven regeneration. | implemented; targeted metadata lint passes, global specs lint still blocked by pre-existing invalid artifacts outside this chantier | /101-sf-ready AI-first branded video generation and swipe publish |
| 2026-07-04 00:00:00 UTC | 007-sf-content | GPT-5 Codex | Added a public French blog article on the site to explain the target architecture and user flow without overclaiming shipped behavior. | implemented | /103-sf-verify AI-first branded video generation and swipe publish public content alignment |

## Current Chantier Flow

- 100-sf-spec: completed
- 101-sf-ready: pending
- 102-sf-start: pending
- 103-sf-verify: pending
- 104-sf-end: pending
- 005-sf-ship: pending

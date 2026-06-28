---
artifact: brand_context
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: contentglowz
created: "2026-04-25"
updated: "2026-06-28"
status: reviewed
source_skill: sf-docs
scope: brand
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: none
docs_impact: yes
brand_voice: clear, practical, direct
trust_posture: transparency over hype, explicit constraints, human-in-the-loop
evidence:
  - shipflow_data/business/business.md
  - README.md
depends_on:
  - shipflow_data/business/business.md@1.0.0
supersedes:
  - shipflow_data/business/app/branding.md
  - shipflow_data/business/site/branding.md
  - shipflow_data/business/lab/branding.md
next_review: "2026-07-28"
next_step: /sf-docs audit shipflow_data/branding/branding.md
---
# Branding Guide

## Brand

- **Brand name**: ContentGlowz
- **Category**: AI-assisted, human-led content operations product
- **Primary message**: "AI-assisted, human-led content execution"
- **Primary promise**: Reduce cognitive overhead so teams publish with intention.

## Brand Positioning

ContentGlowz is not framed as a fully automated content factory.
It is positioned as an execution assistant that combines:

- idea intake,
- structured curation,
- review gates,
- scheduling control,
- resilient continuity when backend services are unavailable.

The brand promise is shared across all surfaces:

- `site` explains and converts,
- `app` executes the operator workflow,
- `lab` and `worker` support reliable delivery,
- no surface may create a competing promise.

## Voice and Tone

- Clear, practical, and direct.
- Professional but not corporate.
- Concise with explicit status states and explicit limits.
- Encourage trust through transparency rather than hype.
- Avoid overpromising autonomy; prefer human-in-the-loop language.

## Language

- Primary product language is English unless a surface explicitly targets French content.
- When writing in French, use informal address ("tu") consistently.
- When writing in French, always keep proper French accents.
- Use short, explicit labels in navigation, status, and conversion surfaces.

## Visual and UX Language

- Functional-first with strong affordances and readable hierarchy.
- Status, retries, degraded mode, and trust copy are part of the brand system.
- Accessibility and feedback clarity are branding concerns, not only technical concerns.

## Terms to Use

- "human review"
- "publish with intention"
- "degraded mode"
- "content workflow"
- "sync queue"
- "queued action"
- "bootstrap"
- "trust and continuity"

## Terms to Avoid

- "miracle"
- "fully automatic"
- "set and forget"
- "no oversight required"
- vague AI claims implying perfect outcomes

## Experience Principles

- Keep users in control, even when systems are degraded.
- Make waiting states understandable in one sentence.
- Preserve user momentum with explicit recovery paths.
- Make uncertainty explicit and actionable.

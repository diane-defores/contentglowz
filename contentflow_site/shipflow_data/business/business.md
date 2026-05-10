---
artifact: business_context
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: contentflow_site
created: "2026-04-26"
updated: "2026-04-27"
status: reviewed
source_skill: sf-docs
scope: business
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: none
docs_impact: yes
target_audience: creators, independent operators, SMB content teams
value_proposition: turn content ideas into publish-ready outcomes with predictable, transparent execution
business_model: acquisition and qualification on site, then handoff to contentflow_app where product and commercial truth is defined
market: content teams, founders, and solo operators
depends_on:
  - CLAUDE.md@0.1.0
evidence:
  - CLAUDE.md
  - README.md
  - shipflow_data/business/branding.md
next_review: "2026-07-26"
supersedes: []
next_step: /sf-docs audit shipflow_data/business/business.md
---
# Business Context

## Purpose

`contentflow_site` is the public website and acquisition surface for ContentFlow.
It presents the product, sets expectations, captures trust signals, and routes users into the
authenticated Flutter app handoff flow.

For product and business truth, `contentflow_app` is the canonical repository. This site mirrors
that contract and must not create a parallel product or pricing truth.

## Problem

Independent operators and small teams need credible, practical pathways from product interest
to action but often face:

- fragmented messaging across pages and unclear next steps,
- uncertainty around what happens when backend services are down,
- ambiguous handoff between landing experiences and the product app.

## Positioning

The site should position ContentFlow as a practical execution layer with transparent limitations:

- clear outcome orientation instead of AI hype,
- explicit degraded-mode behavior,
- straightforward onboarding and entry path to the product shell.

## Audience and Use Cases

- Landing-page visitors evaluating ContentFlow.
- Prospects comparing automation value versus control.
- Teams that want predictable publish workflows with explicit retry and error recovery.

## Commercial Scope

- The site sets product context, trust framing, and conversion pathways (pricing pages, FAQs, CTA flows).
- It does not own backend business logic or auth token brokerage rules (those belong to app/backend repos),
  but it must communicate app-level constraints accurately.

## Conversion Strategy

The primary conversion direction is:
1. Explain value and constraints quickly.
2. Route users to `/launch` and auth handoff.
3. Reduce post-click drop-off with resilient messaging and clear next actions.

## Governance

- Keep copy updates in sync with app capabilities.
- Avoid overpromising automation without clear human-in-the-loop qualifiers.
- Any change to business claims should be reflected in `shipflow_data/business/branding.md` and `shipflow_data/technical/guidelines.md`.

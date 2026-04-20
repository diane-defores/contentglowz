# Business Context

## Positionnement Backend

`contentflow_lab` is the authoritative backend layer for ContentFlow, responsible for:

- data APIs for authenticated product workflows,
- content status/scheduling orchestration,
- AI-assisted analysis and automation endpoints.

The product promise is operational continuity: the Flutter app stays usable at the user layer while backend flows remain consistent and recoverable.

## User and System Value

- Product teams and operators get a single backend contract for content planning, persona management, drip scheduling, and execution history.
- Marketing and analytics teams get measurable signals (`status`, `analytics`, `jobs`, `cost`) for decisioning and visibility.
- Automation and content teams get orchestrated research/pipeline outputs with traceable execution.

## Commercial Constraint

Pricing and monetization are not encoded in this repository; backend scope is to preserve API reliability and delivery speed for the product stack.

## Service Commitments

- stable API behavior for app-critical flows (`projects`, `settings`, `content`, `drip`),
- secure session-aware access (Clerk-backed validation where configured),
- observability for failed operations and background jobs,
- deployable runtime defaults for EU-hosted/managed environments.

## Current Priorities

- Keep endpoint contracts in sync with app usage.
- Harden migration and startup behavior for fast recovery.
- Preserve backward-compatible payloads where possible during rollout.

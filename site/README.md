# ContentGlowz Site

Public Astro site for ContentGlowz.

This root README is now an entrypoint, not the canonical technical or editorial source of truth.

## Canonical Docs

- Technical index: `shipflow_data/technical/site/README.md`
- Architecture: `shipflow_data/technical/site/architecture.md`
- Context: `shipflow_data/technical/site/context.md`
- Editorial index: `shipflow_data/editorial/site/README.md`
- Workflow backlog: `shipflow_data/workflow/site/TASKS.md`

## Quick Start

1. `npm install`
2. `npm run dev`
3. `npm run build`
4. `npm run preview`

## Runtime

- Node: `>=22.12.0 <23`
- npm: `>=11 <12`

## Rule

If a local `site/*` doc and a `shipflow_data/*` doc disagree, treat `shipflow_data/*` as canonical and reduce the local file instead of expanding it.

# ContentGlowz App

Flutter product application for ContentGlowz.

This local README is an entrypoint, not the canonical technical or product source of truth.

## Canonical Docs

- Technical index: `shipflow_data/technical/app/README.md`
- Architecture: `shipflow_data/technical/app/architecture.md`
- Context: `shipflow_data/technical/app/context.md`
- Product: `shipflow_data/product/app/product.md`
- Workflow backlog: `shipflow_data/workflow/app/TASKS.md`
- Audit history: `shipflow_data/workflow/app/AUDIT_LOG.md`

## Quick Start

1. `./build.sh --serve`
2. `./pm2-web.sh`
3. `./scripts/validate-clerk-runtime.sh`

## Rule

If a local `app/*` doc and a `shipflow_data/*` doc disagree, treat `shipflow_data/*` as canonical and reduce the local file instead of expanding it.

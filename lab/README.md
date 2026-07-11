# ContentGlowz Lab

Backend platform for ContentGlowz.

This root README is now an entrypoint, not the canonical technical source of truth.

## Canonical Docs

- Technical index: `shipflow_data/technical/lab/README.md`
- Architecture: `shipflow_data/technical/lab/architecture.md`
- Context: `shipflow_data/technical/lab/context.md`
- Workflow backlog: `shipflow_data/workflow/lab/TASKS.md`
- QA log: `shipflow_data/workflow/qa/TEST_LOG.md`

## Quick Start

1. `pip install -r requirements.lock`
2. Optional memory features only: `pip install -r requirements-memory.txt`
3. `doppler setup`
4. `doppler run -- uvicorn api.main:app --reload --port 8000`
5. `curl http://localhost:8000/health`

## Rule

If a local `lab/*` doc and a `shipflow_data/*` doc disagree, treat `shipflow_data/*` as canonical and reduce the local file instead of expanding it.

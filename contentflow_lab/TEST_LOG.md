## 2026-05-06 - AGENTS.md compatibility symlink retest

- Scope: BUG-2026-05-06-001
- Environment: local
- Tester: tooling
- Source: sf-test
- Status: pass
- Confidence: high
- Result summary: `AGENTS.md` is a symlink to `AGENT.md`; canonical guidance is consolidated and stale contradictory references were not found.
- Bug pointer: BUG-2026-05-06-001 -> ../shipflow_data/workflow/bugs/contentflow_lab/BUG-2026-05-06-001.md
- Evidence pointer: `test -L contentflow_lab/AGENTS.md`; `readlink contentflow_lab/AGENTS.md`; `rg` canonical/stale-reference checks
- Follow-up: /sf-verify BUG-2026-05-06-001

## 2026-05-10 - BUG-2026-05-10-001 re-test

- Scope: BUG-2026-05-10-001
- Environment: prod
- Tester: tooling
- Source: sf-test
- Status: blocked
- Confidence: high
- Result summary: `POST /api/personas/draft` on `https://api.winflowz.com` retourne systématiquement `401` (Bearer manquant/invalides), le job n’est pas créé donc polling impossible.
- Bug pointer: BUG-2026-05-10-001 -> ../shipflow_data/workflow/bugs/contentflow_lab/BUG-2026-05-10-001.md
- Evidence pointer: `curl https://api.winflowz.com/health` (200), `curl -X POST https://api.winflowz.com/api/personas/draft` (401), outputs: `/tmp/health_prod.json`, `/tmp/draft_prod.json`
- Follow-up: /sf-fix BUG-2026-05-10-001

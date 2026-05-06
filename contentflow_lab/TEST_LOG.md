## 2026-05-06 - AGENTS.md compatibility symlink retest

- Scope: BUG-2026-05-06-001
- Environment: local
- Tester: tooling
- Source: sf-test
- Status: pass
- Confidence: high
- Result summary: `AGENTS.md` is a symlink to `AGENT.md`; canonical guidance is consolidated and stale contradictory references were not found.
- Bug pointer: BUG-2026-05-06-001 -> bugs/BUG-2026-05-06-001.md
- Evidence pointer: `test -L contentflow_lab/AGENTS.md`; `readlink contentflow_lab/AGENTS.md`; `rg` canonical/stale-reference checks
- Follow-up: /sf-verify BUG-2026-05-06-001

# Tasks — ContentGlowz

## Priority Snapshot — 2026-07-11

### P0 — Do First

- [ ] Complete the manual provider smoke and final verify/ship for the dual-mode AI runtime (`Impact: High | Effort: Medium | Unblocks: hosted AI validation`).

### P1 — High ROI

- [ ] Ship the verified sober project-memory migration when the release path is available (`Impact: High | Effort: Low | Blocker: release decision`).
- [ ] Validate the remaining Feedback Admin production configuration and connected-admin/audio flows (`Impact: Medium | Effort: Low | Blocker: operator credentials/configuration`).

### P2 — Defer Until P0/P1

- [ ] Re-audit the Mem0/ChromaDB upstream situation and decide whether a dedicated worker or full CrewAI removal is justified (`Impact: Medium | Effort: Medium | Depends on: product need and upstream support`).
- [ ] Add Dependabot automation for `pip` and `github-actions` (`Impact: Medium | Effort: Low | No immediate blocker`).

### Notes

- Priority last updated: 2026-07-11.
- Criteria: balanced impact, security/blockers first, then high-ROI bounded work.
- The 103/104 project-memory chantier is verified and closed for bookkeeping; it is not reopened by this ranking.

🟢 [app] task: Feed-native ready-made video review cards and publish preflight | status: done | area: feed-video-publish-preflight
🟢 [worker] task: `@google-cloud/storage` est mis a jour en `7.21.0` et la stack Remotion en `4.0.482`; `uuid` est force en `11.1.1` via l'override pnpm et `pnpm audit --prod` est propre | status: done | area: deps-security-storage
🟢 [worker] task: `packageManager` pnpm est fige sur les packages Node, `engines` Node/pnpm sont declares et Dependabot surveille maintenant `site`, `worker` et `github-actions` | status: done | area: deps-config-automation
🟢 [lab] task: `requirements.lock` / `requirements-dev.lock` sont regeneres avec `aiohttp 3.14.1`, `pydantic-ai 1.107.0`, `pyjwt 2.13.0`, `urllib3 2.7.0`, `starlette 1.3.1`, `idna 3.18` et `cryptography 48.0.1`; `pip-audit` ne remonte plus que `mem0ai` / `chromadb` | status: done | area: deps-security-lock-refresh
🟢 [lab] task: `mem0ai` retire du runtime par defaut; pile memoire deplacee dans `lab/requirements-memory.txt`, backend valide sans memoire, et `chromadb` documente comme residu transitif `crewai` | status: done | area: deps-runtime-exposure-review
🟠 [lab] task: Re-auditer `lab/requirements-memory.txt` et le transitive `chromadb` de `crewai` quand un correctif upstream existe, puis decider reintroduction ou worker dedie | status: todo | area: deps-memory-upstream-watch
🟡 [lab] task: Ajouter une automation Dependabot pour `pip` et `github-actions`, et documenter la politique de revue des mises a jour backend | status: todo | area: deps-automation

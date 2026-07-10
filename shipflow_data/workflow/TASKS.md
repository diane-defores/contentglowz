# Tasks — ContentGlowz

🟢 [app] task: Feed-native ready-made video review cards and publish preflight | status: done | area: feed-video-publish-preflight
🟡 [worker] task: `@google-cloud/storage` est mis a jour en `7.21.0` et la stack Remotion en `4.0.482`; il reste a traiter la vulnerabilite transitive `uuid` via `gaxios@6.x`/`teeny-request@9` avant un `pnpm audit` completement propre | status: todo | area: deps-security-storage
🟢 [worker] task: `packageManager` pnpm est fige sur les packages Node, `engines` Node/pnpm sont declares et Dependabot surveille maintenant `site`, `worker` et `github-actions` | status: done | area: deps-config-automation
🟠 [lab] task: Regenerer `requirements.lock` avec des versions corrigees pour `aiohttp`, `pydantic-ai`, `pyjwt`, `urllib3`, `starlette` et `idna`, puis rerun `pip-audit` sur le lock | status: todo | area: deps-security-lock-refresh
🟠 [lab] task: Verifier l'exposition runtime de `mem0ai`, `chromadb`, `scrapy` et `twisted`; supprimer, isoler ou compenser les packages vulnérables sans correctif avant le prochain ship backend | status: todo | area: deps-runtime-exposure-review
🟡 [lab] task: Ajouter une automation Dependabot pour `pip` et `github-actions`, et documenter la politique de revue des mises a jour backend | status: todo | area: deps-automation

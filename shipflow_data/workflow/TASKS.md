# Tasks — ContentGlowz

🟠 [worker] task: Mettre a jour `@google-cloud/storage` vers `7.21.0` puis rerun `npm audit` pour supprimer la chaine `uuid`/`teeny-request`/`retry-request`/`gaxios` | status: todo | area: deps-security-storage
🟡 [worker] task: Ajouter `packageManager`, `engines` Node/NPM et une automation Dependabot npm/github-actions pour figer et surveiller la chaine d'installation | status: todo | area: deps-config-automation
🟠 [lab] task: Regenerer `requirements.lock` avec des versions corrigees pour `aiohttp`, `pydantic-ai`, `pyjwt`, `urllib3`, `starlette` et `idna`, puis rerun `pip-audit` sur le lock | status: todo | area: deps-security-lock-refresh
🟠 [lab] task: Verifier l'exposition runtime de `mem0ai`, `chromadb`, `scrapy` et `twisted`; supprimer, isoler ou compenser les packages vulnérables sans correctif avant le prochain ship backend | status: todo | area: deps-runtime-exposure-review
🟡 [lab] task: Ajouter une automation Dependabot pour `pip` et `github-actions`, et documenter la politique de revue des mises a jour backend | status: todo | area: deps-automation

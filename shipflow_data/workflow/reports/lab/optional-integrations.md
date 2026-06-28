# Optional Integrations

ContentFlow Lab keeps the default FastAPI/AI runtime install focused on the core dependency graph in `requirements.lock`.

## Reels / Instagram

`instagrapi` is intentionally excluded from the default runtime. Current releases pin `pydantic` and/or `requests` versions that conflict with the core AI stack and the requests security floor.

Strategy:

- Do not add `instagrapi` to `requirements.txt` or `requirements.lock`.
- If Reels remains product-critical, run it as an isolated worker/service with its own virtual environment and dependency lock.
- Keep the API boundary narrow: upload cookies, request download/transcode, return media metadata/CDN URLs.
- The core FastAPI runtime must keep returning `503` for Reels operations that need the Instagram client when the isolated integration is unavailable.

## STORM Research

`knowledge-storm` is intentionally excluded from the default runtime. Current compatible releases pull older `dspy`/OpenAI/LiteLLM constraints that conflict with the LiteLLM security floor.

Strategy:

- Do not add `knowledge-storm` to `requirements.txt` or `requirements.lock`.
- Prefer replacing STORM-style article research with the existing CrewAI/PydanticAI typed research flow over reintroducing the dependency.
- If a true STORM flow is required, run it as a separate offline research worker with a dedicated lockfile and no shared process with the core API.

## Operational Rule

Optional integration workers may depend on packages that are incompatible with the core API only when they are isolated by process, lockfile, deployment unit, secrets, and failure envelope.

---
artifact: code_docs_map
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: contentflow_lab
created: "2026-05-04"
updated: "2026-05-04"
status: draft
source_skill: sf-build
scope: code-docs-map
owner: Diane
confidence: medium
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - api/services/
  - agents/shared/tools/
  - tests/
depends_on:
  - artifact: "shipflow_data/technical/ai-runtime-and-url-safety.md"
    artifact_version: "1.0.0"
    required_status: draft
supersedes: []
evidence:
  - "Created during PydanticAI runtime adapter verification."
next_review: "2026-06-04"
next_step: "/sf-docs technical audit contentflow_lab"
---

# Code Docs Map

Use this map before editing backend runtime, provider, or LLM-callable external-fetch code.

| Code path | Primary doc | Coverage | Reader trigger |
| --- | --- | --- | --- |
| `api/services/pydantic_ai_runtime.py` | `shipflow_data/technical/ai-runtime-and-url-safety.md` | PydanticAI adapter and request-scoped OpenRouter rules | Any direct PydanticAI, OpenRouter, output schema, or credential-resolution change |
| `api/services/repo_understanding_service.py` | `shipflow_data/technical/ai-runtime-and-url-safety.md` | Repo/site collection and structured persona understanding synthesis | Any persona draft, repository collection, public-site crawl, or synthesis change |
| `api/services/url_safety.py` | `shipflow_data/technical/ai-runtime-and-url-safety.md` | Public HTTP URL validation and SSRF guardrails | Any URL parsing, DNS resolution, allowed scheme, or private-network policy change |
| `agents/shared/tools/exa_tools.py` | `shipflow_data/technical/ai-runtime-and-url-safety.md` | Exa search/content tools and URL-fetch guardrails | Any LLM-callable Exa tool change |
| `agents/shared/tools/firecrawl_tools.py` | `shipflow_data/technical/ai-runtime-and-url-safety.md` | Firecrawl scrape/crawl/map tools and URL-fetch guardrails | Any LLM-callable Firecrawl tool change |
| `tests/test_pydantic_ai_runtime.py` | `shipflow_data/technical/ai-runtime-and-url-safety.md` | Runtime adapter regression coverage | Any PydanticAI adapter contract change |
| `tests/test_url_safety.py` | `shipflow_data/technical/ai-runtime-and-url-safety.md` | URL safety regression coverage | Any URL safety policy change |
| `tests/test_external_url_tools_safety.py` | `shipflow_data/technical/ai-runtime-and-url-safety.md` | Exa/Firecrawl guard regression coverage | Any external tool wrapper change |
| `tests/conftest.py` / `pytest.ini` | `shipflow_data/technical/ai-runtime-and-url-safety.md` | Local test harness, mocked provider credentials, and live API skip policy | Any test collection, marker, fixture, or live API prerequisite change |

## Documentation Update Plan Format

```text
Documentation Update Plan:
- Status: complete | no impact | pending final integration | blocked
- Impacted docs:
  - shipflow_data/technical/<doc>.md: <required update or no change>
- Reason:
  - <why the docs are or are not current>
```

## Maintenance Rule

Update this map when covered files move, new runtime/provider surfaces are introduced, or validation responsibilities change.

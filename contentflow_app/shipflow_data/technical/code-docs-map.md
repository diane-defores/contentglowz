---
artifact: code_docs_map
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: contentflow_app
created: "2026-05-06"
updated: "2026-05-06"
status: draft
source_skill: sf-docs
scope: code-docs-map
owner: Diane
confidence: medium
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - lib/
  - android/
  - test/
  - pubspec.yaml
depends_on:
  - artifact: "shipflow_data/technical/flutter-app-shell-and-capture.md"
    artifact_version: "0.1.0"
    required_status: draft
supersedes: []
evidence:
  - "Baseline map created after metadata compliance audit found no technical governance layer for contentflow_app."
next_review: "2026-06-06"
next_step: "/sf-docs technical audit contentflow_app"
---

# Code Docs Map

Use this map before editing Flutter routing, provider state, API/offline services, Android native capture, or app validation flows.

| Code path | Primary doc | Coverage | Reader trigger |
| --- | --- | --- | --- |
| `lib/main.dart` | `shipflow_data/technical/flutter-app-shell-and-capture.md` | App bootstrapping and provider scope | Any boot, diagnostics, environment, or initialization change |
| `lib/router.dart` | `shipflow_data/technical/flutter-app-shell-and-capture.md` | Guarded navigation and onboarding/demo routes | Any route, auth gate, resume, or app handoff change |
| `lib/providers/providers.dart` | `shipflow_data/technical/flutter-app-shell-and-capture.md` | Riverpod state graph, pending content, projects, and offline state | Any provider contract, cache, queue, or user state change |
| `lib/data/services/api_service.dart` | `shipflow_data/technical/flutter-app-shell-and-capture.md` | FastAPI calls, offline queue, content body, and capture asset API methods | Any API payload, retry, queue, auth, or content asset change |
| `lib/data/services/capture_local_store.dart` | `shipflow_data/technical/flutter-app-shell-and-capture.md` | Local capture history and capture/content links | Any capture persistence, deletion, migration, or link-state change |
| `android/app/src/main/kotlin/**` | `shipflow_data/technical/flutter-app-shell-and-capture.md` | Android native screen capture bridge and permissions | Any MediaProjection, foreground service, or platform-channel change |
| `test/**` | `shipflow_data/technical/flutter-app-shell-and-capture.md` | Flutter regression coverage | Any test harness, fixture, onboarding, navigation, capture, or offline-sync validation change |

## Non-Coverage

- `build/`, `web_auth/`, and generated Flutter output are not covered as source of truth; regenerate them from source when needed.

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

Update this map when covered files move, new Flutter/Android surfaces are introduced, or validation responsibilities change.

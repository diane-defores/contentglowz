## 2026-05-16 - BUG-2026-05-05-001 Android safe area demo onboarding

- Scope: BUG-2026-05-05-001
- Environment: local Android release build
- Tester: user
- Source: sf-test
- Status: blocked
- Confidence: high
- Result summary: Retest not executable because the expected `Open Interactive Demo` entry option is absent from the Android entry screen.
- Bug pointer: BUG-2026-05-05-001 -> shipflow_data/workflow/bugs/contentflow_app/BUG-2026-05-05-001.md
- Evidence pointer: user-provided entry diagnostics, generated at 2026-05-16T12:17:55.080922Z, build commit 77be95214347b0a7227768dfed2cec83d13324a7.
- Follow-up: /sf-fix BUG-2026-05-05-001 Android demo entry unavailable

## 2026-05-16 - BUG-2026-05-05-001 Android safe area demo onboarding retest

- Scope: BUG-2026-05-05-001
- Environment: local Android device/build
- Tester: user
- Source: sf-test
- Status: pass
- Confidence: medium
- Result summary: User reported `PASS` after the demo entry fix; `Open Interactive Demo` is usable and the Android onboarding safe-area issue did not reproduce.
- Bug pointer: BUG-2026-05-05-001 -> shipflow_data/workflow/bugs/contentflow_app/BUG-2026-05-05-001.md
- Evidence pointer: chat reply `pass` on 2026-05-16 after retest instructions.
- Follow-up: /sf-verify BUG-2026-05-05-001 Android safe area demo onboarding

## 2026-05-16 - BUG-2026-05-05-001 Android safe area demo onboarding verification

- Scope: BUG-2026-05-05-001
- Environment: local Flutter + user Android retest evidence
- Tester: Codex + user evidence
- Source: sf-verify
- Status: pass
- Confidence: high
- Result summary: Closure criteria verified; focused Flutter tests passed and the user Android retest passed.
- Bug pointer: BUG-2026-05-05-001 -> shipflow_data/workflow/bugs/contentflow_app/BUG-2026-05-05-001.md
- Evidence pointer: `flox activate -- flutter test test/presentation/screens/entry/entry_screen_test.dart test/navigation/resume_no_jump_test.dart test/presentation/screens/onboarding/onboarding_back_test.dart` -> passed.
- Follow-up: none

## 2026-05-16 - BUG-2026-05-05-002 Android back navigation demo retest

- Scope: BUG-2026-05-05-002
- Environment: local Android device/build
- Tester: user
- Source: sf-test
- Status: pass
- Confidence: medium
- Result summary: User reported all requested onboarding back-navigation checks passed.
- Bug pointer: BUG-2026-05-05-002 -> shipflow_data/workflow/bugs/contentflow_app/BUG-2026-05-05-002.md
- Evidence pointer: chat reply `all pass` on 2026-05-16 after retest instructions.
- Follow-up: /sf-verify BUG-2026-05-05-002 Android back navigation demo

## 2026-05-16 - BUG-2026-05-05-002 Android back navigation demo verification

- Scope: BUG-2026-05-05-002
- Environment: local Flutter + user Android retest evidence
- Tester: Codex + user evidence
- Source: sf-verify
- Status: pass
- Confidence: high
- Result summary: Closure criteria verified; focused Flutter onboarding back test passed and the user Android retest passed.
- Bug pointer: BUG-2026-05-05-002 -> shipflow_data/workflow/bugs/contentflow_app/BUG-2026-05-05-002.md
- Evidence pointer: `flox activate -- flutter test test/presentation/screens/onboarding/onboarding_back_test.dart` -> passed.
- Follow-up: /sf-spec Android back history outside onboarding

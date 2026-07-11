## [2026-07-11]

### Changed
- Project generation context now uses scoped Project Intelligence data with deterministic relational retrieval, bounded context budgets, provenance, and generation signals for newsletter and psychology flows.

### Removed
- Removed the Mem0 project-memory runtime and its dedicated dependency/setup artifacts. ChromaDB remains only as a CrewAI transitive dependency and is not used by project memory.

### Fixed
- Corrected scheduler video-generation test imports so the test collects and passes with the repository's pytest configuration.

## [2026-07-10]

### Added
- Feed-native video cards in the app feed now surface preview media, readiness state, destination summary, publish preflight blockers, and a direct `/editor/:id/video` edit path for prepared video content.

### Changed
- Feed publish actions now stay truthful for video items: swipe/publish remains disabled until backend readiness is `ready_to_publish`, while rendering and blocked states explain why publish is unavailable.
- Operator and canonical app docs now describe the feed as a publish-ready video decision surface instead of a generic approve-or-publish review queue.

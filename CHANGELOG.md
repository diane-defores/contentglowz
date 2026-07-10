## [2026-07-10]

### Added
- Feed-native video cards in the app feed now surface preview media, readiness state, destination summary, publish preflight blockers, and a direct `/editor/:id/video` edit path for prepared video content.

### Changed
- Feed publish actions now stay truthful for video items: swipe/publish remains disabled until backend readiness is `ready_to_publish`, while rendering and blocked states explain why publish is unavailable.
- Operator and canonical app docs now describe the feed as a publish-ready video decision surface instead of a generic approve-or-publish review queue.

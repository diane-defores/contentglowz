# workflow data index

This directory is the canonical container for durable governance workflow Markdown for
the monorepo. Canonical paths under this folder are the active source of truth for
specifications, bugs, research, QA artifacts, reports, and workflow documents that are
outside runtime content.

Directory layout:

- `specs/` — workflow specs and migrated legacy spec-like documents
  - `specs/monorepo/` (legacy root specs and global migration specs)
  - `specs/contentflow_app/` (application project specs)
  - `specs/contentflow_lab/` (lab project specs and root `SPEC-*.md`)
  - `specs/contentflow_site/` (site project specs)
- `bugs/` — bug records and issue traces
- `research/` — research dossiers and decision notes
- `explorations/` — exploration notes
- `qa/` — quality matrices and QA evidence
- `audits/` — formal audit outputs
- `reviews/` — review notes and peer review artifacts
- `conversations/` — feature conversation artifacts
- `archives/` — stable historical artifacts retained for traceability
- `reports/` — run reports, migration reports, and security preflights

Entry rule:

- Runtime content and editorial pages under `contentflow_site/src/content/**` remain in
  `contentflow_site/src/content`.
- `contentflowz/**` is intentionally excluded from this migration.

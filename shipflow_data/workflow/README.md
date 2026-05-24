# workflow data index

This directory is the canonical container for durable governance workflow Markdown for
the monorepo. Canonical paths under this folder are the active source of truth for
specifications, bugs, research, QA artifacts, reports, and workflow documents that are
outside runtime content.

Directory layout:

- `specs/` — workflow specs and migrated legacy spec-like documents
  - `specs/monorepo/` (legacy root specs and global migration specs)
  - `specs/contentglowz_app/` (application project specs)
  - `specs/contentglowz_lab/` (lab project specs and root `SPEC-*.md`)
  - `specs/contentglowz_site/` (site project specs)
- `bugs/` — bug records and issue traces
- `research/` — research dossiers and decision notes
- `explorations/` — exploration notes
- `qa/` — quality matrices and QA evidence
- `audits/` — formal audit outputs
- `reviews/` — review notes and peer review artifacts
- `conversations/` — feature conversation artifacts
- `archives/` — stable historical artifacts retained for traceability
- `reports/` — run reports, migration reports, and security preflights
- `TASKS.md` and `AUDIT_LOG.md` — monorepo-level operational trackers

Subproject-local trackers live with each subproject when they exist:

- `shipflow_data/workflow/contentglowz_app/TASKS.md`
- `shipflow_data/workflow/contentglowz_app/AUDIT_LOG.md`
- `shipflow_data/workflow/contentglowz_lab/TASKS.md`
- `shipflow_data/workflow/contentglowz_lab/AUDIT_LOG.md`
- `shipflow_data/workflow/contentglowz_site/TASKS.md`
- `shipflow_data/workflow/contentglowz_site/AUDIT_LOG.md`

Entry rule:

- Runtime content and editorial pages under `contentglowz_site/src/content/**` remain in
  `contentglowz_site/src/content`.
- `contentflowz/**` is intentionally excluded from this migration.

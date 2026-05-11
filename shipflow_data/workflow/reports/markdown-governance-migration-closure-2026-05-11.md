# Markdown Governance Migration Closure Report

Date: 2026-05-11
Project: contentflow
Chantier spec: `shipflow_data/workflow/specs/SPEC-global-markdown-governance-migration-2026-05-11.md`

## Scope Executed

- `contentflow_app/specs`
- `contentflow_lab/specs`
- `specs`
- `contentflow_app/bugs`
- `contentflow_lab/bugs`
- `research`
- `docs/explorations`
- `docs/qa`
- `contentflow_lab/docs`
- `contentflow_lab` root governance notes
- `contentflow_site/docs` (targeted spec/research copies)

## Outcome Summary

- Total migrated markdown files: **74**
- Destination distribution:
  - `shipflow_data/workflow/specs`: **48**
  - `shipflow_data/workflow/bugs`: **4**
  - `shipflow_data/workflow/research`: **14**
  - `shipflow_data/workflow/explorations`: **6**
  - `shipflow_data/workflow/qa`: **1**
  - `shipflow_data/workflow/reports`: **3** (plus newly added security + closure reports = 5 total now)
- Legacy tracking files and trackers kept as trackers where required.
- `contentflowz/**` was intentionally excluded from scope and left unchanged.

## Validation Evidence

### Inventory / Reference / Runtime evidence

- `find specs contentflow_app/specs contentflow_lab/specs contentflow_lab/docs docs/explorations docs/qa research contentflow_app/bugs contentflow_lab/bugs contentflow_site/docs -maxdepth 2 -type f -name '*.md'` (with missing directories ignored) returned no remaining in-scope legacy markdown files in those paths.

- `git diff -- contentflowz` returned empty output (no changes in `contentflowz/**`).

### Metadata lints

- ` /home/claude/shipflow/tools/shipflow_metadata_lint.py shipflow_data/workflow/specs shipflow_data/workflow/bugs shipflow_data/workflow/research shipflow_data/workflow/qa shipflow_data/workflow/explorations shipflow_data/workflow/reports`
  - Result: **passed** (`54 file(s) checked`).
- ` /home/claude/shipflow/tools/shipflow_metadata_lint.py shipflow_data contentflow_app/shipflow_data contentflow_lab/shipflow_data contentflow_site/shipflow_data`
  - Result: **passed** (`97 file(s) checked`).

### Git hygiene

- `git diff --check`
  - Result: **no whitespace/errors**
- `git status --short`
  - Result includes:
    - 74 renamed/moved workflow markdown files,
    - `shipflow_data/workflow/README.md` added,
    - `shipflow_data/workflow/reports/markdown-governance-inventory-2026-05-11.md` added,
    - `shipflow_data/workflow/reports/markdown-governance-security-review-2026-05-11.md` added,
    - `shipflow_data/workflow/reports/markdown-governance-migration-closure-2026-05-11.md` added,
    - workflow and guidance files (`CHANGELOG.md`, `TASKS.md`, `contentflow_app/AGENT.md`, `contentflow_app/CLAUDE.md`, `contentflow_site/shipflow_data/editorial/astro-content-schema-policy.md`) updated per next-step/reference cleanup.

## Security and classification decisions

- `blocked-security-review`: **0**
- `blocked-classification`: **0**
- All scanned sources were either:
  - safely migrated with existing policy/frontmatter, or
  - documented as migration history in reports.

## Exclusions and preserved legacy surfaces

- `contentflowz/**`: fully excluded and unchanged.
- `contentflow_site/src/content/**`: kept as runtime content and not converted to ShipFlow frontmatter.
- Trackers (`CHANGELOG.md`, `TASKS.md`, `AUDIT_LOG.md`, `TEST_LOG.md`, repo `README` files) preserved as trackers; references updated where they pointed to old governance paths.

## Rollback notes

- Rollback is constrained to workflow markdown moves only and can be redone by reversing the `git mv` operations per file/family.
- No application code files were modified in this migration batch.

# Markdown Governance Migration Closure Report

Date: 2026-05-11
Project: contentglowz
Chantier spec: `shipglowz_data/workflow/specs/SPEC-global-markdown-governance-migration-2026-05-11.md`

## Scope Executed

- `app/specs`
- `lab/specs`
- `specs`
- `app/bugs`
- `lab/bugs`
- `research`
- `docs/explorations`
- `docs/qa`
- `lab/docs`
- `lab` root governance notes
- `site/docs` (targeted spec/research copies)

## Outcome Summary

- Total migrated markdown files: **74**
- Destination distribution:
  - `shipglowz_data/workflow/specs`: **48**
  - `shipglowz_data/workflow/bugs`: **4**
  - `shipglowz_data/workflow/research`: **14**
  - `shipglowz_data/workflow/explorations`: **6**
  - `shipglowz_data/workflow/qa`: **1**
  - `shipglowz_data/workflow/reports`: **3** (plus newly added security + closure reports = 5 total now)
- Legacy tracking files and trackers kept as trackers where required.
- `contentglowz/**` was intentionally excluded from scope and left unchanged.

## Validation Evidence

### Inventory / Reference / Runtime evidence

- `find specs app/specs lab/specs lab/docs docs/explorations docs/qa research app/bugs lab/bugs site/docs -maxdepth 2 -type f -name '*.md'` (with missing directories ignored) returned no remaining in-scope legacy markdown files in those paths.

- `git diff -- contentglowz` returned empty output (no changes in `contentglowz/**`).

### Metadata lints

- ` /home/claude/shipglowz/tools/shipglowz_metadata_lint.py shipglowz_data/workflow/specs shipglowz_data/workflow/bugs shipglowz_data/workflow/research shipglowz_data/workflow/qa shipglowz_data/workflow/explorations shipglowz_data/workflow/reports`
  - Result: **passed** (`54 file(s) checked`).
- ` /home/claude/shipglowz/tools/shipglowz_metadata_lint.py shipglowz_data`
  - Result: **passed** (`97 file(s) checked`).

### Git hygiene

- `git diff --check`
  - Result: **no whitespace/errors**
- `git status --short`
  - Result includes:
    - 74 renamed/moved workflow markdown files,
    - `shipglowz_data/workflow/README.md` added,
    - `shipglowz_data/workflow/reports/markdown-governance-inventory-2026-05-11.md` added,
    - `shipglowz_data/workflow/reports/markdown-governance-security-review-2026-05-11.md` added,
    - `shipglowz_data/workflow/reports/markdown-governance-migration-closure-2026-05-11.md` added,
    - workflow and guidance files (`CHANGELOG.md`, `TASKS.md`, `app/AGENT.md`, `app/CLAUDE.md`, `shipglowz_data/editorial/site/astro-content-schema-policy.md`) updated per next-step/reference cleanup.

## Security and classification decisions

- `blocked-security-review`: **0**
- `blocked-classification`: **0**
- All scanned sources were either:
  - safely migrated with existing policy/frontmatter, or
  - documented as migration history in reports.

## Exclusions and preserved legacy surfaces

- `contentglowz/**`: fully excluded and unchanged.
- `site/src/content/**`: kept as runtime content and not converted to ShipGlowz frontmatter.
- Trackers (`CHANGELOG.md`, `TASKS.md`, `AUDIT_LOG.md`, `shipglowz_data/workflow/qa/TEST_LOG.md`, repo `README` files) preserved as trackers; references updated where they pointed to old governance paths.

## Rollback notes

- Rollback is constrained to workflow markdown moves only and can be redone by reversing the `git mv` operations per file/family.
- No application code files were modified in this migration batch.

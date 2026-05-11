# Markdown Governance Inventory Report

Date: 2026-05-11
Project: contentflow
Scope command:

```bash
find . \( -path './.git' -o -path './contentflow_site/node_modules' -o -path './contentflow_lab/.flox' -o -path './contentflow_lab/.pytest_cache' -o -path './contentflowz' \) -prune -o -type f -name '*.md' -printf '%p\n' | sort
```

## Summary

- Total Markdown files scanned: **194**
- In `shipflow_data/`: **76**
- Outside `shipflow_data/`: **118**
  - Runtime content under `contentflow_site/src/content/**`: **46**
  - Non-workflow Markdown outside `shipflow_data` and runtime: **72**
- Migration moves executed: **74** files (all via `git mv`)
- New canonical families created/updated under `shipflow_data/workflow/`

## Migration Target Distribution

| Destination Family | Count |
|-------------------|------:|
| `specs` | 47 |
| `bugs` | 4 |
| `research` | 14 |
| `explorations` | 6 |
| `qa` | 1 |
| `reports` | 2 |

## Full Source → Target Mapping

| Source path | Canonical path |
|------------|----------------|
| contentflow_app/bugs/BUG-2026-05-05-001.md | shipflow_data/workflow/bugs/contentflow_app/BUG-2026-05-05-001.md |
| contentflow_app/bugs/BUG-2026-05-05-002.md | shipflow_data/workflow/bugs/contentflow_app/BUG-2026-05-05-002.md |
| contentflow_app/specs/PRD-lifetime-deal-early-bird-payg.md | shipflow_data/workflow/specs/contentflow_app/PRD-lifetime-deal-early-bird-payg.md |
| contentflow_app/specs/SPEC-android-device-screen-capture.md | shipflow_data/workflow/specs/contentflow_app/SPEC-android-device-screen-capture.md |
| contentflow_app/specs/SPEC-android-privacy-capture-dynamic-redaction.md | shipflow_data/workflow/specs/contentflow_app/SPEC-android-privacy-capture-dynamic-redaction.md |
| contentflow_app/specs/SPEC-content-editing-full-body-preview.md | shipflow_data/workflow/specs/contentflow_app/SPEC-content-editing-full-body-preview.md |
| contentflow_app/specs/SPEC-content-editing-infrastructure.md | shipflow_data/workflow/specs/contentflow_app/SPEC-content-editing-infrastructure.md |
| contentflow_app/specs/SPEC-content-editor-multiformat.md | shipflow_data/workflow/specs/contentflow_app/SPEC-content-editor-multiformat.md |
| contentflow_app/specs/SPEC-content-pipeline-unification.md | shipflow_data/workflow/specs/contentflow_app/SPEC-content-pipeline-unification.md |
| contentflow_app/specs/SPEC-local-capture-assets-linked-to-content.md | shipflow_data/workflow/specs/contentflow_app/SPEC-local-capture-assets-linked-to-content.md |
| contentflow_app/specs/SPEC-migrate-flutter-core-majors.md | shipflow_data/workflow/specs/contentflow_app/SPEC-migrate-flutter-core-majors.md |
| contentflow_app/specs/SPEC-mobile-flow-dashboard-swipe-actions.md | shipflow_data/workflow/specs/contentflow_app/SPEC-mobile-flow-dashboard-swipe-actions.md |
| contentflow_app/specs/SPEC-offline-sync-v2.md | shipflow_data/workflow/specs/contentflow_app/SPEC-offline-sync-v2.md |
| contentflow_app/specs/SPEC-privacy-capture-post-production-review.md | shipflow_data/workflow/specs/contentflow_app/SPEC-privacy-capture-post-production-review.md |
| contentflow_app/specs/SPEC-project-flows-selection-onboarding-archive.md | shipflow_data/workflow/specs/contentflow_app/SPEC-project-flows-selection-onboarding-archive.md |
| contentflow_app/specs/SPEC-shared-privacy-capture-contract.md | shipflow_data/workflow/specs/contentflow_app/SPEC-shared-privacy-capture-contract.md |
| contentflow_app/specs/SPEC-video-script-creation-workbench.md | shipflow_data/workflow/specs/contentflow_app/SPEC-video-script-creation-workbench.md |
| contentflow_app/specs/SPEC-web-privacy-capture-dynamic-redaction.md | shipflow_data/workflow/specs/contentflow_app/SPEC-web-privacy-capture-dynamic-redaction.md |
| contentflow_app/specs/SPEC-windows-privacy-capture-dynamic-redaction.md | shipflow_data/workflow/specs/contentflow_app/SPEC-windows-privacy-capture-dynamic-redaction.md |
| contentflow_app/specs/architecture-cible-fastapi-clerk-flutter.md | shipflow_data/workflow/specs/contentflow_app/architecture-cible-fastapi-clerk-flutter.md |
| contentflow_app/specs/conversation-local-capture-assets-linked-to-content-20260505.md | shipflow_data/workflow/specs/contentflow_app/conversation-local-capture-assets-linked-to-content-20260505.md |
| contentflow_app/specs/feedback-admin-v1-contentflow.md | shipflow_data/workflow/specs/contentflow_app/feedback-admin-v1-contentflow.md |
| contentflow_app/specs/feedback-backend-contract-fastapi.md | shipflow_data/workflow/specs/contentflow_app/feedback-backend-contract-fastapi.md |
| contentflow_app/specs/foundation-scrollable-nav-affiliations.md | shipflow_data/workflow/specs/contentflow_app/foundation-scrollable-nav-affiliations.md |
| contentflow_app/specs/late-integration-finalization.md | shipflow_data/workflow/specs/contentflow_app/late-integration-finalization.md |
| contentflow_app/specs/migrate-flutter-core-majors-baseline.md | shipflow_data/workflow/specs/contentflow_app/migrate-flutter-core-majors-baseline.md |
| contentflow_app/specs/spec-no-ui-jump-on-resume.md | shipflow_data/workflow/specs/contentflow_app/spec-no-ui-jump-on-resume.md |
| contentflow_lab/AGENT_MEMORY_RESEARCH.md | shipflow_data/workflow/research/contentflow_lab/AGENT_MEMORY_RESEARCH.md |
| contentflow_lab/BACKLINK_CHECKER.md | shipflow_data/workflow/research/contentflow_lab/BACKLINK_CHECKER.md |
| contentflow_lab/CONCURRENT.md | shipflow_data/workflow/research/contentflow_lab/CONCURRENT.md |
| contentflow_lab/CONTENT_GUIDELINES.md | shipflow_data/workflow/research/contentflow_lab/CONTENT_GUIDELINES.md |
| contentflow_lab/CONTENT_INVENTORY.md | shipflow_data/workflow/research/contentflow_lab/CONTENT_INVENTORY.md |
| contentflow_lab/COST-MODEL.md | shipflow_data/workflow/research/contentflow_lab/COST-MODEL.md |
| contentflow_lab/ENVIRONMENT_SETUP.md | shipflow_data/workflow/research/contentflow_lab/ENVIRONMENT_SETUP.md |
| contentflow_lab/SPEC-branding.md | shipflow_data/workflow/specs/contentflow_lab/SPEC-branding.md |
| contentflow_lab/SPEC-competitor-analysis.md | shipflow_data/workflow/specs/contentflow_lab/SPEC-competitor-analysis.md |
| contentflow_lab/SPEC-compliance.md | shipflow_data/workflow/specs/contentflow_lab/SPEC-compliance.md |
| contentflow_lab/SPEC-content-crawling.md | shipflow_data/workflow/specs/contentflow_lab/SPEC-content-crawling.md |
| contentflow_lab/SPEC-crawlee-hybrid.md | shipflow_data/workflow/specs/contentflow_lab/SPEC-crawlee-hybrid.md |
| contentflow_lab/SPEC-mcpc-universal-mcp.md | shipflow_data/workflow/specs/contentflow_lab/SPEC-mcpc-universal-mcp.md |
| contentflow_lab/SPEC-newsletter-receiving.md | shipflow_data/workflow/specs/contentflow_lab/SPEC-newsletter-receiving.md |
| contentflow_lab/SPEC-newsletter-sending.md | shipflow_data/workflow/specs/contentflow_lab/SPEC-newsletter-sending.md |
| contentflow_lab/SPEC-seo-monitoring.md | shipflow_data/workflow/specs/contentflow_lab/SPEC-seo-monitoring.md |
| contentflow_lab/SPEC-workflow-visualization.md | shipflow_data/workflow/specs/contentflow_lab/SPEC-workflow-visualization.md |
| contentflow_lab/TOOLS.md | shipflow_data/workflow/research/contentflow_lab/TOOLS.md |
| contentflow_lab/bugs/BUG-2026-05-06-001.md | shipflow_data/workflow/bugs/contentflow_lab/BUG-2026-05-06-001.md |
| contentflow_lab/bugs/BUG-2026-05-10-001.md | shipflow_data/workflow/bugs/contentflow_lab/BUG-2026-05-10-001.md |
| contentflow_lab/docs/license-inventory.md | shipflow_data/workflow/reports/contentflow_lab/license-inventory.md |
| contentflow_lab/docs/optional-integrations.md | shipflow_data/workflow/reports/contentflow_lab/optional-integrations.md |
| contentflow_lab/specs/ANALYSIS-drip-integration-with-existing.md | shipflow_data/workflow/specs/contentflow_lab/ANALYSIS-drip-integration-with-existing.md |
| contentflow_lab/specs/DRIP_IMPLEMENTATION.md | shipflow_data/workflow/specs/contentflow_lab/DRIP_IMPLEMENTATION.md |
| contentflow_lab/specs/SPEC-backend-persona-autofill-repo-understanding-user-keys.md | shipflow_data/workflow/specs/contentflow_lab/SPEC-backend-persona-autofill-repo-understanding-user-keys.md |
| contentflow_lab/specs/SPEC-dual-mode-ai-runtime-all-providers.md | shipflow_data/workflow/specs/contentflow_lab/SPEC-dual-mode-ai-runtime-all-providers.md |
| contentflow_lab/specs/SPEC-migrate-pydantic-ai-major.md | shipflow_data/workflow/specs/contentflow_lab/SPEC-migrate-pydantic-ai-major.md |
| contentflow_lab/specs/SPEC-progressive-content-release.md | shipflow_data/workflow/specs/contentflow_lab/SPEC-progressive-content-release.md |
| contentflow_lab/specs/SPEC-strict-byok-llm-app-visible-ai.md | shipflow_data/workflow/specs/contentflow_lab/SPEC-strict-byok-llm-app-visible-ai.md |
| contentflow_lab/specs/social-listener.md | shipflow_data/workflow/specs/contentflow_lab/social-listener.md |
| contentflow_site/docs/conversations/conversation-feature-capture-ecran-video-20260504.md | shipflow_data/workflow/research/contentflow_site/conversation-feature-capture-ecran-video-20260504.md |
| contentflow_site/docs/copywriting/parcours-client.md | shipflow_data/workflow/research/contentflow_site/parcours-client.md |
| contentflow_site/docs/copywriting/persona.md | shipflow_data/workflow/research/contentflow_site/persona.md |
| contentflow_site/docs/copywriting/strategie.md | shipflow_data/workflow/research/contentflow_site/strategie.md |
| contentflow_site/docs/spec-i18n-structure.md | shipflow_data/workflow/research/contentflow_site/spec-i18n-structure.md |
| contentflow_site/specs/SPEC-migrate-astro-v6.md | shipflow_data/workflow/specs/contentflow_site/SPEC-migrate-astro-v6.md |
| docs/centraliser-design-tokens-contentflow-app-site.md | shipflow_data/workflow/specs/monorepo/centraliser-design-tokens-contentflow-app-site.md |
| docs/explorations/2026-05-06-screen-text-obfuscation.md | shipflow_data/workflow/explorations/2026-05-06-screen-text-obfuscation.md |
| docs/explorations/2026-05-08-ios-privacy-capture-redaction.md | shipflow_data/workflow/explorations/2026-05-08-ios-privacy-capture-redaction.md |
| docs/explorations/2026-05-08-linux-privacy-capture-redaction.md | shipflow_data/workflow/explorations/2026-05-08-linux-privacy-capture-redaction.md |
| docs/explorations/2026-05-08-macos-privacy-capture-redaction.md | shipflow_data/workflow/explorations/2026-05-08-macos-privacy-capture-redaction.md |
| docs/explorations/2026-05-08-web-privacy-capture-redaction.md | shipflow_data/workflow/explorations/2026-05-08-web-privacy-capture-redaction.md |
| docs/explorations/2026-05-08-windows-privacy-capture-redaction.md | shipflow_data/workflow/explorations/2026-05-08-windows-privacy-capture-redaction.md |
| docs/qa/privacy-capture-platform-matrix.md | shipflow_data/workflow/qa/contentflow_lab/privacy-capture-platform-matrix.md |
| research/android-privacy-screen-redaction-technologies.md | shipflow_data/workflow/research/contentflow_other/android-privacy-screen-redaction-technologies.md |
| specs/SPEC-shipflow-data-governance-multi-repo-2026-05-10.md | shipflow_data/workflow/specs/monorepo/SPEC-shipflow-data-governance-multi-repo-2026-05-10.md |
| specs/SPEC-user-imap-email-source-to-idea-pool-2026-05-10.md | shipflow_data/workflow/specs/monorepo/SPEC-user-imap-email-source-to-idea-pool-2026-05-10.md |

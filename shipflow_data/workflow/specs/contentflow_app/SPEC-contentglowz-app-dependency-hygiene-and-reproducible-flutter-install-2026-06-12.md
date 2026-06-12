---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "contentglowz_app"
created: "2026-06-12"
created_at: "2026-06-12 12:54:44 UTC"
updated: "2026-06-12"
updated_at: "2026-06-12 13:42:00 UTC"
status: "ready"
source_skill: 100-sf-spec
source_model: "GPT-5 Codex"
scope: "audit-fix"
owner: "Diane"
user_story: "En tant que mainteneur de contentglowz_app, je veux nettoyer les dépendances Flutter inutiles et rendre l'installation Flutter de build reproductible, afin de réduire le risque supply-chain, la dette de maintenance et les futures migrations cassantes sans changer le comportement produit."
risk_level: "medium"
security_impact: "yes"
docs_impact: "yes"
linked_systems:
  - "contentglowz_app/pubspec.yaml"
  - "contentglowz_app/pubspec.lock"
  - "contentglowz_app/scripts/vercel-install.sh"
  - "contentglowz_app/scripts/vercel-build.sh"
  - "contentglowz_app/build.sh"
  - "contentglowz_app/pm2-web.sh"
  - "contentglowz_app/.github/dependabot.yml"
  - "contentglowz_app/.flutter-version"
  - "contentglowz_app/lib/"
  - "contentglowz_app/test/"
depends_on:
  - artifact: "contentglowz_app/CLAUDE.md"
    artifact_version: "unknown"
    required_status: "reviewed"
  - artifact: "shipflow_data/workflow/specs/contentflow_app/SPEC-migrate-flutter-core-majors.md"
    artifact_version: "1.1.0"
    required_status: "ready"
  - artifact: "shipflow_data/workflow/specs/contentflow_app/SPEC-record-package-migration-flutter-3-41.md"
    artifact_version: "1.0.0"
    required_status: "draft"
supersedes: []
evidence:
  - "Dependency audit on 2026-06-12 found 4 direct dependencies with no imports in `lib/` or `test/`: `riverpod_annotation`, `json_annotation`, `cached_network_image`, `responsive_framework`."
  - "`contentglowz_app` has no generated `*.g.dart` files and no `@riverpod` / `@JsonSerializable` usage in the repo."
  - "`flutter pub outdated` on 2026-06-12 reported 34 locked updates; direct patch/minor candidates include `audioplayers`, `go_router`, `google_fonts`, `sentry_flutter`, and `build_runner`."
  - "`scripts/vercel-install.sh` currently clones Flutter from the moving `stable` branch at build time."
  - "OSV direct-package batch query on 2026-06-12 returned no advisories for the locked direct Pub packages queried."
  - "Pub lockfile is committed and includes hosted SHA256 checksums."
next_step: "/102-sf-start contentglowz_app dependency hygiene and reproducible Flutter install"
---

# Spec: contentglowz_app dependency hygiene and reproducible Flutter install

🟠 [contentglowz_app] spec: dependency hygiene and reproducible Flutter install | status: ready | path: shipflow_data/workflow/specs/contentflow_app/SPEC-contentglowz-app-dependency-hygiene-and-reproducible-flutter-install-2026-06-12.md | next: /102-sf-start contentglowz_app dependency hygiene and reproducible Flutter install

## Title

contentglowz_app dependency hygiene and reproducible Flutter install

## Status

Ready for implementation start. This chantier turns the 2026-06-12 dependency audit into an implementation contract that covers three bounded outcomes:

1. remove truly unused direct Flutter dependencies and any dead codegen stack they imply,
2. harden the Vercel Flutter install/build path so builds are reproducible and not tied to a floating Git clone of `stable`,
3. apply safe patch/minor dependency updates only after the manifest and install path are coherent.

## User Story

En tant que mainteneur de `contentglowz_app`, je veux nettoyer les dépendances Flutter inutiles et rendre l'installation Flutter de build reproductible, afin de réduire le risque supply-chain, la dette de maintenance et les futures migrations cassantes sans changer le comportement produit.

## Minimal Behavior Contract

Quand le mainteneur exécute ce chantier, l’application doit continuer à se résoudre, s’analyser, se tester et se builder avec les mêmes flows métier visibles qu’avant; seules les dépendances mortes, la chaîne d’installation Flutter non reproductible, et les patch/minor updates clairement sûres doivent changer. Si une dépendance supposée morte est en réalité utilisée par génération de code, build script, ou contrat implicite, elle ne doit pas être retirée silencieusement: le chantier doit le prouver, la conserver, ou réduire explicitement le scope. L’edge case le plus facile à rater est une dépendance qui n’a aucun import dans `lib/` ou `test/` mais qui reste requise par un outil de build, une génération de code, ou une validation CI peu visible.

## Success Behavior

- `pubspec.yaml` et `pubspec.lock` ne gardent plus de dépendances directes mortes prouvées inutiles.
- Si la pile codegen (`build_runner`, `json_serializable`, `riverpod_generator`) n’a aucune surface réelle, elle est retirée proprement; sinon elle est conservée avec justification documentée.
- Le script d’installation Vercel n’utilise plus `git clone --branch stable` comme source flottante du SDK Flutter en build.
- La version Flutter utilisée pour les builds automatisés est explicitement pinée ou récupérée depuis une source versionnée/reproductible.
- Les commandes `flutter pub get`, `flutter analyze`, les tests ciblés pertinents et un build web passent après chaque lot critique.
- Les flows app sensibles au bootstrap, auth web Clerk, offline state, routing, feedback audio et capture continuent de compiler et de garder leur contrat visible.
- Les patch/minor updates appliquées restent limitées aux versions sûres résolubles; aucune major n’est introduite dans ce chantier.

## Error Behavior

- Si une dépendance supposée morte casse la compilation, les tests, le build web ou un script de déploiement, la suppression est rollbackée et la dépendance est documentée comme encore vivante.
- Si la stratégie de pinning Flutter proposée dépend d’un comportement Vercel ou Flutter contredit par la doc officielle actuelle, le chantier s’arrête avant mutation et route vers révision de spec.
- Si une patch/minor update provoque un changement d’API ou de comportement non trivial, ce package est exclu du lot et rerouté vers un chantier séparé de migration.
- Si la suppression de la pile codegen révèle des fichiers générés manquants ou une génération implicite non détectée, le lot passe en partiel/bloqué jusqu’à preuve complète.
- Si le build reproductible exige un secret, un binaire privé, ou une source non revue, ce chantier ne shippe pas en “succès silencieux”.

## Problem

L’audit dépendances du 2026-06-12 a trouvé trois problèmes cohérents mais répartis sur plusieurs surfaces:

- plusieurs dépendances directes Flutter semblent mortes (`riverpod_annotation`, `json_annotation`, `cached_network_image`, `responsive_framework`);
- le chemin d’installation Vercel clone Flutter depuis la branche mouvante `stable`, ce qui affaiblit la reproductibilité et la confiance supply-chain;
- le lockfile contient un nombre élevé de patch/minor updates en attente, ce qui augmente la dette et complique les prochains vrais chantiers de migration.

Le risque n’est pas un CVE immédiat prouvé; le risque est un drift progressif: manifest incohérent, tooling mort qui reste installé, builds non reproductibles, et futures migrations plus fragiles parce que la base n’a pas été nettoyée.

## Solution

Exécuter le travail en trois lots dépendants:

1. **Manifest reality check**: prouver quelles dépendances et quel tooling sont réellement utilisés.
2. **Build trust hardening**: remplacer la récupération flottante du SDK Flutter par une stratégie reproductible alignée avec la doc officielle Flutter et les capacités Vercel.
3. **Safe currency pass**: appliquer uniquement les patch/minor updates non cassantes après nettoyage et validation.

Le chantier préfère la plus petite implémentation professionnelle complète: pas de refonte CI globale, pas de major upgrades, pas de refactor applicatif hors besoin démontré.

## Scope In

- `contentglowz_app/pubspec.yaml`
- `contentglowz_app/pubspec.lock`
- `contentglowz_app/scripts/vercel-install.sh`
- `contentglowz_app/scripts/vercel-build.sh`
- `contentglowz_app/build.sh`
- `contentglowz_app/pm2-web.sh`
- `contentglowz_app/.flutter-version`
- validation des imports/usages sous `contentglowz_app/lib/` et `contentglowz_app/test/`
- documentation locale si la stratégie d’installation ou les commandes changent réellement

## Scope Out

- Toute mise à jour majeure de package Pub
- Toute migration Flutter SDK majeure du projet au-delà du pinning/reproductibility concerné
- Toute refonte UI/UX ou design-system
- Toute mutation backend, Turso, FastAPI, Remotion, ou site Astro
- Toute nouvelle automation de release plus large que le besoin de build reproductible de `contentglowz_app`
- Toute suppression agressive de dépendances sans preuve de non-usage

## Constraints

- Ne jamais auto-upgrader de major version dans ce chantier.
- Garder les sources de packages sur `pub.dev`; pas de `git`/`path` dependency ajoutée pour contourner un problème.
- Respecter `CLAUDE.md`: aucune modification ne doit casser les surfaces Flutter partagées, l’auth web Clerk, ou le mode dégradé/offline.
- Le worktree est déjà sale sur d’autres surfaces du monorepo; ne pas revert des changements non liés.
- Toute stratégie d’installation Flutter doit rester compatible avec le modèle de build Vercel actuel du repo.
- Le chantier doit prouver le comportement avec des commandes locales; ne pas demander à l’opératrice de vérifier des logs que l’agent peut lire lui-même.
- Aucune conclusion “unused” n’est acceptable sans vérifier imports, génération de code, scripts, et dépendances de build.
- La source de vérité Flutter SDK doit être unique et vérifiée: `contentglowz_app/.flutter-version`. `scripts/vercel-install.sh` ne doit jamais retomber sur une valeur flottante ou sur `stable` en l’absence de version explicite.

## Test Contract

Surface / stack profile: Flutter app with web build, Vercel shell scripts, Pub dependency graph, auth-adjacent bootstrap and device-adjacent features.

Automated proof available:
- `flutter pub get`
- `flutter pub outdated`
- `flutter analyze`
- targeted `flutter test` files covering touched flows
- `flutter build web --release` where environment preconditions can be satisfied

Non-automated proof required:
- review of generated dependency diff and script diff for trust/reproducibility
- if build commands change materially, one smoke confirmation of the intended Vercel-compatible path

Ordered proof path:
1. dependency graph and source-usage proof
2. manifest mutation proof (`flutter pub get`)
3. static proof (`flutter analyze`)
4. targeted test proof for touched flows
5. build/web proof
6. optional deployment/log proof only if the install strategy changes in a way not fully provable locally

Exceptions:
- `flutter build web --release` may be `exception-with-proof` if required secrets like `CLERK_PUBLISHABLE_KEY` are unavailable in the active environment; the run must still prove that the install/build scripts are syntactically and structurally coherent.

## Dependencies

Internal:
- `contentglowz_app/CLAUDE.md`
- `shipflow_data/workflow/specs/contentflow_app/SPEC-migrate-flutter-core-majors.md`
- `shipflow_data/workflow/specs/contentflow_app/SPEC-record-package-migration-flutter-3-41.md`
- `contentglowz_app/.github/dependabot.yml`

External freshness verdict: `fresh-docs checked`

Official sources consulted on 2026-06-12:
- Flutter upgrade docs: https://docs.flutter.dev/install/upgrade
- Flutter SDK archive docs: https://docs.flutter.dev/install/archive
- Flutter manual install docs: https://docs.flutter.dev/install/manual
- Flutter CLI reference (`flutter pub get`, `flutter pub outdated`, `flutter pub upgrade`): https://docs.flutter.dev/reference/flutter-cli
- Flutter package usage docs: https://docs.flutter.dev/packages-and-plugins/using-packages
- Vercel build configuration docs: https://vercel.com/docs/builds/configure-a-build
- Vercel builds overview: https://vercel.com/docs/builds
- Vercel project configuration docs: https://vercel.com/docs/project-configuration

External rules that affect this spec:
- Flutter docs explicitly support `flutter pub outdated` and `flutter pub upgrade` for dependency currency decisions.
- Flutter docs expose the SDK archive/manual install path, which supports version-pinned SDK retrieval instead of a floating branch clone.
- Vercel docs confirm build/install commands are configurable, so a pinned custom install/build strategy is a valid contract surface here.

## Invariants

- `contentglowz_app` remains buildable as a Flutter web app with the same product flows.
- No auth/session contract changes are introduced.
- No offline storage schema or queue behavior changes are introduced.
- No new package source outside trusted hosted Pub artifacts is introduced.
- Dependabot coverage for `pub` and GitHub Actions remains intact.
- Lockfile integrity via hosted checksums remains present after updates.

## Links & Consequences

- This chantier is upstream of future dependency migrations because it reduces false positives and dead weight before riskier upgrades.
- It intersects the existing `record` migration spec because dead codegen/tooling cleanup must not accidentally mask audio-related dependency changes.
- A stronger Flutter install contract improves deploy repeatability and makes future CI/build failures easier to reason about.
- If safe patch/minor updates uncover hidden API drift, follow-up work likely belongs in `/404-sf-migrate` or a narrower package-specific spec.

## Documentation Coherence

- Update `contentglowz_app/README.md` or local build docs only if the Flutter install/build workflow used by maintainers actually changes.
- If the chosen install strategy depends on a pinned version variable or archive URL, document the single source of truth for that version.
- If a dependency thought dead is intentionally kept for hidden tooling reasons, capture that rationale in the spec execution notes or follow-up docs to avoid repeating the audit ambiguity.

## Edge Cases

- `cached_network_image` may be referenced only in archived/dead code or future-facing comments, not imports.
- `json_annotation` may look unused while only transitive codegen still requires it indirectly.
- `riverpod_annotation` and `riverpod_generator` may remain as migration residue from a previous plan but have zero live codegen usage today.
- A pinned Flutter version may mismatch the local developer SDK if the single source of truth is not chosen carefully.
- `flutter build web` may need secrets to fully complete even if dependency/install logic is otherwise sound.

## Implementation Tasks

- [ ] Tâche 1: Prouver l’usage réel des dépendances directes suspectes
  - Fichier : `contentglowz_app/pubspec.yaml`
  - Action : vérifier imports, fichiers générés, annotations, scripts et besoins build pour `riverpod_annotation`, `json_annotation`, `cached_network_image`, `responsive_framework`, puis classer chaque package en `dead`, `live`, ou `uncertain`.
  - User story link : éviter de garder des dépendances mortes ou d’en casser une encore utile.
  - Depends on : aucune
  - Validate with : `rg` ciblé sur `lib/`, `test/`, scripts, et présence/absence de `*.g.dart`
  - Notes : cette tâche inclut la preuve sur `build_runner`, `json_serializable`, et `riverpod_generator`.

- [ ] Tâche 2: Nettoyer le manifest et le lockfile selon la preuve du lot 1
  - Fichier : `contentglowz_app/pubspec.yaml`
  - Fichier : `contentglowz_app/pubspec.lock`
  - Action : retirer uniquement les dépendances prouvées mortes et exécuter la résolution Pub correspondante.
  - User story link : réduire la dette sans changer le comportement produit.
  - Depends on : Tâche 1
  - Validate with : `flutter pub get`
  - Notes : si une dépendance est `uncertain`, ne pas la supprimer dans ce chantier sans preuve supplémentaire.

- [ ] Tâche 3: Remplacer l’installation Flutter flottante par une stratégie reproductible
  - Fichier : `contentglowz_app/scripts/vercel-install.sh`
  - Fichier : `contentglowz_app/scripts/vercel-build.sh`
  - Action : remplacer le `git clone --branch stable` par une récupération Flutter à partir de la version déclarée dans `contentglowz_app/.flutter-version`, compatible avec le modèle de build Vercel.
  - User story link : réduire le risque supply-chain et rendre les builds explicables.
  - Depends on : Tâche 1
  - Validate with : lecture de diff + exécution du chemin d’installation ou vérification shell ciblée
  - Notes : garder le blast radius minimal; ne pas transformer ce chantier en refonte CI.

- [ ] Tâche 4: Aligner les scripts locaux sur la source de vérité Flutter si nécessaire
  - Fichier : `contentglowz_app/build.sh`
  - Fichier : `contentglowz_app/pm2-web.sh`
  - Action : si le chantier introduit une variable ou une convention unique de version Flutter, aligner les scripts locaux pour éviter deux sources de vérité contradictoires.
  - User story link : éviter un drift entre build local et build Vercel.
  - Depends on : Tâche 3
  - Validate with : revue de cohérence des scripts + commande de smoke ciblée
  - Notes : ne modifier ces scripts que si la divergence devient réelle.

- [ ] Tâche 5: Appliquer les patch/minor updates sûres et résolubles
  - Fichier : `contentglowz_app/pubspec.yaml`
  - Fichier : `contentglowz_app/pubspec.lock`
  - Action : mettre à jour seulement les packages patch/minor validés sûrs par `flutter pub outdated`, puis rerésoudre.
  - User story link : réduire la dette de currency sans ouvrir un chantier de migration.
  - Depends on : Tâche 2, Tâche 3
  - Validate with : `flutter pub outdated`, `flutter pub get`
  - Notes : si une régression de build/analyze/test survient, arrêter ce lot et déférer la dépendance ou le groupe à un migration-only spec.

- [ ] Tâche 6: Exécuter la preuve technique complète du lot
  - Fichier : `contentglowz_app/lib/`
  - Fichier : `contentglowz_app/test/`
  - Action : lancer analyze, les tests ciblés, et le build web ou son exception avec preuve, puis consigner ce qui a été effectivement démontré.
  - User story link : prouver que le nettoyage et le hardening n’ont pas cassé l’app.
  - Depends on : Tâche 5
  - Validate with : `flutter analyze`, `flutter test ...`, `flutter build web --release` ou `exception-with-proof`
  - Notes : les tests ciblés doivent couvrir les surfaces touchées par les packages mis à jour ou l’infrastructure de build.

## Acceptance Criteria

- [ ] CA1: Given the current app manifest, when the chantier finishes, then every removed direct dependency has a recorded proof of non-usage across runtime code, tests, generated files, and build scripts.
- [ ] CA2: Given the Vercel install path, when the chantier finishes, then Flutter is no longer fetched from a floating Git branch at build time and the version source is explicit and reproducible.
- [ ] CA3: Given the cleaned and updated manifest, when `flutter pub get` runs, then dependency resolution succeeds without introducing any major upgrades or non-`pub.dev` sources.
- [ ] CA4: Given the final dependency set, when analyze/tests/build proof run, then no regression is introduced in compile-time behavior for app bootstrap, routing, auth web flow, offline state, feedback audio, or capture-related code that still compiles in this repo.
- [ ] CA5: Given any dependency or update that cannot be safely removed or upgraded, when the chantier closes, then it is explicitly retained or deferred with a reason rather than silently omitted from the report.

## Test Strategy

- Baseline: `flutter --version`, `flutter pub outdated`, targeted `rg` usage audit.
- Resolution proof: `flutter pub get` after each manifest-changing lot.
- Static proof: `flutter analyze`.
- Targeted tests: run the smallest relevant Flutter tests covering touched flows after package updates.
- Build proof: `flutter build web --release` if env is available; otherwise document precise blocking env input and validate script coherence.
- Trust proof: inspect the resulting install/build scripts for pinned version source and lack of floating branch clone.
- Gate proof:
  - `test -s contentglowz_app/.flutter-version` and `cat contentglowz_app/.flutter-version`
  - `rg "FLUTTER_VERSION|branch stable" contentglowz_app/scripts/vercel-install.sh`
  - vérifier qu’un run de `flutter --version` produit la version attendue après install.

## Risks

- Medium: removing a dependency that is only implicitly required by tooling or a dormant generated path.
- Medium: introducing a pinned Flutter install strategy that diverges from how maintainers currently update the SDK locally.
- Medium: patch/minor updates may still change behavior in plugins touching web/audio/platform shims.
- Low: documentation drift if the chosen version source is not recorded clearly.

## Execution Notes

- Prefer a single source of truth for Flutter SDK version if the implementation introduces one.
- Keep the install hardening bounded: the goal is reproducibility and trust, not an all-new CI platform.
- Any package retained despite looking unused should be justified in implementation notes to prevent repeated audit churn.
- Default policy: run cleanup + install hardening + safe patch/minor pass in one lot; defer patch/minor only if the updated dependency set triggers non-trivial regression risk before or during Task 5.

## Open Questions

- Canonical Flutter SDK version source: `contentglowz_app/.flutter-version` (single source of truth). `scripts/vercel-install.sh` lira cette version et la stratégie d’installation sera explicitement reproductible.
- Patch/minor update cadence: one execution lot is allowed after Tâche 2 et Tâche 3 succeed; stop and defer when a package causes compile/test drift or API behavior change.
- `.flutter-version` seed value policy: initialize from the existing project CI pin (currently `3.32.2` in `contentglowz_app/Isa Build/build.yml`), and treat any version bump as a single documented mutation.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-06-12 12:54:44 UTC | 100-sf-spec | GPT-5 Codex | Created a new chantier spec from the dependency audit intake for `contentglowz_app`, preserving the audit evidence, proposed title, severity, and follow-up route. | draft saved | `/101-sf-ready contentglowz_app dependency hygiene and reproducible Flutter install` |
| 2026-06-12 13:03:00 UTC | 101-sf-ready | GPT-5 Codex | Reviewed the spec against readiness, adversarial, and security gates. | not ready | `/101-sf-ready contentglowz_app dependency hygiene and reproducible Flutter install` |
| 2026-06-12 13:42:00 UTC | 101-sf-ready | GPT-5 Codex | Re-reviewed the spec only for readiness blockers: canonical Flutter version source and patch/minor run policy; both are now explicitly resolved in-scope. | ready-for-102 | `/102-sf-start contentglowz_app dependency hygiene and reproducible Flutter install` |

## Current Chantier Flow

- 100-sf-spec: done
- 101-sf-ready: done
- 102-sf-start: ready
- 103-sf-verify: not launched
- 104-sf-end: not launched
- 005-sf-ship: not launched

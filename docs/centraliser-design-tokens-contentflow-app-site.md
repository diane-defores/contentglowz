---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "contentflow"
created: "2026-05-10"
created_at: "2026-05-10 08:52:41 UTC"
updated: "2026-05-10"
status: ready
updated_at: "2026-05-10 09:03:00 UTC"
source_skill: sf-spec
source_model: "GPT-5 Codex"
scope: "audit-fix"
owner: "Diane"
user_story: "En tant qu'utilisateur existant de ContentFlow, je veux une interface app et site visuellement coherente, compacte sur mobile et alignee sur les tokens de marque, afin de retrouver un produit professionnel et lisible sur tous les ecrans."
risk_level: "high"
security_impact: "none"
docs_impact: "yes"
linked_systems:
  - "contentflow_theme.json"
  - "tools/generate_app_theme_tokens.mjs"
  - "contentflow_app/lib/presentation/theme/app_theme.dart"
  - "contentflow_app/lib/presentation/theme/app_theme_tokens.dart"
  - "contentflow_app/lib/main.dart"
  - "contentflow_app/lib/presentation/**"
  - "contentflow_site/src/layouts/Layout.astro"
  - "contentflow_site/src/**"
depends_on:
  - artifact: "contentflow_app/BUSINESS.md"
    artifact_version: "1.0.0"
    required_status: "reviewed"
  - artifact: "contentflow_app/BRANDING.md"
    artifact_version: "1.0.0"
    required_status: "reviewed"
  - artifact: "contentflow_site/BRANDING.md"
    artifact_version: "1.0.0"
    required_status: "reviewed"
supersedes: []
evidence:
  - "Audit design tokens 2026-05-10: app_hardcoded_visuals=722 across Flutter presentation files."
  - "Audit design tokens 2026-05-10: site_literal_type_space_motion=223 across Astro/CSS files."
  - "Audit design tokens 2026-05-10: site_hardcoded_colors=45 remain after initial token alignment."
  - "contentflow_theme.json currently centralizes base colors, surfaces, typography, radius, shadow and motion only."
  - "contentflow_app/lib/main.dart currently applies mobile compaction through global TextScaler.linear(0.88) and VisualDensity.compact."
  - "contentflow_app/lib/core/app_theme_preference.dart currently normalizes system but themeModeFromPreference(system) returns ThemeMode.light."
next_step: "/sf-start Centraliser les design tokens ContentFlow app/site"
---

# Title

Centraliser les design tokens ContentFlow app/site

## Status

Ready. Cette spec formalise le chantier issu de l'audit design tokens du 2026-05-10.

## User Story

En tant qu'utilisateur existant de ContentFlow, je veux une interface app et site visuellement coherente, compacte sur mobile et alignee sur les tokens de marque, afin de retrouver un produit professionnel et lisible sur tous les ecrans.

## Minimal Behavior Contract

Quand l'app Flutter ou le site Astro rend une page, les couleurs, surfaces, polices, espacements, rayons, ombres, durees d'animation et variantes mobile doivent provenir d'une source de tokens partagee; l'utilisateur observe une interface coherente entre le site et l'app, plus compacte sur mobile, sans changement fonctionnel des flows. Si un token manque ou si le generateur echoue, le build doit echouer clairement plutot que produire une UI partiellement desynchronisee. L'edge case facile a rater est le mode mobile: il ne doit pas etre obtenu par un simple scaling global qui casse les composants, mais par des tokens responsives explicites consommes par les pages.

## Success Behavior

- Etat de depart: `contentflow_theme.json` existe, mais ne couvre pas assez de tokens semantiques ni responsives; Flutter et Astro ont encore beaucoup de valeurs visuelles directes.
- Declencheur: un developpeur modifie les tokens partages puis regenere les sorties app/site.
- Resultat visible: l'app et le site utilisent la palette inspiree du site, un dark theme coherent, une variante "app colors", et une densite mobile plus compacte sans texte disproportionne.
- Effet systeme: les tokens Flutter generes exposent couleurs, surfaces, typo, spacing, radius, shadows, motion et breakpoints; le site consomme les memes valeurs via CSS variables; les pages n'ajoutent plus de nouveaux literals visuels hors allowlist.
- Preuve de succes: `flutter analyze`, `npm run build`, `git diff --check`, un scan anti-literals avec seuils documentes, et une verification visuelle mobile/desktop des pages critiques.

## Error Behavior

- Si `contentflow_theme.json` contient un token invalide, le generateur doit retourner une erreur explicite avec le chemin du token.
- Si une page a besoin d'une valeur visuelle non couverte, l'implementation doit ajouter un token semantique avant de modifier la page, sauf cas allowliste comme assets, dimensions media intrinseques ou demos de design.
- Si un theme systeme est selectionne, l'app doit suivre le mode OS via `ThemeMode.system`; elle ne doit pas forcer le light theme silencieusement.
- Si une migration de page degrade la lisibilite mobile, la modification doit etre corrigee avant ship; aucun echec silencieux ne doit etre accepte sur l'entree app, auth, settings, feed et navigation.
- Ce qui ne doit jamais arriver: couleur directe qui diverge de la marque, taille mobile grossie par accident, token duplique entre app et site, secret ou donnee utilisateur dans les logs de generation.

## Problem

Le chantier precedent a cree une base commune, mais elle n'est pas encore un vrai systeme de tokens unifie. L'audit a mesure 722 valeurs visuelles directes dans l'app Flutter, 223 literals de type/spacing/motion dans le site, et 45 couleurs directes restantes cote site. Le mobile reste traite par un `TextScaler` global, ce qui compactera parfois trop ou pas assez selon les composants. La preference `system` existe mais rend actuellement le light theme par defaut, donc le dark theme ne respecte pas l'OS.

## Solution

Etendre `contentflow_theme.json` en source unique semantique et responsive, renforcer le generateur pour produire des tokens Flutter complets et des CSS variables site, puis migrer les pages par lots vers ces tokens. Ajouter des garde-fous de scan pour empecher la reintroduction de literals visuels hors fichiers allowlistes.

## Scope In

- Source unique `contentflow_theme.json` pour palettes light, dark et app-color, surfaces, texte, spacing, radius, shadows, motion, breakpoints et tokens mobile.
- Generation Flutter dans `contentflow_app/lib/presentation/theme/app_theme_tokens.dart` avec helpers ou constantes pour les tokens non-couleurs.
- Generation ou injection CSS variables site depuis les memes tokens.
- Migration des fichiers Flutter UI sous `contentflow_app/lib/presentation/**` vers `Theme.of`, `AppTheme.paletteOf`, tokens de spacing/radius/typo/motion.
- Migration des fichiers Astro/CSS sous `contentflow_site/src/**` vers `var(--...)`.
- Correction de `ThemeMode.system` pour respecter le theme OS.
- Remplacement de la compaction mobile globale par des tokens responsives explicites.
- Ajout d'un script de verification anti-literals et d'une allowlist maintenable.
- Verification mobile prioritaire sur entree app/auth/settings/feed/navigation et pages site sign-in/sign-up/home/blog.

## Scope Out

- Refonte produit complete des pages ou nouveau design marketing.
- Changement des flows auth, data, sync, offline ou backend.
- Migration des artefacts de build sous `contentflow_app/build/**`.
- Normalisation exhaustive des dimensions media intrinseques, images, canvas ou exemples pedagogiques quand elles sont explicitement allowlistees.
- Ajout de nouvelle librairie UI ou remplacement de Flutter Material/Astro.
- Changement de pricing, SEO editorial ou copywriting hors coherence documentaire minimale.

## Constraints

- L'app est une surface professionnelle pour utilisateurs existants; la page d'accueil app n'est pas une page de vente.
- Le site reste la reference visuelle pour le theme principal.
- Les fichiers generes doivent rester clairement marques et regenerables.
- Aucun changement fonctionnel ne doit etre introduit dans les routes, providers, auth, offline sync ou contenus.
- Eviter les abstractions trop larges: les tokens doivent servir les usages reels avant d'ajouter des couches.
- ASCII par defaut dans les fichiers techniques, sauf contenu deja non-ASCII.
- Ne pas modifier ni revert les changements non lies deja presents dans le worktree.

## Dependencies

- Flutter Material 3, `ThemeData`, `ThemeExtension`, `ColorScheme`, `MediaQuery`.
- Astro layout global et CSS variables.
- Node.js pour `tools/generate_app_theme_tokens.mjs`.
- `contentflow_app/BUSINESS.md@1.0.0`, `contentflow_app/BRANDING.md@1.0.0`, `contentflow_site/BRANDING.md@1.0.0`.
- Fresh external docs: not needed for this spec, because the chantier uses existing local Flutter/Astro patterns and does not depend on new framework APIs, SDK behavior, auth, storage, backend, payment, or deployment contracts.

## Invariants

- Une modification de marque doit passer par `contentflow_theme.json`, pas par une page.
- Le theme principal app doit rester inspire du site.
- Le dark theme doit etre derive du light theme et garder les memes roles semantiques.
- La variante "app colors" garde les anciennes couleurs app au niveau palette mais reutilise les effets/surfaces du site.
- Les composants doivent rester accessibles: contraste suffisant, focus visible, touch targets acceptables, aucun texte coupe sur mobile.
- Les tokens responsives doivent etre explicites; ne pas utiliser un scaling global comme solution finale.

## Links & Consequences

- `contentflow_app/lib/main.dart`: impacte tous les rendus Flutter via theme, `ThemeMode` et wrapper mobile.
- `contentflow_app/lib/presentation/theme/app_theme.dart`: source runtime des themes, couleurs semantiques et extensions.
- `contentflow_app/lib/presentation/theme/app_theme_tokens.dart`: sortie generee consommee par l'app.
- `contentflow_site/src/layouts/Layout.astro`: point d'injection global des CSS variables et styles communs.
- `contentflow_site/src/pages/design.astro`: doit refléter la nouvelle palette et les tokens responsives.
- `contentflow_app/lib/presentation/screens/settings/settings_screen.dart`: doit garder les choix light/dark/system/app colors coherents.
- Regression principale: pages mobiles qui changent de hauteur, textes tronques, contrastes dark insuffisants, composants denses trop petits pour etre actionnes.

## Documentation Coherence

- Mettre a jour `contentflow_site/src/pages/design.astro` pour documenter les tokens ajoutes.
- Ajouter ou mettre a jour une note courte dans `README.md` ou `SETUP.md` sur la regeneration des tokens.
- Ajouter une entree changelog dans les changelogs pertinents si le chantier est shippe.
- Pas de changement requis dans la documentation backend, car aucun contrat API/data/auth n'est modifie.

## Edge Cases

- `ThemeMode.system` doit suivre l'OS et non forcer `ThemeMode.light`.
- Les pages avec layout dense (`feed`, `settings`, `integrations`, `entry`) peuvent casser si on remplace mécaniquement tous les `EdgeInsets`.
- Les styles de blog/site ont des dimensions editoriales; certaines tailles media peuvent rester allowlistees si elles representent un ratio ou une taille d'image, pas un token UI reutilisable.
- Les fichiers de demo design peuvent afficher des valeurs litterales comme exemples, mais doivent aussi indiquer leur token source.
- Les couleurs `Colors.transparent`, `Colors.white` et alpha overlays peuvent etre acceptees seulement dans les tokens/theme ou via helpers semantiques.

## Implementation Tasks

- [ ] Tache 1 : Etendre le schema de tokens partage
  - Fichier : `contentflow_theme.json`
  - Action : Ajouter roles semantiques (`text`, `status`, `action`, `focus`, `overlay`), tokens composants (`card`, `button`, `input`, `nav`, `badge`), tokens layout (`container`, `section`) et tokens responsives (`mobile.text`, `mobile.space`, `mobile.radius`, `breakpoints`).
  - User story link : coherence app/site et mobile compact.
  - Depends on : none.
  - Validate with : JSON parse via generateur et revue du diff.
  - Notes : Garder la palette site comme theme principal; inclure dark et app-color sans dupliquer inutilement.

- [ ] Tache 2 : Renforcer le generateur de tokens
  - Fichier : `tools/generate_app_theme_tokens.mjs`
  - Action : Valider les types de tokens, generer couleurs, doubles, durees, radius, spacing, breakpoints et listes de gradients pour Flutter; produire des erreurs explicites sur token manquant/invalide.
  - User story link : source unique fiable.
  - Depends on : Tache 1.
  - Validate with : `node tools/generate_app_theme_tokens.mjs`.
  - Notes : Ne pas ecrire de logique metier dans le generateur.

- [ ] Tache 3 : Regenerer les tokens Flutter complets
  - Fichier : `contentflow_app/lib/presentation/theme/app_theme_tokens.dart`
  - Action : Regenerer depuis le generateur; exposer seulement des constantes et helpers simples.
  - User story link : app consomme la source unique.
  - Depends on : Tache 2.
  - Validate with : `dart format contentflow_app/lib/presentation/theme/app_theme_tokens.dart`.
  - Notes : Fichier genere, ne pas editer manuellement hors exception.

- [ ] Tache 4 : Faire d'AppTheme le point d'acces unique Flutter
  - Fichier : `contentflow_app/lib/presentation/theme/app_theme.dart`
  - Action : Ajouter helpers `AppSpacing`, `AppRadii`, `AppText`, `AppMotion` ou extensions equivalentes; migrer les valeurs internes hardcodees du theme vers tokens.
  - User story link : un seul AppTheme exploitable par les pages.
  - Depends on : Tache 3.
  - Validate with : `flutter analyze`.
  - Notes : Garder `ThemeExtension` pour palette/surfaces; eviter une API verbeuse.

- [ ] Tache 5 : Corriger la preference system/dark/app-colors
  - Fichier : `contentflow_app/lib/core/app_theme_preference.dart`
  - Action : Faire retourner `ThemeMode.system` pour `system`; conserver `light`, `dark`, `app`.
  - User story link : theme sombre coherent et attendu.
  - Depends on : Tache 4.
  - Validate with : test manuel settings + `flutter analyze`.
  - Notes : Si `app` reste une variante light, le documenter dans le libelle UI.

- [ ] Tache 6 : Remplacer la compaction mobile globale par tokens responsives
  - Fichier : `contentflow_app/lib/main.dart`
  - Action : Retirer le `TextScaler.linear(0.88)` comme solution finale; fournir le breakpoint mobile via helper/theme et laisser les widgets consommer les tailles compactes.
  - User story link : mobile plus petit sans casser l'accessibilite.
  - Depends on : Tache 4.
  - Validate with : rendu mobile entry/feed/settings et `flutter analyze`.
  - Notes : Ne pas bloquer les preferences d'accessibilite systeme de l'utilisateur.

- [ ] Tache 7 : Migrer les surfaces critiques Flutter
  - Fichier : `contentflow_app/lib/presentation/screens/entry/entry_screen.dart`, `contentflow_app/lib/presentation/screens/auth/auth_screen.dart`, `contentflow_app/lib/presentation/screens/feed/feed_screen.dart`, `contentflow_app/lib/presentation/screens/settings/settings_screen.dart`, `contentflow_app/lib/presentation/widgets/in_app_tour_overlay.dart`
  - Action : Remplacer fontSize, EdgeInsets, BorderRadius, couleurs directes et durees directes par tokens/theme.
  - User story link : experience mobile et entree app professionnelle.
  - Depends on : Taches 4 et 6.
  - Validate with : `flutter analyze` et verification visuelle mobile.
  - Notes : Commencer par ces fichiers avant le reste de `presentation`.

- [ ] Tache 8 : Migrer le reste des fichiers Flutter presentation par lots
  - Fichier : `contentflow_app/lib/presentation/**/*.dart`
  - Action : Remplacer les literals visuels restants par tokens ou allowlist documentee.
  - User story link : coherence globale app.
  - Depends on : Tache 7.
  - Validate with : scan anti-literals + `flutter analyze`.
  - Notes : Ne pas toucher au comportement des providers, services ou modeles.

- [ ] Tache 9 : Centraliser les CSS variables du site
  - Fichier : `contentflow_site/src/layouts/Layout.astro`
  - Action : Injecter toutes les nouvelles variables depuis `contentflow_theme.json`, y compris mobile, composants et dark-ready tokens si utilises.
  - User story link : site reference et source partagee.
  - Depends on : Tache 1.
  - Validate with : `npm run build` dans `contentflow_site`.
  - Notes : Garder les variables lisibles et stables.

- [ ] Tache 10 : Migrer les pages et composants site vers variables
  - Fichier : `contentflow_site/src/**/*.astro`
  - Action : Remplacer couleurs, font sizes, spacing, radius, transitions et shadows directs par `var(--...)` ou allowlist.
  - User story link : coherence site/app et dette tokens reduite.
  - Depends on : Tache 9.
  - Validate with : scan anti-literals + `npm run build`.
  - Notes : Prioriser `Navbar`, `Hero`, auth pages, blog layouts et `design.astro`.

- [ ] Tache 11 : Mettre a jour la page design et la documentation de generation
  - Fichier : `contentflow_site/src/pages/design.astro`, `README.md` ou `SETUP.md`
  - Action : Documenter les palettes, tokens mobiles, variantes et commande de regeneration.
  - User story link : maintenance durable du systeme.
  - Depends on : Taches 9 et 10.
  - Validate with : `npm run build` et lecture rapide de la page design.
  - Notes : Ne pas transformer la page design en landing page.

- [ ] Tache 12 : Ajouter un garde-fou anti-literals
  - Fichier : `tools/check_design_tokens.mjs` ou script equivalent; `package.json`/docs si pertinent
  - Action : Scanner Flutter et Astro pour nouveaux `fontSize`, `EdgeInsets`, `BorderRadius.circular`, `Color(0x...)`, hex CSS, `rem/px` UI, transitions directes; appliquer une allowlist pour tokens, fichiers generes, demos et dimensions media.
  - User story link : empecher la regression.
  - Depends on : Taches 8 et 10.
  - Validate with : script retourne 0 sur le repo migre et echoue sur un cas test local.
  - Notes : Le seuil final doit etre explicite; eviter les faux positifs bloquants sur contenu non UI.

- [ ] Tache 13 : Validation finale et preuve visuelle
  - Fichier : aucun ou rapport court dans `docs/qa/`
  - Action : Executer `dart format`, `flutter analyze`, `npm run build`, `git diff --check`, scan anti-literals, puis verifier desktop/mobile les pages critiques.
  - User story link : confiance avant ship.
  - Depends on : Taches 1-12.
  - Validate with : resultats commandes + captures ou notes QA.
  - Notes : Stopper si auth/entry mobile ne montre plus les actions principales au-dessus du viewport.

## Acceptance Criteria

- [ ] CA 1 : Given un changement de couleur primaire dans `contentflow_theme.json`, when les tokens sont regeneres, then l'app Flutter et le site Astro utilisent la nouvelle couleur sans modification manuelle de page.
- [ ] CA 2 : Given un viewport mobile, when l'utilisateur ouvre la page d'entree app, then les actions de connexion/acces restent visibles au-dessus du viewport avec des polices compactes et lisibles.
- [ ] CA 3 : Given la preference theme `system`, when l'OS est en dark mode, then l'app utilise le dark theme au lieu de forcer le light theme.
- [ ] CA 4 : Given la preference `app colors`, when l'app est ouverte, then la variante palette app s'applique sans diverger des surfaces/effets du site.
- [ ] CA 5 : Given une page Flutter critique, when elle est scannee, then elle ne contient plus de literals visuels non allowlistes pour couleur, typo, spacing ou radius.
- [ ] CA 6 : Given une page site critique, when elle est scannee, then elle consomme les CSS variables pour couleur, typo, spacing, radius, shadow et motion.
- [ ] CA 7 : Given un token invalide, when le generateur est lance, then il echoue avec un message actionnable.
- [ ] CA 8 : Given une valeur visuelle necessaire mais absente, when un developpeur implemente, then il ajoute un token semantique ou une entree allowlist justifiee.
- [ ] CA 9 : Given le build final, when `flutter analyze`, `npm run build`, `git diff --check` et le scan anti-literals sont executes, then ils passent.

## Test Strategy

- Unit/Script: tester `tools/generate_app_theme_tokens.mjs` avec tokens valides et invalides si la structure le permet.
- Static: `flutter analyze` pour l'app, `npm run build` pour le site, `git diff --check`.
- Token audit: lancer le nouveau scan anti-literals et comparer les compteurs aux seuils attendus.
- Manual QA mobile: app entry/auth/feed/settings sur largeur inferieure a 600px; verifier taille texte, espacement, actions visibles et absence d'overflow.
- Manual QA desktop: site home/sign-in/sign-up/blog/design et app desktop pour verifier que la densite desktop n'a pas ete degradee.
- Accessibility sanity: verifier contraste apparent light/dark, focus visible site, touch targets principaux.

## Risks

- High: migration mecanique trop large qui casse des layouts Flutter denses.
- Medium: faux positifs du scan anti-literals qui bloquent des dimensions legitimes.
- Medium: dark theme visuellement incoherent si les overlays et surfaces ne sont pas testes.
- Medium: divergence entre tokens JSON, Dart genere et CSS variables si le generateur ne couvre pas toute la source.
- Low: documentation oubliee, rendant la maintenance du theme fragile.

## Execution Notes

- Lire d'abord `contentflow_theme.json`, `tools/generate_app_theme_tokens.mjs`, `contentflow_app/lib/presentation/theme/app_theme.dart`, `contentflow_app/lib/main.dart`, `contentflow_site/src/layouts/Layout.astro`.
- Implementer par fondations avant pages: schema tokens, generateur, theme Flutter, injection CSS, puis migrations UI.
- Garder les migrations UI en lots petits pour pouvoir attribuer les regressions visuelles a un groupe de fichiers.
- Ne pas ajouter de package sans justification; les APIs Flutter/Astro existantes suffisent.
- Stop condition: si un flow auth, offline sync, provider ou route change de comportement, sortir du scope et demander validation.
- Commandes de validation attendues: `node tools/generate_app_theme_tokens.mjs`, `dart format ...`, `flutter analyze`, `npm run build`, `git diff --check`, scan anti-literals.

## Open Questions

- Aucune question bloquante pour commencer. La decision produit principale est deja donnee: s'inspirer du site pour le theme principal, garder un dark theme derive et proposer un troisieme theme inspire des anciennes couleurs app.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-05-10 08:52:41 UTC | sf-spec | GPT-5 Codex | Creation de la spec depuis l'audit design tokens et les demandes utilisateur | Draft enregistre dans `docs/centraliser-design-tokens-contentflow-app-site.md` | `/sf-ready Centraliser les design tokens ContentFlow app/site` |
| 2026-05-10 09:03:00 UTC | sf-ready | GPT-5 Codex | Gate de complétude et de traçabilité avant démarrage de l'implémentation | Ready |
| 2026-05-10 10:55 UTC | sf-build | GPT-5 Codex | Orchestration de clôture chantier demandée par l'utilisateur | partial | `/sf-ready Centraliser les design tokens ContentFlow app/site` |
| 2026-05-10 11:26:00 UTC | sf-start | GPT-5.3 Codex | Mise en oeuvre de la centralisation: tokens partagés, générateur renforcé et bascule vers des compactages explicites | Partial |
| 2026-05-10 09:11 UTC | sf-verify | GPT-5 Codex | Verification ship-readiness du chantier tokens app/site | partial | Corriger les ecarts hors scope et completer scan anti-literals + QA visuelle |
| 2026-05-10 09:18 UTC | sf-build | GPT-5 Codex + GPT-5.3 Codex Spark | Correction autonome des ecarts sf-verify: garde admin restaure, scan anti-literals ajoute, builds ignores hors jugement | partial | Nettoyer le scope de ship des artefacts generes et changements hors chantier |
| 2026-05-10 18:31 UTC | sf-verify | GPT-5 Codex | Verification des demandes: tokens/paddings centralises et cartes icone-titre-description | partial | Corriger les cartes icone/titre, reduire les literals restants, puis relancer `/sf-verify Centraliser les design tokens ContentFlow app/site` |
| 2026-05-10 18:36 UTC | continue | GPT-5 Codex | Reprise autonome: correction des cartes site icone/titre et centralisation globale du pattern de header carte | partial | Relancer `/sf-verify Centraliser les design tokens ContentFlow app/site` apres inspection locale |
| 2026-05-10 18:56 UTC | sf-build | GPT-5 Codex | Execution complete app+site: pattern cartes titre-gauche/icone-droite + centralisation paddings/tokens sur surfaces critiques Flutter/Astro | partial | Relancer `/sf-verify Centraliser les design tokens ContentFlow app/site` puis orchestrer `/sf-end` et `/sf-ship` si verifie |

## Current Chantier Flow

- sf-spec: done, draft saved.
- sf-ready: completed, ready.
- sf-start: partial (patches app+site et baisse des literals Flutter/Site; verification lifecycle finale encore requise).
- sf-verify: partial (2026-05-10 18:31 UTC: cards icon/title pattern and remaining literal-token budgets still block closure).
- sf-end: not launched.
- sf-ship: not launched.
- sf-build: partial (run 2026-05-10 18:56 UTC: implementation app+site done, awaiting lifecycle verify/end/ship).
- Prochaine commande: relancer `/sf-verify Centraliser les design tokens ContentFlow app/site`.

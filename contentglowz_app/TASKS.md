# Tasks — contentglowz_app

🟢 [contentglowz_app] task: Retirer les dependances Flutter directes non consommees et la pile codegen associee si elle est vraiment morte (`riverpod_annotation`, `json_annotation`, `cached_network_image`, `responsive_framework`, plus `build_runner`/`json_serializable`/`riverpod_generator` si confirme) | status: done | area: deps-unused-direct
🟢 [contentglowz_app] task: Durcir la chaine d'installation Vercel pour Flutter sans `git clone` flottant de `stable` et avec une version/outillage pinnes et verifies | status: done | area: deps-supply-chain-install
🟢 [contentglowz_app] task: Appliquer les mises a jour pub patch/minor non bloquantes du lot 2026-06-12 (`audioplayers`, `go_router`, `google_fonts`, `sentry_flutter`, `build_runner`) puis rerun `flutter analyze` et les tests cibles | status: done | area: deps-patch-minor-updates

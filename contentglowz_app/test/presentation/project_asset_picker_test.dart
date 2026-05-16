import 'package:contentglowz_app/data/models/project_asset.dart';
import 'package:contentglowz_app/l10n/app_localizations.dart';
import 'package:contentglowz_app/presentation/widgets/project_asset_picker.dart';
import 'package:contentglowz_app/providers/providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('shows global candidate marker in picker list', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          projectAssetLibraryProvider.overrideWith(() => _TestAssetNotifier()),
        ],
        child: MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: const Scaffold(
            body: SizedBox(
              width: 900,
              height: 500,
              child: ProjectAssetPicker(
                targetType: 'content',
                targetId: 'content-1',
                usageAction: 'select_for_content',
              ),
            ),
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();
    expect(find.text('global-shot.mp4'), findsOneWidget);
    expect(find.byIcon(Icons.public_rounded), findsOneWidget);
  });
}

class _TestAssetNotifier extends ProjectAssetLibraryNotifier {
  @override
  Future<ProjectAssetLibraryState> build() async {
    return ProjectAssetLibraryState(
      projectId: 'project-1',
      assets: [
        ProjectAsset(
          id: 'asset-1',
          projectId: 'project-1',
          userId: 'user-1',
          mediaKind: 'video',
          source: 'imported_social',
          status: 'active',
          metadata: const {'candidate_type': 'candidate_global_asset'},
          storageDescriptor: const {'provider': 'bunny'},
          fileName: 'global-shot.mp4',
          createdAt: DateTime.utc(2026, 5, 11, 18, 0),
          updatedAt: DateTime.utc(2026, 5, 11, 18, 0),
        ),
      ],
      total: 1,
    );
  }
}

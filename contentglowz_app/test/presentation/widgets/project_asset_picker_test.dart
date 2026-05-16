import 'package:contentglowz_app/data/models/project_asset.dart';
import 'package:contentglowz_app/l10n/app_localizations.dart';
import 'package:contentglowz_app/presentation/widgets/project_asset_picker.dart';
import 'package:contentglowz_app/providers/providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('renders asset row and detail action area', (tester) async {
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
    expect(find.text('cover.png'), findsOneWidget);
    expect(find.text('Select an asset'), findsOneWidget);
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
          mediaKind: 'image',
          source: 'image_robot',
          status: 'active',
          metadata: const {},
          storageDescriptor: const {'provider': 'bunny'},
          fileName: 'cover.png',
          createdAt: DateTime.utc(2026, 5, 11, 18, 0),
          updatedAt: DateTime.utc(2026, 5, 11, 18, 0),
        ),
      ],
      total: 1,
    );
  }
}

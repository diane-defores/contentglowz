import 'package:app/core/app_diagnostics.dart';
import 'package:app/data/models/video_source_intake.dart';
import 'package:app/data/services/api_service.dart';
import 'package:app/l10n/app_localizations.dart';
import 'package:app/presentation/screens/editor/video_source_intake_screen.dart';
import 'package:app/providers/providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('shows a guided source library and exactly two final actions', (
    tester,
  ) async {
    final api = _ScreenApiService();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          apiServiceProvider.overrideWithValue(api),
          appDiagnosticsProvider.overrideWithValue(AppDiagnostics()),
        ],
        child: MaterialApp(
          locale: const Locale('fr'),
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: const VideoSourceIntakeScreen(
            contentId: 'content-1',
            projectId: 'project-1',
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.scrollUntilVisible(
      find.text('Bibliothèque de sources'),
      240,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();
    expect(find.text('Bibliothèque de sources'), findsOneWidget);
    expect(find.text('cover.webp'), findsOneWidget);
    expect(find.text('Brief de campagne'), findsOneWidget);
    expect(find.text('Sources prêtes'), findsOneWidget);
    expect(find.text('Générer la vidéo'), findsOneWidget);
    expect(find.textContaining('bucket'), findsNothing);
    expect(find.textContaining('provider'), findsNothing);

    await tester.tap(find.text('Sources prêtes'));
    await tester.pumpAndSettle();
    expect(api.readyCalls, 1);
    expect(api.generateCalls, 0);

    await tester.tap(find.text('Générer la vidéo'));
    await tester.pump();
    expect(api.generateCalls, 1);
  });

  testWidgets('surfaces a shared blocking reason and retry state', (
    tester,
  ) async {
    final api = _ScreenApiService(withFailure: true);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          apiServiceProvider.overrideWithValue(api),
          appDiagnosticsProvider.overrideWithValue(AppDiagnostics()),
        ],
        child: MaterialApp(
          locale: const Locale('fr'),
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: const VideoSourceIntakeScreen(
            contentId: 'content-1',
            projectId: 'project-1',
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.scrollUntilVisible(
      find.text('Réessayer'),
      240,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();
    expect(
      find.text('1 source doit être corrigée avant de continuer.'),
      findsOneWidget,
    );
    expect(find.text('Réessayer'), findsOneWidget);
    final readyButton = tester.widget<OutlinedButton>(
      find.widgetWithText(OutlinedButton, 'Sources prêtes'),
    );
    final generateButton = tester.widget<FilledButton>(
      find.widgetWithText(FilledButton, 'Générer la vidéo'),
    );
    expect(readyButton.onPressed, isNull);
    expect(generateButton.onPressed, isNull);
  });
}

class _ScreenApiService extends ApiService {
  _ScreenApiService({this.withFailure = false}) : super(baseUrl: 'http://test');

  final bool withFailure;
  int readyCalls = 0;
  int generateCalls = 0;

  VideoSourceFolder get folder => VideoSourceFolder(
    id: 'folder-1',
    projectId: 'project-1',
    contentId: 'content-1',
    revision: 2,
    status: VideoSourceFolderStatus.collecting,
    enqueueStatus: VideoSourceEnqueueStatus.notRequested,
    sources: [
      const VideoSource(
        id: 'source-image',
        folderId: 'folder-1',
        type: VideoSourceType.binaryImage,
        status: VideoSourceStatus.ready,
        displayName: 'cover.webp',
        safeMetadata: VideoSourceSafeMetadata(mimeType: 'image/webp'),
      ),
      const VideoSource(
        id: 'source-text',
        folderId: 'folder-1',
        type: VideoSourceType.pastedText,
        status: VideoSourceStatus.ready,
        displayName: 'Brief de campagne',
        safeMetadata: VideoSourceSafeMetadata(characterCount: 420),
      ),
      if (withFailure)
        const VideoSource(
          id: 'source-failed',
          folderId: 'folder-1',
          type: VideoSourceType.publicLink,
          status: VideoSourceStatus.failed,
          displayName: 'Lien indisponible',
          errorCode: 'metadata_timeout',
        ),
    ],
  );

  @override
  Future<VideoSourceFolder> openVideoSourceFolder({
    required String projectId,
    required String contentId,
  }) async => folder;

  @override
  Future<VideoSourceFolder> markVideoSourcesReady({
    required String projectId,
    required String contentId,
    required String folderId,
    required int revision,
  }) async {
    readyCalls++;
    return folder.copyWith(
      status: VideoSourceFolderStatus.ready,
      readyRevision: revision,
    );
  }

  @override
  Future<VideoSourceGenerateResult> generateVideoFromSources({
    required String projectId,
    required String contentId,
    required VideoSourceGenerateCommand command,
  }) async {
    generateCalls++;
    return VideoSourceGenerateResult(
      folder: folder.copyWith(
        status: VideoSourceFolderStatus.ready,
        readyRevision: command.revision,
        enqueueStatus: VideoSourceEnqueueStatus.enqueued,
        canonicalRequestId: 'request-1',
      ),
      canonicalRequestId: 'request-1',
    );
  }

  @override
  Future<VideoSourceFolder> retryVideoSource({
    required String projectId,
    required String contentId,
    required String folderId,
    required String sourceId,
    required int revision,
  }) async => folder;
}

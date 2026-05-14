import 'package:contentflow_app/data/models/video_timeline.dart';
import 'package:contentflow_app/data/services/api_service.dart';
import 'package:contentflow_app/providers/providers.dart';
import 'package:contentflow_app/presentation/screens/editor/video_timeline_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

void main() {
  testWidgets('opens video timeline route', (tester) async {
    final api = _FakeVideoTimelineApiService();
    final router = GoRouter(
      initialLocation: '/editor/content-1/video',
      routes: [
        GoRoute(
          path: '/editor/:id/video',
          builder: (context, state) =>
              VideoTimelineScreen(contentId: state.pathParameters['id']!),
        ),
      ],
    );
    addTearDown(router.dispose);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [apiServiceProvider.overrideWithValue(api)],
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Timeline video'), findsOneWidget);
    expect(find.text('Intro'), findsWidgets);
  });

  testWidgets('adds text, edits text, changes duration, and saves version', (
    tester,
  ) async {
    _setLargeTestSurface(tester);
    final api = _FakeVideoTimelineApiService();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [apiServiceProvider.overrideWithValue(api)],
        child: const MaterialApp(
          home: VideoTimelineScreen(contentId: 'content-1'),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Add text clip'));
    await tester.pumpAndSettle();

    expect(find.text('Nouveau texte'), findsWidgets);
    expect(find.text('Draft changed'), findsOneWidget);

    await tester.tap(find.byTooltip('Lengthen by 1 second').last);
    await tester.pumpAndSettle();

    await tester.tap(find.byTooltip('Edit text').last);
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField), 'Titre final');
    await tester.tap(find.text('Apply'));
    await tester.pumpAndSettle();

    expect(find.text('Titre final'), findsWidgets);

    await tester.ensureVisible(find.text('Save version'));
    await tester.tap(find.text('Save version'));
    await tester.pumpAndSettle();

    expect(api.savedVersions, hasLength(1));
    final savedTextClip = api.savedVersions.single.clips.last;
    expect(savedTextClip.text, 'Titre final');
    expect(savedTextClip.durationFrames, 120);
  });
}

void _setLargeTestSurface(WidgetTester tester) {
  tester.view.devicePixelRatio = 1;
  tester.view.physicalSize = const Size(1200, 1400);
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
}

class _FakeVideoTimelineApiService extends ApiService {
  _FakeVideoTimelineApiService() : super(baseUrl: 'http://test');

  VideoTimelineResponse timeline = _timeline();
  final List<VideoTimelineDocument> savedVersions = [];

  @override
  Future<VideoTimelineResponse> createOrLoadVideoTimelineFromContent({
    required String contentId,
    String formatPreset = 'vertical_9_16',
    String? clientRequestId,
  }) async {
    return timeline;
  }

  @override
  Future<VideoTimelineVersion> createVideoTimelineVersion({
    required String timelineId,
    required int draftRevision,
    required VideoTimelineDocument timeline,
    String? baseVersionId,
    String? clientRequestId,
  }) async {
    savedVersions.add(timeline);
    final version = VideoTimelineVersion(
      versionId: 'version-${savedVersions.length + 1}',
      timelineId: timelineId,
      versionNumber: savedVersions.length + 1,
      timeline: timeline,
      rendererProps: const {},
      createdAt: DateTime.utc(2026, 5, 14, 16),
    );
    this.timeline = this.timeline.copyWith(
      draftRevision: draftRevision + 1,
      draft: timeline,
      currentVersionId: version.versionId,
      latestVersion: version,
      previewStatus: 'stale',
      finalStatus: 'stale',
      updatedAt: DateTime.utc(2026, 5, 14, 16),
    );
    return version;
  }

  @override
  Future<VideoTimelineResponse> getVideoTimeline(String timelineId) async {
    return timeline;
  }
}

VideoTimelineResponse _timeline() {
  final createdAt = DateTime.utc(2026, 5, 14, 15);
  final document = VideoTimelineDocument(
    schemaVersion: '1.0',
    formatPreset: 'vertical_9_16',
    fps: 30,
    durationFrames: 150,
    tracks: const [
      VideoTimelineTrack(
        id: 'track-text-1',
        type: 'overlay',
        order: 0,
        exclusive: false,
      ),
    ],
    clips: const [
      VideoTimelineClip(
        id: 'clip-text-1',
        trackId: 'track-text-1',
        clipType: 'text',
        startFrame: 0,
        durationFrames: 90,
        text: 'Intro',
      ),
    ],
  );
  final version = VideoTimelineVersion(
    versionId: 'version-1',
    timelineId: 'timeline-1',
    versionNumber: 1,
    timeline: document,
    rendererProps: const {},
    createdAt: createdAt,
  );
  return VideoTimelineResponse(
    timelineId: 'timeline-1',
    contentId: 'content-1',
    projectId: 'project-1',
    userId: 'user-1',
    formatPreset: 'vertical_9_16',
    currentVersionId: 'version-1',
    draftRevision: 1,
    draft: document,
    latestVersion: version,
    previewStatus: 'missing',
    finalStatus: 'missing',
    createdAt: createdAt,
    updatedAt: createdAt,
  );
}

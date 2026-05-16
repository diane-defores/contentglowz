import 'package:contentglowz_app/data/models/video_timeline.dart';
import 'package:contentglowz_app/data/services/api_service.dart';
import 'package:contentglowz_app/providers/video_timeline_provider.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('requestFinalRender blocks when local draft is dirty', () async {
    final api = _FakeVideoTimelineApiService(
      timeline: _timelineWithApprovedPreview(),
    );
    final controller = VideoTimelineController(
      apiService: api,
      contentId: 'content-1',
    );
    addTearDown(controller.dispose);
    await controller.loadFromContentId();

    controller.addTextClip();
    final job = await controller.requestFinalRender();

    expect(job, isNull);
    expect(api.finalRenderCalls, 0);
    expect(controller.state.lastError, contains('Save a clean version'));
    expect(controller.state.hasUnsavedChanges, isTrue);
  });

  test(
    'refreshJob replaces expired preview artifact URL from backend status',
    () async {
      final api = _FakeVideoTimelineApiService(
        timeline: _timelineWithApprovedPreview(),
      );
      final controller = VideoTimelineController(
        apiService: api,
        contentId: 'content-1',
      );
      addTearDown(controller.dispose);
      await controller.loadFromContentId();

      await controller.requestPreview();
      expect(
        controller.state.previewJob?.artifact?.playbackUrl,
        contains('old-token'),
      );

      await controller.refreshJob(finalRender: false);

      expect(controller.state.previewJob?.isCompleted, isTrue);
      expect(
        controller.state.previewJob?.artifact?.playbackUrl,
        contains('fresh-token'),
      );
      expect(controller.state.timeline?.previewStatus, 'completed');
    },
  );
}

class _FakeVideoTimelineApiService extends ApiService {
  _FakeVideoTimelineApiService({required this.timeline})
    : super(baseUrl: 'http://test');

  VideoTimelineResponse timeline;
  int finalRenderCalls = 0;

  @override
  Future<VideoTimelineResponse> createOrLoadVideoTimelineFromContent({
    required String contentId,
    String formatPreset = 'vertical_9_16',
    String? clientRequestId,
  }) async {
    return timeline;
  }

  @override
  Future<VideoTimelineRenderJob> requestVideoTimelinePreview({
    required String timelineId,
    required String versionId,
    String? clientRequestId,
  }) async {
    return _renderJob(
      versionId: versionId,
      status: 'completed',
      playbackUrl: 'https://assets.example.test/preview.mp4?token=old-token',
    );
  }

  @override
  Future<VideoTimelineRenderJob> requestVideoTimelineFinalRender({
    required String timelineId,
    required String versionId,
    required String previewJobId,
    String? clientRequestId,
  }) async {
    finalRenderCalls += 1;
    return _renderJob(
      versionId: versionId,
      renderMode: 'final',
      playbackUrl: 'https://assets.example.test/final.mp4?token=final-token',
    );
  }

  @override
  Future<VideoTimelineRenderJob> getVideoTimelineJob({
    required String timelineId,
    required String jobId,
  }) async {
    return _renderJob(
      versionId: 'version-1',
      status: 'completed',
      playbackUrl: 'https://assets.example.test/preview.mp4?token=fresh-token',
    );
  }
}

VideoTimelineResponse _timelineWithApprovedPreview() {
  final createdAt = DateTime.utc(2026, 5, 14, 15);
  final document = VideoTimelineDocument(
    schemaVersion: '1.0',
    formatPreset: 'vertical_9_16',
    fps: 30,
    durationFrames: 90,
    tracks: const [
      VideoTimelineTrack(
        id: 'track-overlay-1',
        type: 'overlay',
        order: 0,
        exclusive: false,
      ),
    ],
    clips: const [
      VideoTimelineClip(
        id: 'clip-text-1',
        trackId: 'track-overlay-1',
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
    approvedPreviewJobId: 'preview-job-1',
    previewApprovedAt: createdAt,
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
    previewStatus: 'completed',
    finalStatus: 'missing',
    createdAt: createdAt,
    updatedAt: createdAt,
  );
}

VideoTimelineRenderJob _renderJob({
  required String versionId,
  String renderMode = 'preview',
  String status = 'completed',
  required String playbackUrl,
}) {
  final now = DateTime.utc(2026, 5, 14, 16);
  return VideoTimelineRenderJob(
    jobId: '$renderMode-job-1',
    timelineId: 'timeline-1',
    versionId: versionId,
    renderMode: renderMode,
    status: status,
    progress: 100,
    createdAt: now,
    updatedAt: now,
    artifact: VideoTimelineArtifact(
      playbackUrl: playbackUrl,
      artifactExpiresAt: now.add(const Duration(minutes: 15)),
      retentionExpiresAt: now.add(const Duration(days: 7)),
      deletionWarningAt: now.add(const Duration(days: 6)),
      byteSize: 1024,
      mimeType: 'video/mp4',
      fileName: '$renderMode.mp4',
      renderMode: renderMode,
    ),
  );
}

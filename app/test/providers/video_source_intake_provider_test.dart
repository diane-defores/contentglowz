import 'dart:async';

import 'package:app/data/models/video_source_intake.dart';
import 'package:app/data/services/api_service.dart';
import 'package:app/providers/video_source_intake_provider.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('sources-ready and generate-now stay independent', () async {
    final api = _FakeVideoSourceApiService();
    final controller = VideoSourceIntakeController(
      apiService: api,
      key: const VideoSourceIntakeKey('project-1', 'content-1'),
      autoLoad: false,
    );
    addTearDown(controller.dispose);
    controller.replaceFolderForTest(
      _folder(status: VideoSourceFolderStatus.collecting),
    );

    await controller.markSourcesReady();
    expect(api.readyCalls, 1);
    expect(api.generateCalls, 0);

    await controller.generateVideo();
    expect(api.readyCalls, 1);
    expect(api.generateCalls, 1);
  });

  test(
    'double generate click uses one in-flight request and one key',
    () async {
      final api = _FakeVideoSourceApiService(delayGenerate: true);
      final controller = VideoSourceIntakeController(
        apiService: api,
        key: const VideoSourceIntakeKey('project-1', 'content-1'),
        autoLoad: false,
      );
      addTearDown(controller.dispose);
      controller.replaceFolderForTest(
        _folder(status: VideoSourceFolderStatus.ready),
      );

      final first = controller.generateVideo();
      final second = controller.generateVideo();
      await Future<void>.delayed(Duration.zero);

      expect(api.generateCalls, 1);
      api.completeGenerate();
      await Future.wait([first, second]);
      expect(api.generateKeys.toSet(), hasLength(1));
    },
  );

  test(
    'generation retry after controller restart keeps the same key',
    () async {
      final firstApi = _FakeVideoSourceApiService();
      final first = VideoSourceIntakeController(
        apiService: firstApi,
        key: const VideoSourceIntakeKey('project-1', 'content-1'),
        autoLoad: false,
      );
      first.replaceFolderForTest(
        _folder(status: VideoSourceFolderStatus.ready),
      );
      await first.generateVideo();
      first.dispose();

      final retryApi = _FakeVideoSourceApiService();
      final retry = VideoSourceIntakeController(
        apiService: retryApi,
        key: const VideoSourceIntakeKey('project-1', 'content-1'),
        autoLoad: false,
      );
      addTearDown(retry.dispose);
      retry.replaceFolderForTest(
        _folder(status: VideoSourceFolderStatus.ready),
      );
      await retry.generateVideo();

      expect(retryApi.generateKeys.single, firstApi.generateKeys.single);
      expect(retryApi.generateKeys.single, 'video-source-generate-folder-1-r3');
    },
  );

  test(
    'ignores a folder response after project context is invalidated',
    () async {
      final api = _FakeVideoSourceApiService(delayOpen: true);
      final controller = VideoSourceIntakeController(
        apiService: api,
        key: const VideoSourceIntakeKey('project-1', 'content-1'),
        autoLoad: false,
      );
      addTearDown(controller.dispose);

      final load = controller.load();
      await Future<void>.delayed(Duration.zero);
      controller.invalidateContext();
      api.completeOpen();
      await load;

      expect(controller.state.folder, isNull);
      expect(controller.state.isLoading, isFalse);
    },
  );
}

VideoSourceFolder _folder({required VideoSourceFolderStatus status}) {
  return VideoSourceFolder(
    id: 'folder-1',
    projectId: 'project-1',
    contentId: 'content-1',
    revision: 3,
    status: status,
    readyRevision: status == VideoSourceFolderStatus.ready ? 3 : null,
    enqueueStatus: VideoSourceEnqueueStatus.notRequested,
    sources: const [
      VideoSource(
        id: 'source-1',
        folderId: 'folder-1',
        type: VideoSourceType.binaryImage,
        status: VideoSourceStatus.ready,
        displayName: 'cover.webp',
      ),
    ],
  );
}

class _FakeVideoSourceApiService extends ApiService {
  _FakeVideoSourceApiService({
    this.delayGenerate = false,
    this.delayOpen = false,
  }) : super(baseUrl: 'http://test');

  final bool delayGenerate;
  final bool delayOpen;
  final Completer<void> _generateGate = Completer<void>();
  final Completer<void> _openGate = Completer<void>();
  int readyCalls = 0;
  int generateCalls = 0;
  final List<String> generateKeys = [];

  void completeGenerate() {
    if (!_generateGate.isCompleted) _generateGate.complete();
  }

  void completeOpen() {
    if (!_openGate.isCompleted) _openGate.complete();
  }

  @override
  Future<VideoSourceFolder> openVideoSourceFolder({
    required String projectId,
    required String contentId,
  }) async {
    if (delayOpen) await _openGate.future;
    return _folder(status: VideoSourceFolderStatus.collecting);
  }

  @override
  Future<VideoSourceFolder> markVideoSourcesReady({
    required String projectId,
    required String contentId,
    required String folderId,
    required int revision,
  }) async {
    readyCalls++;
    return _folder(status: VideoSourceFolderStatus.ready);
  }

  @override
  Future<VideoSourceGenerateResult> generateVideoFromSources({
    required String projectId,
    required String contentId,
    required VideoSourceGenerateCommand command,
  }) async {
    generateCalls++;
    generateKeys.add(command.idempotencyKey);
    if (delayGenerate) await _generateGate.future;
    return VideoSourceGenerateResult(
      folder: _folder(status: VideoSourceFolderStatus.ready).copyWith(
        enqueueStatus: VideoSourceEnqueueStatus.enqueued,
        canonicalRequestId: 'request-1',
      ),
      canonicalRequestId: 'request-1',
    );
  }
}

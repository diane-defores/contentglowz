import 'package:contentflow_app/data/models/capture_asset.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('CaptureAsset parses native metadata and serializes metadata only', () {
    final asset = CaptureAsset.fromPlatformMap({
      'id': 'capture-1',
      'kind': 'recording',
      'path': '/local/capture.mp4',
      'mimeType': 'video/mp4',
      'createdAt': 1760000000000,
      'durationMs': 12000,
      'width': 1080,
      'height': 1920,
      'byteSize': 2048,
      'microphoneEnabled': true,
      'captureScopeLabel': 'system-selected',
    });

    expect(asset.kind, CaptureKind.recording);
    expect(asset.isRecording, isTrue);
    expect(asset.durationMs, 12000);
    expect(asset.microphoneEnabled, isTrue);
    expect(asset.toJson(), isNot(contains('bytes')));
    expect(asset.toJson()['path'], '/local/capture.mp4');
  });

  test('CaptureNativeEvent parses completed asset event', () {
    final event = CaptureNativeEvent.fromPlatformMap({
      'type': 'completed',
      'asset': {
        'id': 'shot-1',
        'kind': 'screenshot',
        'path': '/local/shot.png',
        'mimeType': 'image/png',
        'createdAt': '2026-05-04T20:00:00.000Z',
        'width': 720,
        'height': 1280,
        'byteSize': 1024,
        'microphoneEnabled': false,
        'captureScopeLabel': 'system-selected',
      },
    });

    expect(event.type, CaptureEventType.completed);
    expect(event.asset?.isScreenshot, isTrue);
    expect(event.asset?.path, '/local/shot.png');
  });
}

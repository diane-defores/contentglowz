import 'package:contentglowz_app/data/models/capture_asset.dart';
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

  test('CaptureAsset keeps pro recorder metadata roundtrip compatible', () {
    final asset = CaptureAsset.fromJson({
      'id': 'capture-2',
      'kind': 'recording',
      'path': '/local/capture-2.mp4',
      'mimeType': 'video/mp4',
      'createdAt': '2026-06-12T12:00:00.000Z',
      'width': 1080,
      'height': 1920,
      'byteSize': 8192,
      'microphoneEnabled': true,
      'captureScopeLabel': 'system-selected',
      'requestedAudioMode': 'microphoneAndSystemAudio',
      'effectiveAudioMode': 'microphone',
      'requestedCameraMode': 'frontCamera',
      'effectiveCameraMode': 'screenOnly',
      'overlayConfig': {'shape': 'circle', 'size': 'medium'},
      'degradationFlags': ['camera_overlay_not_supported'],
      'startedWithForegroundOverlay': false,
      'recorderCapabilities': {
        'isSupported': true,
        'supportsScreenOnlyRecording': true,
        'supportsMicrophoneAudio': true,
        'supportsSystemAudio': false,
        'supportsPauseResume': false,
        'supportsFloatingControls': false,
        'supportsComposedCameraModes': false,
        'hasFrontCamera': true,
        'hasRearCamera': true,
        'supportsDualCamera': false,
        'requiresFreshConsent': true,
        'hasNotificationPermission': true,
        'hasMicrophonePermission': true,
      },
    });

    expect(asset.requestedAudioMode, CaptureAudioMode.microphoneAndSystemAudio);
    expect(asset.effectiveAudioMode, CaptureAudioMode.microphone);
    expect(asset.requestedCameraMode, CaptureCameraMode.frontCamera);
    expect(asset.effectiveCameraMode, CaptureCameraMode.screenOnly);
    expect(asset.overlayConfig?.shape, CaptureOverlayShape.circle);
    expect(asset.degradationFlags, ['camera_overlay_not_supported']);
    expect(asset.recorderCapabilities?.hasFrontCamera, isTrue);
    expect(asset.toJson()['requestedCameraMode'], 'frontCamera');
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

  test('CaptureNativeEvent parses recorder degradation details', () {
    final event = CaptureNativeEvent.fromPlatformMap({
      'type': 'notice',
      'message':
          'Camera overlay modes are not available in this recorder build yet.',
      'degraded': true,
      'failureCode': 'camera_overlay_not_supported',
      'effectiveAudioMode': 'microphone',
      'effectiveCameraMode': 'screenOnly',
      'overlayConfig': {'shape': 'circle', 'size': 'medium'},
      'capabilities': {
        'isSupported': true,
        'supportsScreenOnlyRecording': true,
        'supportsMicrophoneAudio': true,
        'supportsSystemAudio': false,
        'supportsPauseResume': false,
        'supportsFloatingControls': false,
        'supportsComposedCameraModes': false,
        'hasFrontCamera': true,
        'hasRearCamera': true,
        'supportsDualCamera': false,
        'requiresFreshConsent': true,
        'hasNotificationPermission': true,
        'hasMicrophonePermission': true,
      },
      'degradationFlags': ['camera_overlay_not_supported'],
    });

    expect(event.degraded, isTrue);
    expect(event.failureCode, 'camera_overlay_not_supported');
    expect(event.effectiveAudioMode, CaptureAudioMode.microphone);
    expect(event.capabilities?.supportsComposedCameraModes, isFalse);
    expect(event.degradationFlags, ['camera_overlay_not_supported']);
  });

  test('CaptureNativeEvent parses recorder state transitions', () {
    final event = CaptureNativeEvent.fromPlatformMap({
      'type': 'state',
      'state': 'paused',
      'previousState': 'recording',
      'stopReason': 'user_pause',
      'failureCode': 'none',
      'isPaused': true,
    });

    expect(event.type, CaptureEventType.state);
    expect(event.state, CaptureRecorderState.paused);
    expect(event.previousState, CaptureRecorderState.recording);
    expect(event.stopReason, 'user_pause');
    expect(event.isPaused, isTrue);
  });
}

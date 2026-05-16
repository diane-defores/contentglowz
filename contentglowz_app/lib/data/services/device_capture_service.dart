import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

import '../models/capture_asset.dart';

class CaptureSupport {
  const CaptureSupport({
    required this.isSupported,
    required this.platformLabel,
    this.reason,
  });

  final bool isSupported;
  final String platformLabel;
  final String? reason;
}

class CaptureException implements Exception {
  CaptureException(this.code, this.message);

  final String code;
  final String message;

  @override
  String toString() => '$code: $message';
}

abstract class DeviceCaptureClient {
  Stream<CaptureNativeEvent> get events;

  Future<CaptureSupport> checkSupport();

  Future<CaptureAsset> takeScreenshot();

  Future<void> startRecording({required bool includeMicrophone});

  Future<void> stopRecording();

  Future<void> shareAsset(CaptureAsset asset);

  Future<bool> deleteAsset(CaptureAsset asset);
}

class DeviceCaptureService implements DeviceCaptureClient {
  DeviceCaptureService({
    MethodChannel? methodChannel,
    EventChannel? eventChannel,
    TargetPlatform? platformOverride,
    bool? isWebOverride,
  }) : _methodChannel =
           methodChannel ?? const MethodChannel('contentglowz/device_capture'),
       _eventChannel =
           eventChannel ??
           const EventChannel('contentglowz/device_capture_events'),
       _platformOverride = platformOverride,
       _isWebOverride = isWebOverride;

  final MethodChannel _methodChannel;
  final EventChannel _eventChannel;
  final TargetPlatform? _platformOverride;
  final bool? _isWebOverride;
  Stream<CaptureNativeEvent>? _events;

  bool get _isWebRuntime => _isWebOverride ?? kIsWeb;

  TargetPlatform get _platform => _platformOverride ?? defaultTargetPlatform;

  bool get _isAndroidRuntime =>
      !_isWebRuntime && _platform == TargetPlatform.android;

  @override
  Stream<CaptureNativeEvent> get events {
    return _events ??= _eventChannel
        .receiveBroadcastStream()
        .where((event) {
          return event is Map;
        })
        .map((event) {
          return CaptureNativeEvent.fromPlatformMap(
            Map<Object?, Object?>.from(event as Map),
          );
        });
  }

  @override
  Future<CaptureSupport> checkSupport() async {
    if (!_isAndroidRuntime) {
      return CaptureSupport(
        isSupported: false,
        platformLabel: _platform.name,
        reason: 'Android device capture is not available on this platform yet.',
      );
    }
    final supported =
        await _methodChannel.invokeMethod<bool>('isSupported') ?? false;
    return CaptureSupport(
      isSupported: supported,
      platformLabel: 'android',
      reason: supported
          ? null
          : 'This Android version cannot use screen capture.',
    );
  }

  @override
  Future<CaptureAsset> takeScreenshot() async {
    _throwIfUnsupported();
    try {
      final result = await _methodChannel.invokeMethod<Object?>(
        'takeScreenshot',
        const <String, Object?>{'includeMicrophone': false},
      );
      return _assetFromResult(result);
    } on PlatformException catch (error) {
      throw CaptureException(error.code, error.message ?? 'Screenshot failed.');
    }
  }

  @override
  Future<void> startRecording({required bool includeMicrophone}) async {
    _throwIfUnsupported();
    try {
      await _methodChannel.invokeMethod<Object?>('startRecording', {
        'includeMicrophone': includeMicrophone,
      });
    } on PlatformException catch (error) {
      throw CaptureException(
        error.code,
        error.message ?? 'Screen recording failed to start.',
      );
    }
  }

  @override
  Future<void> stopRecording() async {
    _throwIfUnsupported();
    try {
      await _methodChannel.invokeMethod<Object?>('stopRecording');
    } on PlatformException catch (error) {
      throw CaptureException(
        error.code,
        error.message ?? 'Screen recording failed to stop.',
      );
    }
  }

  @override
  Future<void> shareAsset(CaptureAsset asset) async {
    _throwIfUnsupported();
    try {
      await _methodChannel.invokeMethod<Object?>('shareAsset', {
        'path': asset.path,
        'mimeType': asset.mimeType,
      });
    } on PlatformException catch (error) {
      throw CaptureException(error.code, error.message ?? 'Share failed.');
    }
  }

  @override
  Future<bool> deleteAsset(CaptureAsset asset) async {
    if (!_isAndroidRuntime) return false;
    try {
      return await _methodChannel.invokeMethod<bool>('deleteAsset', {
            'path': asset.path,
          }) ??
          false;
    } on PlatformException catch (error) {
      throw CaptureException(error.code, error.message ?? 'Delete failed.');
    }
  }

  CaptureAsset _assetFromResult(Object? result) {
    if (result is Map) {
      return CaptureAsset.fromPlatformMap(Map<Object?, Object?>.from(result));
    }
    throw CaptureException(
      'invalid_asset',
      'Native capture returned no asset.',
    );
  }

  void _throwIfUnsupported() {
    if (!_isAndroidRuntime) {
      throw CaptureException(
        'unsupported_platform',
        'Android device capture is not available on this platform yet.',
      );
    }
  }
}

enum CaptureKind { screenshot, recording }

enum CaptureAudioMode {
  screenOnly,
  microphone,
  systemAudio,
  microphoneAndSystemAudio,
}

enum CaptureCameraMode { screenOnly, frontCamera, rearCamera, dualCamera }

enum CaptureOverlayShape { circle, roundedRect }

enum CaptureOverlaySize { small, medium, large }

class CaptureOverlayConfig {
  const CaptureOverlayConfig({required this.shape, required this.size});

  final CaptureOverlayShape shape;
  final CaptureOverlaySize size;

  factory CaptureOverlayConfig.fromJson(Map<String, dynamic> json) {
    return CaptureOverlayConfig(
      shape: _overlayShapeFromString(json['shape']?.toString()),
      size: _overlaySizeFromString(json['size']?.toString()),
    );
  }

  Map<String, dynamic> toJson() {
    return {'shape': shape.name, 'size': size.name};
  }
}

class CaptureRecordingCapabilities {
  const CaptureRecordingCapabilities({
    required this.isSupported,
    required this.supportsScreenOnlyRecording,
    required this.supportsMicrophoneAudio,
    required this.supportsSystemAudio,
    required this.supportsPauseResume,
    required this.supportsFloatingControls,
    required this.supportsComposedCameraModes,
    required this.hasFrontCamera,
    required this.hasRearCamera,
    required this.supportsDualCamera,
    required this.requiresFreshConsent,
    required this.hasNotificationPermission,
    required this.hasMicrophonePermission,
    this.dualCameraHardwareHint = false,
    this.overlayPermissionGranted = false,
  });

  final bool isSupported;
  final bool supportsScreenOnlyRecording;
  final bool supportsMicrophoneAudio;
  final bool supportsSystemAudio;
  final bool supportsPauseResume;
  final bool supportsFloatingControls;
  final bool supportsComposedCameraModes;
  final bool hasFrontCamera;
  final bool hasRearCamera;
  final bool supportsDualCamera;
  final bool requiresFreshConsent;
  final bool hasNotificationPermission;
  final bool hasMicrophonePermission;
  final bool dualCameraHardwareHint;
  final bool overlayPermissionGranted;

  factory CaptureRecordingCapabilities.fromJson(Map<String, dynamic> json) {
    return CaptureRecordingCapabilities(
      isSupported: _asBool(json['isSupported']) ?? false,
      supportsScreenOnlyRecording:
          _asBool(json['supportsScreenOnlyRecording']) ?? false,
      supportsMicrophoneAudio:
          _asBool(json['supportsMicrophoneAudio']) ?? false,
      supportsSystemAudio: _asBool(json['supportsSystemAudio']) ?? false,
      supportsPauseResume: _asBool(json['supportsPauseResume']) ?? false,
      supportsFloatingControls:
          _asBool(json['supportsFloatingControls']) ?? false,
      supportsComposedCameraModes:
          _asBool(json['supportsComposedCameraModes']) ?? false,
      hasFrontCamera: _asBool(json['hasFrontCamera']) ?? false,
      hasRearCamera: _asBool(json['hasRearCamera']) ?? false,
      supportsDualCamera: _asBool(json['supportsDualCamera']) ?? false,
      requiresFreshConsent: _asBool(json['requiresFreshConsent']) ?? true,
      hasNotificationPermission:
          _asBool(json['hasNotificationPermission']) ?? false,
      hasMicrophonePermission:
          _asBool(json['hasMicrophonePermission']) ?? false,
      dualCameraHardwareHint: _asBool(json['dualCameraHardwareHint']) ?? false,
      overlayPermissionGranted:
          _asBool(json['overlayPermissionGranted']) ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'isSupported': isSupported,
      'supportsScreenOnlyRecording': supportsScreenOnlyRecording,
      'supportsMicrophoneAudio': supportsMicrophoneAudio,
      'supportsSystemAudio': supportsSystemAudio,
      'supportsPauseResume': supportsPauseResume,
      'supportsFloatingControls': supportsFloatingControls,
      'supportsComposedCameraModes': supportsComposedCameraModes,
      'hasFrontCamera': hasFrontCamera,
      'hasRearCamera': hasRearCamera,
      'supportsDualCamera': supportsDualCamera,
      'requiresFreshConsent': requiresFreshConsent,
      'hasNotificationPermission': hasNotificationPermission,
      'hasMicrophonePermission': hasMicrophonePermission,
      'dualCameraHardwareHint': dualCameraHardwareHint,
      'overlayPermissionGranted': overlayPermissionGranted,
    };
  }
}

class CaptureAsset {
  const CaptureAsset({
    required this.id,
    required this.kind,
    required this.path,
    required this.mimeType,
    required this.createdAt,
    required this.width,
    required this.height,
    required this.byteSize,
    required this.microphoneEnabled,
    required this.captureScopeLabel,
    this.durationMs,
    this.requestedAudioMode,
    this.effectiveAudioMode,
    this.requestedCameraMode,
    this.effectiveCameraMode,
    this.overlayConfig,
    this.degradationFlags = const <String>[],
    this.recorderCapabilities,
    this.startedWithForegroundOverlay = false,
  });

  final String id;
  final CaptureKind kind;
  final String path;
  final String mimeType;
  final DateTime createdAt;
  final int? durationMs;
  final int width;
  final int height;
  final int byteSize;
  final bool microphoneEnabled;
  final String captureScopeLabel;
  final CaptureAudioMode? requestedAudioMode;
  final CaptureAudioMode? effectiveAudioMode;
  final CaptureCameraMode? requestedCameraMode;
  final CaptureCameraMode? effectiveCameraMode;
  final CaptureOverlayConfig? overlayConfig;
  final List<String> degradationFlags;
  final CaptureRecordingCapabilities? recorderCapabilities;
  final bool startedWithForegroundOverlay;

  bool get isScreenshot => kind == CaptureKind.screenshot;
  bool get isRecording => kind == CaptureKind.recording;

  factory CaptureAsset.fromJson(Map<String, dynamic> json) {
    return CaptureAsset(
      id: (json['id'] ?? '').toString(),
      kind: _kindFromString(json['kind']?.toString()),
      path: (json['path'] ?? '').toString(),
      mimeType: (json['mimeType'] ?? json['mime_type'] ?? '').toString(),
      createdAt: _asDateTime(json['createdAt'] ?? json['created_at']),
      durationMs: _asInt(json['durationMs'] ?? json['duration_ms']),
      width: _asInt(json['width']) ?? 0,
      height: _asInt(json['height']) ?? 0,
      byteSize: _asInt(json['byteSize'] ?? json['byte_size']) ?? 0,
      microphoneEnabled:
          _asBool(json['microphoneEnabled'] ?? json['microphone_enabled']) ??
          false,
      captureScopeLabel:
          (json['captureScopeLabel'] ??
                  json['capture_scope_label'] ??
                  'system-selected')
              .toString(),
      requestedAudioMode: _audioModeFromString(
        json['requestedAudioMode']?.toString() ??
            json['requested_audio_mode']?.toString(),
      ),
      effectiveAudioMode: _audioModeFromString(
        json['effectiveAudioMode']?.toString() ??
            json['effective_audio_mode']?.toString(),
      ),
      requestedCameraMode: _cameraModeFromString(
        json['requestedCameraMode']?.toString() ??
            json['requested_camera_mode']?.toString(),
      ),
      effectiveCameraMode: _cameraModeFromString(
        json['effectiveCameraMode']?.toString() ??
            json['effective_camera_mode']?.toString(),
      ),
      overlayConfig: _overlayConfigFromValue(
        json['overlayConfig'] ?? json['overlay_config'],
      ),
      degradationFlags: _stringListFromValue(
        json['degradationFlags'] ?? json['degradation_flags'],
      ),
      recorderCapabilities: _capabilitiesFromValue(
        json['recorderCapabilities'] ?? json['recorder_capabilities'],
      ),
      startedWithForegroundOverlay:
          _asBool(
            json['startedWithForegroundOverlay'] ??
                json['started_with_foreground_overlay'],
          ) ??
          false,
    );
  }

  factory CaptureAsset.fromPlatformMap(Map<Object?, Object?> map) {
    return CaptureAsset.fromJson(
      map.map((key, value) => MapEntry(key.toString(), value)),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'kind': kind.name,
      'path': path,
      'mimeType': mimeType,
      'createdAt': createdAt.toIso8601String(),
      'durationMs': durationMs,
      'width': width,
      'height': height,
      'byteSize': byteSize,
      'microphoneEnabled': microphoneEnabled,
      'captureScopeLabel': captureScopeLabel,
      'requestedAudioMode': requestedAudioMode?.name,
      'effectiveAudioMode': effectiveAudioMode?.name,
      'requestedCameraMode': requestedCameraMode?.name,
      'effectiveCameraMode': effectiveCameraMode?.name,
      'overlayConfig': overlayConfig?.toJson(),
      'degradationFlags': degradationFlags,
      'recorderCapabilities': recorderCapabilities?.toJson(),
      'startedWithForegroundOverlay': startedWithForegroundOverlay,
    };
  }
}

enum CaptureEventType {
  recording,
  progress,
  completed,
  failed,
  canceled,
  notice,
}

class CaptureNativeEvent {
  const CaptureNativeEvent({
    required this.type,
    this.asset,
    this.message,
    this.reason,
    this.durationMs,
    this.maxDurationMs,
    this.microphoneEnabled,
    this.recoverable = false,
    this.isPaused,
    this.degraded = false,
    this.failureCode,
    this.effectiveAudioMode,
    this.effectiveCameraMode,
    this.overlayConfig,
    this.capabilities,
    this.degradationFlags = const <String>[],
  });

  final CaptureEventType type;
  final CaptureAsset? asset;
  final String? message;
  final String? reason;
  final int? durationMs;
  final int? maxDurationMs;
  final bool? microphoneEnabled;
  final bool recoverable;
  final bool? isPaused;
  final bool degraded;
  final String? failureCode;
  final CaptureAudioMode? effectiveAudioMode;
  final CaptureCameraMode? effectiveCameraMode;
  final CaptureOverlayConfig? overlayConfig;
  final CaptureRecordingCapabilities? capabilities;
  final List<String> degradationFlags;

  factory CaptureNativeEvent.fromPlatformMap(Map<Object?, Object?> map) {
    final json = map.map((key, value) => MapEntry(key.toString(), value));
    final assetRaw = json['asset'];
    CaptureAsset? asset;
    if (assetRaw is Map) {
      asset = CaptureAsset.fromPlatformMap(
        Map<Object?, Object?>.from(assetRaw),
      );
    }
    return CaptureNativeEvent(
      type: _eventTypeFromString(json['type']?.toString()),
      asset: asset,
      message: json['message']?.toString(),
      reason: json['reason']?.toString(),
      durationMs: _asInt(json['durationMs']),
      maxDurationMs: _asInt(json['maxDurationMs']),
      microphoneEnabled: _asBool(json['microphoneEnabled']),
      recoverable: _asBool(json['recoverable']) ?? false,
      isPaused: _asBool(json['isPaused']),
      degraded: _asBool(json['degraded']) ?? false,
      failureCode: json['failureCode']?.toString(),
      effectiveAudioMode: _audioModeFromString(
        json['effectiveAudioMode']?.toString(),
      ),
      effectiveCameraMode: _cameraModeFromString(
        json['effectiveCameraMode']?.toString(),
      ),
      overlayConfig: _overlayConfigFromValue(json['overlayConfig']),
      capabilities: _capabilitiesFromValue(json['capabilities']),
      degradationFlags: _stringListFromValue(
        json['degradationFlags'] ?? json['degradation_flags'],
      ),
    );
  }
}

CaptureAudioMode? _audioModeFromString(String? value) {
  switch (value?.toLowerCase()) {
    case 'screenonly':
    case 'screen_only':
      return CaptureAudioMode.screenOnly;
    case 'microphone':
      return CaptureAudioMode.microphone;
    case 'systemaudio':
    case 'system_audio':
      return CaptureAudioMode.systemAudio;
    case 'microphoneandsystemaudio':
    case 'microphone_and_system_audio':
      return CaptureAudioMode.microphoneAndSystemAudio;
    default:
      return null;
  }
}

CaptureCameraMode? _cameraModeFromString(String? value) {
  switch (value?.toLowerCase()) {
    case 'screenonly':
    case 'screen_only':
      return CaptureCameraMode.screenOnly;
    case 'frontcamera':
    case 'front_camera':
      return CaptureCameraMode.frontCamera;
    case 'rearcamera':
    case 'rear_camera':
      return CaptureCameraMode.rearCamera;
    case 'dualcamera':
    case 'dual_camera':
      return CaptureCameraMode.dualCamera;
    default:
      return null;
  }
}

CaptureOverlayShape _overlayShapeFromString(String? value) {
  switch (value?.toLowerCase()) {
    case 'roundedrect':
    case 'rounded_rect':
      return CaptureOverlayShape.roundedRect;
    case 'circle':
    default:
      return CaptureOverlayShape.circle;
  }
}

CaptureOverlaySize _overlaySizeFromString(String? value) {
  switch (value?.toLowerCase()) {
    case 'small':
      return CaptureOverlaySize.small;
    case 'large':
      return CaptureOverlaySize.large;
    case 'medium':
    default:
      return CaptureOverlaySize.medium;
  }
}

CaptureOverlayConfig? _overlayConfigFromValue(Object? value) {
  if (value is Map) {
    return CaptureOverlayConfig.fromJson(Map<String, dynamic>.from(value));
  }
  return null;
}

CaptureRecordingCapabilities? _capabilitiesFromValue(Object? value) {
  if (value is Map) {
    return CaptureRecordingCapabilities.fromJson(
      Map<String, dynamic>.from(value),
    );
  }
  return null;
}

List<String> _stringListFromValue(Object? value) {
  if (value is List) {
    return value.map((item) => item.toString()).toList(growable: false);
  }
  return const <String>[];
}

CaptureKind _kindFromString(String? value) {
  switch (value?.toLowerCase()) {
    case 'recording':
      return CaptureKind.recording;
    case 'screenshot':
    default:
      return CaptureKind.screenshot;
  }
}

CaptureEventType _eventTypeFromString(String? value) {
  switch (value?.toLowerCase()) {
    case 'recording':
      return CaptureEventType.recording;
    case 'completed':
      return CaptureEventType.completed;
    case 'failed':
      return CaptureEventType.failed;
    case 'canceled':
      return CaptureEventType.canceled;
    case 'notice':
      return CaptureEventType.notice;
    case 'progress':
    default:
      return CaptureEventType.progress;
  }
}

DateTime _asDateTime(Object? value) {
  if (value is DateTime) return value;
  if (value is int) return DateTime.fromMillisecondsSinceEpoch(value);
  if (value is String) {
    return DateTime.tryParse(value) ?? DateTime.fromMillisecondsSinceEpoch(0);
  }
  return DateTime.fromMillisecondsSinceEpoch(0);
}

int? _asInt(Object? value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value);
  return null;
}

bool? _asBool(Object? value) {
  if (value is bool) return value;
  if (value is String) return value.toLowerCase() == 'true';
  return null;
}

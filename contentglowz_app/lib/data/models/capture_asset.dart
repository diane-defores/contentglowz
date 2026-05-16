enum CaptureKind { screenshot, recording }

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
  });

  final CaptureEventType type;
  final CaptureAsset? asset;
  final String? message;
  final String? reason;
  final int? durationMs;
  final int? maxDurationMs;
  final bool? microphoneEnabled;
  final bool recoverable;

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
    );
  }
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

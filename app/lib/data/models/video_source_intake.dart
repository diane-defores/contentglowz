import 'dart:typed_data';

enum VideoSourceType {
  binaryVideo('binary_video'),
  binaryImage('binary_image'),
  binaryAudio('binary_audio'),
  publicLink('public_link'),
  pastedText('pasted_text'),
  unknown('unknown');

  const VideoSourceType(this.id);
  final String id;

  static VideoSourceType parse(Object? value) => values.firstWhere(
    (entry) => entry.id == value?.toString(),
    orElse: () => unknown,
  );
}

enum VideoSourceStatus {
  pendingValidation('pending_validation'),
  processing('processing'),
  ready('ready'),
  metadataUnavailable('metadata_unavailable'),
  failed('failed'),
  replacementPending('replacement_pending'),
  superseded('superseded'),
  removed('removed'),
  orphanCleanupNeeded('orphan_cleanup_needed'),
  unknown('unknown');

  const VideoSourceStatus(this.id);
  final String id;

  bool get isActive => this != superseded && this != removed;
  bool get isBlocking => isActive && this != ready;
  bool get canRetry => switch (this) {
    failed || metadataUnavailable || orphanCleanupNeeded => true,
    _ => false,
  };

  static VideoSourceStatus parse(Object? value) => values.firstWhere(
    (entry) => entry.id == value?.toString(),
    orElse: () => unknown,
  );
}

enum VideoSourceFolderStatus {
  collecting('collecting'),
  ready('ready'),
  changedAfterReady('changed_after_ready'),
  archived('archived'),
  unknown('unknown');

  const VideoSourceFolderStatus(this.id);
  final String id;

  static VideoSourceFolderStatus parse(Object? value) => values.firstWhere(
    (entry) => entry.id == value?.toString(),
    orElse: () => unknown,
  );
}

enum VideoSourceEnqueueStatus {
  notRequested('not_requested'),
  enqueuePending('enqueue_pending'),
  enqueued('enqueued'),
  enqueueFailed('enqueue_failed'),
  unknown('unknown');

  const VideoSourceEnqueueStatus(this.id);
  final String id;

  static VideoSourceEnqueueStatus parse(Object? value) => values.firstWhere(
    (entry) => entry.id == value?.toString(),
    orElse: () => unknown,
  );
}

class VideoSourceSafeMetadata {
  const VideoSourceSafeMetadata({
    this.mimeType,
    this.sizeBytes,
    this.durationMs,
    this.width,
    this.height,
    this.characterCount,
    this.snippet,
    this.publicHost,
    this.publicTitle,
    this.previewUrl,
  });

  final String? mimeType;
  final int? sizeBytes;
  final int? durationMs;
  final int? width;
  final int? height;
  final int? characterCount;
  final String? snippet;
  final String? publicHost;
  final String? publicTitle;
  final String? previewUrl;

  factory VideoSourceSafeMetadata.fromJson(Map<String, dynamic> json) {
    return VideoSourceSafeMetadata(
      mimeType: _stringOrNull(json['mimeType'] ?? json['mime_type']),
      sizeBytes: _intOrNull(json['sizeBytes'] ?? json['size_bytes']),
      durationMs: _intOrNull(json['durationMs'] ?? json['duration_ms']),
      width: _intOrNull(json['width']),
      height: _intOrNull(json['height']),
      characterCount: _intOrNull(
        json['characterCount'] ?? json['character_count'] ?? json['char_count'],
      ),
      snippet: _stringOrNull(json['snippet']),
      publicHost: _stringOrNull(
        json['publicHost'] ?? json['public_host'] ?? json['hostname'],
      ),
      publicTitle: _stringOrNull(
        json['publicTitle'] ?? json['public_title'] ?? json['title'],
      ),
      previewUrl: _stringOrNull(json['previewUrl'] ?? json['preview_url']),
    );
  }
}

class VideoSource {
  const VideoSource({
    required this.id,
    required this.folderId,
    required this.type,
    required this.status,
    required this.displayName,
    this.assetId,
    this.safeMetadata = const VideoSourceSafeMetadata(),
    this.errorCode,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String folderId;
  final VideoSourceType type;
  final VideoSourceStatus status;
  final String displayName;
  final String? assetId;
  final VideoSourceSafeMetadata safeMetadata;
  final String? errorCode;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  factory VideoSource.fromJson(Map<String, dynamic> json) {
    final metadata = Map<String, dynamic>.from(
      _map(json['safeMetadata'] ?? json['safe_metadata'] ?? json['metadata']),
    );
    metadata.putIfAbsent(
      'snippet',
      () => json['textPreview'] ?? json['text_preview'],
    );
    metadata.putIfAbsent(
      'publicHost',
      () => json['linkHostname'] ?? json['link_hostname'],
    );
    metadata.putIfAbsent(
      'previewUrl',
      () => json['previewUrl'] ?? json['preview_url'],
    );
    return VideoSource(
      id: _requiredString(json['id'], 'source id'),
      folderId: _requiredString(
        json['folderId'] ?? json['folder_id'],
        'folder id',
      ),
      type: VideoSourceType.parse(json['sourceType'] ?? json['source_type']),
      status: VideoSourceStatus.parse(json['status']),
      displayName:
          _stringOrNull(
            json['displayName'] ??
                json['display_name'] ??
                json['sourceLabel'] ??
                json['source_label'],
          ) ??
          'Source',
      assetId: _stringOrNull(json['assetId'] ?? json['asset_id']),
      safeMetadata: VideoSourceSafeMetadata.fromJson(metadata),
      errorCode: _stringOrNull(json['errorCode'] ?? json['error_code']),
      createdAt: _dateOrNull(json['createdAt'] ?? json['created_at']),
      updatedAt: _dateOrNull(json['updatedAt'] ?? json['updated_at']),
    );
  }
}

class VideoSourceFolder {
  const VideoSourceFolder({
    required this.id,
    required this.projectId,
    required this.contentId,
    required this.revision,
    required this.status,
    required this.enqueueStatus,
    required this.sources,
    this.readyRevision,
    this.canonicalRequestId,
    this.readyAt,
    this.updatedAt,
  });

  final String id;
  final String projectId;
  final String contentId;
  final int revision;
  final VideoSourceFolderStatus status;
  final int? readyRevision;
  final VideoSourceEnqueueStatus enqueueStatus;
  final String? canonicalRequestId;
  final List<VideoSource> sources;
  final DateTime? readyAt;
  final DateTime? updatedAt;

  List<VideoSource> get activeSources =>
      sources.where((source) => source.status.isActive).toList(growable: false);
  int get blockingSourceCount =>
      activeSources.where((source) => source.status.isBlocking).length;
  bool get canFinalize => activeSources.isNotEmpty && blockingSourceCount == 0;
  bool get isCurrentRevisionReady => readyRevision == revision;

  factory VideoSourceFolder.fromJson(Map<String, dynamic> json) {
    final rawSources = json['sources'] ?? json['items'];
    return VideoSourceFolder(
      id: _requiredString(json['id'] ?? json['folderId'], 'folder id'),
      projectId: _requiredString(
        json['projectId'] ?? json['project_id'],
        'project id',
      ),
      contentId: _requiredString(
        json['contentId'] ?? json['content_id'],
        'content id',
      ),
      revision: _intOrNull(json['revision']) ?? 0,
      status: VideoSourceFolderStatus.parse(json['status']),
      readyRevision: _intOrNull(
        json['readyRevision'] ?? json['ready_revision'],
      ),
      enqueueStatus: VideoSourceEnqueueStatus.parse(
        json['enqueueStatus'] ?? json['enqueue_status'] ?? 'not_requested',
      ),
      canonicalRequestId: _stringOrNull(
        json['canonicalRequestId'] ??
            json['canonical_request_id'] ??
            json['generationRequestId'] ??
            json['generation_request_id'],
      ),
      sources: rawSources is List
          ? rawSources
                .whereType<Map>()
                .map(
                  (entry) =>
                      VideoSource.fromJson(Map<String, dynamic>.from(entry)),
                )
                .toList(growable: false)
          : const <VideoSource>[],
      readyAt: _dateOrNull(json['readyAt'] ?? json['ready_at']),
      updatedAt: _dateOrNull(json['updatedAt'] ?? json['updated_at']),
    );
  }

  VideoSourceFolder copyWith({
    int? revision,
    VideoSourceFolderStatus? status,
    int? readyRevision,
    bool clearReadyRevision = false,
    VideoSourceEnqueueStatus? enqueueStatus,
    String? canonicalRequestId,
    bool clearCanonicalRequestId = false,
    List<VideoSource>? sources,
    DateTime? readyAt,
    DateTime? updatedAt,
  }) {
    return VideoSourceFolder(
      id: id,
      projectId: projectId,
      contentId: contentId,
      revision: revision ?? this.revision,
      status: status ?? this.status,
      readyRevision: clearReadyRevision
          ? null
          : (readyRevision ?? this.readyRevision),
      enqueueStatus: enqueueStatus ?? this.enqueueStatus,
      canonicalRequestId: clearCanonicalRequestId
          ? null
          : (canonicalRequestId ?? this.canonicalRequestId),
      sources: sources ?? this.sources,
      readyAt: readyAt ?? this.readyAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

class VideoSourceUploadFile {
  const VideoSourceUploadFile({
    required this.clientFileId,
    required this.fileName,
    required this.mimeType,
    required this.sizeBytes,
    this.bytes,
    this.path,
    this.readStream,
  });

  final String clientFileId;
  final String fileName;
  final String mimeType;
  final int sizeBytes;
  final Uint8List? bytes;
  final String? path;
  final Stream<List<int>>? readStream;

  Map<String, dynamic> toSessionJson() => {
    'clientFileId': clientFileId,
    'fileName': fileName,
    'mimeType': mimeType,
    'sizeBytes': sizeBytes,
  };
}

enum VideoSourceUploadTransport {
  proxy('proxy'),
  multipart('multipart'),
  presignedPut('presigned_put');

  const VideoSourceUploadTransport(this.id);
  final String id;

  static VideoSourceUploadTransport parse(Object? value) => values.firstWhere(
    (entry) => entry.id == value?.toString(),
    orElse: () => proxy,
  );
}

class VideoSourceUploadInstruction {
  const VideoSourceUploadInstruction({
    required this.clientFileId,
    required this.transport,
    required this.uploadTarget,
    this.method = 'PUT',
    this.headers = const <String, String>{},
  });

  final String clientFileId;
  final VideoSourceUploadTransport transport;
  final String uploadTarget;
  final String method;
  final Map<String, String> headers;

  factory VideoSourceUploadInstruction.fromJson(Map<String, dynamic> json) {
    _rejectProviderConfiguration(json);
    final target = _stringOrNull(
      json['uploadUrl'] ??
          json['upload_url'] ??
          json['uploadPath'] ??
          json['upload_path'],
    );
    if (target == null || target.isEmpty) {
      throw const FormatException('Opaque upload target is missing.');
    }
    final rawHeaders = _map(json['headers']);
    return VideoSourceUploadInstruction(
      clientFileId: _requiredString(
        json['clientFileId'] ?? json['client_file_id'],
        'client file id',
      ),
      transport: VideoSourceUploadTransport.parse(json['transport']),
      uploadTarget: target,
      method: _stringOrNull(json['method'])?.toUpperCase() ?? 'PUT',
      headers: rawHeaders.map(
        (key, value) => MapEntry(key, value?.toString() ?? ''),
      ),
    );
  }
}

class VideoSourceUploadSession {
  const VideoSourceUploadSession({
    required this.sessionId,
    required this.sourceId,
    required this.transport,
    required this.expiresAt,
    this.uploadUrl,
    this.parts = const <VideoSourceUploadPart>[],
  });

  final String sessionId;
  final String sourceId;
  final VideoSourceUploadTransport transport;
  final DateTime expiresAt;
  final String? uploadUrl;
  final List<VideoSourceUploadPart> parts;

  factory VideoSourceUploadSession.fromJson(Map<String, dynamic> json) {
    _rejectProviderConfiguration(json);
    final raw = json['parts'];
    return VideoSourceUploadSession(
      sessionId: _requiredString(
        json['sessionId'] ?? json['session_id'] ?? json['id'],
        'upload session id',
      ),
      sourceId: _requiredString(
        json['sourceId'] ?? json['source_id'],
        'source id',
      ),
      transport: VideoSourceUploadTransport.parse(
        json['strategy'] ?? json['transport'],
      ),
      expiresAt:
          _dateOrNull(json['expiresAt'] ?? json['expires_at']) ??
          DateTime.fromMillisecondsSinceEpoch(0, isUtc: true),
      uploadUrl: _stringOrNull(json['uploadUrl'] ?? json['upload_url']),
      parts: raw is List
          ? raw
                .whereType<Map>()
                .map(
                  (entry) => VideoSourceUploadPart.fromJson(
                    Map<String, dynamic>.from(entry),
                  ),
                )
                .toList(growable: false)
          : const <VideoSourceUploadPart>[],
    );
  }
}

class VideoSourceUploadPart {
  const VideoSourceUploadPart({
    required this.partNumber,
    required this.sizeBytes,
    this.uploadUrl,
    this.headers = const <String, String>{},
  });

  final int partNumber;
  final String? uploadUrl;
  final int sizeBytes;
  final Map<String, String> headers;

  factory VideoSourceUploadPart.fromJson(Map<String, dynamic> json) {
    _rejectProviderConfiguration(json);
    final rawHeaders = _map(json['headers']);
    return VideoSourceUploadPart(
      partNumber: _intOrNull(json['partNumber'] ?? json['part_number']) ?? 0,
      uploadUrl: _stringOrNull(json['uploadUrl'] ?? json['upload_url']),
      sizeBytes: _intOrNull(json['sizeBytes'] ?? json['size_bytes']) ?? 0,
      headers: rawHeaders.map(
        (key, value) => MapEntry(key, value?.toString() ?? ''),
      ),
    );
  }
}

class VideoSourceGenerateCommand {
  const VideoSourceGenerateCommand({
    required this.folderId,
    required this.revision,
    required this.idempotencyKey,
  });

  final String folderId;
  final int revision;
  final String idempotencyKey;

  Map<String, dynamic> toJson() => {
    'folderId': folderId,
    'revision': revision,
    'idempotencyKey': idempotencyKey,
  };
}

class VideoSourceGenerateResult {
  const VideoSourceGenerateResult({
    required this.folder,
    this.canonicalRequestId,
  });

  final VideoSourceFolder folder;
  final String? canonicalRequestId;

  factory VideoSourceGenerateResult.fromJson(Map<String, dynamic> json) {
    final folderJson = _map(json['folder']);
    return VideoSourceGenerateResult(
      folder: VideoSourceFolder.fromJson(folderJson),
      canonicalRequestId: _stringOrNull(
        json['canonicalRequestId'] ?? json['canonical_request_id'],
      ),
    );
  }
}

void _rejectProviderConfiguration(Map<String, dynamic> json) {
  const forbidden = <String>{
    'provider',
    'bucket',
    'bucketname',
    'objectkey',
    'storagekey',
    'bunnystoragekey',
    'bunnycdnhostname',
    'awsaccesskeyid',
    'awssecretaccesskey',
  };
  for (final key in json.keys) {
    final normalized = key.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '');
    if (forbidden.contains(normalized)) {
      throw FormatException('Provider configuration is forbidden: $key');
    }
  }
}

Map<String, dynamic> _map(Object? value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return Map<String, dynamic>.from(value);
  return const <String, dynamic>{};
}

String _requiredString(Object? value, String label) {
  final parsed = _stringOrNull(value);
  if (parsed == null || parsed.isEmpty) {
    throw FormatException('Missing $label.');
  }
  return parsed;
}

String? _stringOrNull(Object? value) {
  if (value == null) return null;
  final parsed = value.toString().trim();
  return parsed.isEmpty ? null : parsed;
}

int? _intOrNull(Object? value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value?.toString() ?? '');
}

DateTime? _dateOrNull(Object? value) {
  if (value is DateTime) return value;
  return DateTime.tryParse(value?.toString() ?? '');
}

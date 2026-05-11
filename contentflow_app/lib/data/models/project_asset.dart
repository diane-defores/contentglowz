class ProjectAsset {
  const ProjectAsset({
    required this.id,
    required this.projectId,
    required this.userId,
    required this.mediaKind,
    required this.source,
    required this.status,
    required this.metadata,
    required this.storageDescriptor,
    required this.createdAt,
    required this.updatedAt,
    this.sourceAssetId,
    this.contentAssetId,
    this.mimeType,
    this.fileName,
    this.storageUri,
    this.tombstonedAt,
    this.cleanupEligibleAt,
  });

  final String id;
  final String projectId;
  final String userId;
  final String? sourceAssetId;
  final String? contentAssetId;
  final String mediaKind;
  final String source;
  final String? mimeType;
  final String? fileName;
  final String? storageUri;
  final Map<String, dynamic> storageDescriptor;
  final String status;
  final Map<String, dynamic> metadata;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? tombstonedAt;
  final DateTime? cleanupEligibleAt;

  factory ProjectAsset.fromJson(Map<String, dynamic> json) {
    return ProjectAsset(
      id: (json['id'] ?? '').toString(),
      projectId: (json['projectId'] ?? json['project_id'] ?? '').toString(),
      userId: (json['userId'] ?? json['user_id'] ?? '').toString(),
      sourceAssetId: _asStringOrNull(
        json['sourceAssetId'] ?? json['source_asset_id'],
      ),
      contentAssetId: _asStringOrNull(
        json['contentAssetId'] ?? json['content_asset_id'],
      ),
      mediaKind: (json['mediaKind'] ?? json['media_kind'] ?? '').toString(),
      source: (json['source'] ?? '').toString(),
      mimeType: _asStringOrNull(json['mimeType'] ?? json['mime_type']),
      fileName: _asStringOrNull(json['fileName'] ?? json['file_name']),
      storageUri: _asStringOrNull(json['storageUri'] ?? json['storage_uri']),
      storageDescriptor: _asMap(
        json['storageDescriptor'] ?? json['storage_descriptor'],
      ),
      status: (json['status'] ?? '').toString(),
      metadata: _asMap(json['metadata']),
      createdAt: _asDateTime(json['createdAt'] ?? json['created_at']),
      updatedAt: _asDateTime(json['updatedAt'] ?? json['updated_at']),
      tombstonedAt: _asDateTimeOrNull(
        json['tombstonedAt'] ?? json['tombstoned_at'],
      ),
      cleanupEligibleAt: _asDateTimeOrNull(
        json['cleanupEligibleAt'] ?? json['cleanup_eligible_at'],
      ),
    );
  }
}

class ProjectAssetUsage {
  const ProjectAssetUsage({
    required this.id,
    required this.assetId,
    required this.projectId,
    required this.userId,
    required this.targetType,
    required this.targetId,
    required this.usageAction,
    required this.isPrimary,
    required this.metadata,
    required this.createdAt,
    required this.updatedAt,
    this.placement,
    this.deletedAt,
  });

  final String id;
  final String assetId;
  final String projectId;
  final String userId;
  final String targetType;
  final String targetId;
  final String? placement;
  final String usageAction;
  final bool isPrimary;
  final Map<String, dynamic> metadata;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? deletedAt;

  factory ProjectAssetUsage.fromJson(Map<String, dynamic> json) {
    return ProjectAssetUsage(
      id: (json['id'] ?? '').toString(),
      assetId: (json['assetId'] ?? json['asset_id'] ?? '').toString(),
      projectId: (json['projectId'] ?? json['project_id'] ?? '').toString(),
      userId: (json['userId'] ?? json['user_id'] ?? '').toString(),
      targetType: (json['targetType'] ?? json['target_type'] ?? '').toString(),
      targetId: (json['targetId'] ?? json['target_id'] ?? '').toString(),
      placement: _asStringOrNull(json['placement']),
      usageAction: (json['usageAction'] ?? json['usage_action'] ?? '')
          .toString(),
      isPrimary: _asBool(json['isPrimary'] ?? json['is_primary']) ?? false,
      metadata: _asMap(json['metadata']),
      createdAt: _asDateTime(json['createdAt'] ?? json['created_at']),
      updatedAt: _asDateTime(json['updatedAt'] ?? json['updated_at']),
      deletedAt: _asDateTimeOrNull(json['deletedAt'] ?? json['deleted_at']),
    );
  }
}

class ProjectAssetEvent {
  const ProjectAssetEvent({
    required this.id,
    required this.assetId,
    required this.projectId,
    required this.userId,
    required this.eventType,
    required this.metadata,
    required this.createdAt,
    this.targetType,
    this.targetId,
    this.placement,
  });

  final String id;
  final String assetId;
  final String projectId;
  final String userId;
  final String eventType;
  final String? targetType;
  final String? targetId;
  final String? placement;
  final Map<String, dynamic> metadata;
  final DateTime createdAt;

  factory ProjectAssetEvent.fromJson(Map<String, dynamic> json) {
    return ProjectAssetEvent(
      id: (json['id'] ?? '').toString(),
      assetId: (json['assetId'] ?? json['asset_id'] ?? '').toString(),
      projectId: (json['projectId'] ?? json['project_id'] ?? '').toString(),
      userId: (json['userId'] ?? json['user_id'] ?? '').toString(),
      eventType: (json['eventType'] ?? json['event_type'] ?? '').toString(),
      targetType: _asStringOrNull(json['targetType'] ?? json['target_type']),
      targetId: _asStringOrNull(json['targetId'] ?? json['target_id']),
      placement: _asStringOrNull(json['placement']),
      metadata: _asMap(json['metadata']),
      createdAt: _asDateTime(json['createdAt'] ?? json['created_at']),
    );
  }
}

class ProjectAssetEligibility {
  const ProjectAssetEligibility({
    required this.assetId,
    required this.usageAction,
    required this.eligible,
    this.targetType,
    this.targetId,
    this.reason,
  });

  final String assetId;
  final String usageAction;
  final String? targetType;
  final String? targetId;
  final bool eligible;
  final String? reason;

  factory ProjectAssetEligibility.fromJson(Map<String, dynamic> json) {
    return ProjectAssetEligibility(
      assetId: (json['assetId'] ?? json['asset_id'] ?? '').toString(),
      usageAction: (json['usageAction'] ?? json['usage_action'] ?? '')
          .toString(),
      targetType: _asStringOrNull(json['targetType'] ?? json['target_type']),
      targetId: _asStringOrNull(json['targetId'] ?? json['target_id']),
      eligible: _asBool(json['eligible']) ?? false,
      reason: _asStringOrNull(json['reason']),
    );
  }
}

class ProjectAssetCleanupItem {
  const ProjectAssetCleanupItem({
    required this.assetId,
    required this.mediaKind,
    required this.status,
    this.cleanupEligibleAt,
    this.reason,
  });

  final String assetId;
  final String mediaKind;
  final String status;
  final DateTime? cleanupEligibleAt;
  final String? reason;

  factory ProjectAssetCleanupItem.fromJson(Map<String, dynamic> json) {
    return ProjectAssetCleanupItem(
      assetId: (json['assetId'] ?? json['asset_id'] ?? '').toString(),
      mediaKind: (json['mediaKind'] ?? json['media_kind'] ?? '').toString(),
      status: (json['status'] ?? '').toString(),
      cleanupEligibleAt: _asDateTimeOrNull(
        json['cleanupEligibleAt'] ?? json['cleanup_eligible_at'],
      ),
      reason: _asStringOrNull(json['reason']),
    );
  }
}

class ProjectAssetCleanupReport {
  const ProjectAssetCleanupReport({
    required this.cleanupEligible,
    required this.degraded,
    required this.missingStorage,
    required this.physicalDeleteAllowed,
  });

  final List<ProjectAssetCleanupItem> cleanupEligible;
  final List<ProjectAssetCleanupItem> degraded;
  final List<ProjectAssetCleanupItem> missingStorage;
  final bool physicalDeleteAllowed;

  factory ProjectAssetCleanupReport.fromJson(Map<String, dynamic> json) {
    return ProjectAssetCleanupReport(
      cleanupEligible: _asList(
        json['cleanupEligible'] ?? json['cleanup_eligible'],
      ).map(ProjectAssetCleanupItem.fromJson).toList(),
      degraded: _asList(
        json['degraded'],
      ).map(ProjectAssetCleanupItem.fromJson).toList(),
      missingStorage: _asList(
        json['missingStorage'] ?? json['missing_storage'],
      ).map(ProjectAssetCleanupItem.fromJson).toList(),
      physicalDeleteAllowed:
          _asBool(
            json['physicalDeleteAllowed'] ?? json['physical_delete_allowed'],
          ) ??
          false,
    );
  }
}

class ProjectAssetListResponse {
  const ProjectAssetListResponse({required this.items, required this.total});

  final List<ProjectAsset> items;
  final int total;

  factory ProjectAssetListResponse.fromJson(Map<String, dynamic> json) {
    return ProjectAssetListResponse(
      items: _asList(json['items']).map(ProjectAsset.fromJson).toList(),
      total: _asInt(json['total']) ?? 0,
    );
  }
}

Map<String, dynamic> _asMap(Object? value) {
  if (value is Map<String, dynamic>) {
    return value;
  }
  if (value is Map) {
    return value.map((key, value) => MapEntry(key.toString(), value));
  }
  return const <String, dynamic>{};
}

List<Map<String, dynamic>> _asList(Object? value) {
  if (value is! List) {
    return const <Map<String, dynamic>>[];
  }
  return value.whereType<Object?>().map(_asMap).toList(growable: false);
}

DateTime _asDateTime(Object? value) {
  final parsed = _asDateTimeOrNull(value);
  return parsed ?? DateTime.fromMillisecondsSinceEpoch(0);
}

DateTime? _asDateTimeOrNull(Object? value) {
  if (value is DateTime) {
    return value;
  }
  if (value is String && value.trim().isNotEmpty) {
    return DateTime.tryParse(value);
  }
  return null;
}

int? _asInt(Object? value) {
  if (value is int) {
    return value;
  }
  if (value is num) {
    return value.toInt();
  }
  if (value is String) {
    return int.tryParse(value);
  }
  return null;
}

bool? _asBool(Object? value) {
  if (value is bool) {
    return value;
  }
  if (value is num) {
    return value != 0;
  }
  if (value is String) {
    final normalized = value.trim().toLowerCase();
    if (normalized == 'true' || normalized == '1' || normalized == 'yes') {
      return true;
    }
    if (normalized == 'false' || normalized == '0' || normalized == 'no') {
      return false;
    }
  }
  return null;
}

String? _asStringOrNull(Object? value) {
  if (value == null) {
    return null;
  }
  final text = value.toString().trim();
  return text.isEmpty ? null : text;
}

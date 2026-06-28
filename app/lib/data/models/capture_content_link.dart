class CaptureContentLink {
  const CaptureContentLink({
    required this.assetId,
    required this.contentId,
    required this.projectId,
    required this.createdAt,
    this.backendAssetId,
    this.syncState = CaptureContentLinkSyncState.localOnly,
  });

  final String assetId;
  final String contentId;
  final String projectId;
  final DateTime createdAt;
  final String? backendAssetId;
  final CaptureContentLinkSyncState syncState;

  factory CaptureContentLink.fromJson(Map<String, dynamic> json) {
    return CaptureContentLink(
      assetId: (json['assetId'] ?? json['asset_id'] ?? '').toString(),
      contentId: (json['contentId'] ?? json['content_id'] ?? '').toString(),
      projectId: (json['projectId'] ?? json['project_id'] ?? '').toString(),
      backendAssetId: (json['backendAssetId'] ?? json['backend_asset_id'])
          ?.toString(),
      syncState: _syncStateFromString(
        (json['syncState'] ?? json['sync_state'])?.toString(),
      ),
      createdAt: _asDateTime(json['createdAt'] ?? json['created_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'assetId': assetId,
      'contentId': contentId,
      'projectId': projectId,
      'backendAssetId': backendAssetId,
      'syncState': syncState.name,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}

enum CaptureContentLinkSyncState { localOnly, backendLinked, pendingBackend }

CaptureContentLinkSyncState _syncStateFromString(String? value) {
  switch (value) {
    case 'backendLinked':
    case 'backend_linked':
      return CaptureContentLinkSyncState.backendLinked;
    case 'pendingBackend':
    case 'pending_backend':
      return CaptureContentLinkSyncState.pendingBackend;
    case 'localOnly':
    case 'local_only':
    default:
      return CaptureContentLinkSyncState.localOnly;
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

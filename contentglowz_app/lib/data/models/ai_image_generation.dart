class ImageProfile {
  const ImageProfile({
    required this.profileId,
    required this.name,
    required this.description,
    required this.imageType,
    required this.imageProvider,
    required this.styleGuide,
    required this.pathType,
    required this.tags,
    required this.isSystem,
    this.templateId,
    this.defaultAltText,
    this.basePrompt,
  });

  final String profileId;
  final String name;
  final String description;
  final String imageType;
  final String imageProvider;
  final String styleGuide;
  final String pathType;
  final String? templateId;
  final String? defaultAltText;
  final String? basePrompt;
  final List<String> tags;
  final bool isSystem;

  bool get isFlux => imageProvider == 'flux';

  factory ImageProfile.fromJson(Map<String, dynamic> json) {
    return ImageProfile(
      profileId: (json['profileId'] ?? json['profile_id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      imageType: (json['imageType'] ?? json['image_type'] ?? '').toString(),
      imageProvider: (json['imageProvider'] ?? json['image_provider'] ?? '')
          .toString(),
      styleGuide: (json['styleGuide'] ?? json['style_guide'] ?? '').toString(),
      pathType: (json['pathType'] ?? json['path_type'] ?? '').toString(),
      templateId: _asStringOrNull(json['templateId'] ?? json['template_id']),
      defaultAltText: _asStringOrNull(
        json['defaultAltText'] ?? json['default_alt_text'],
      ),
      basePrompt: _asStringOrNull(json['basePrompt'] ?? json['base_prompt']),
      tags: _asStringList(json['tags']),
      isSystem: _asBool(json['isSystem'] ?? json['is_system']) ?? false,
    );
  }
}

class ImageProfileListResponse {
  const ImageProfileListResponse({
    required this.items,
    required this.totalCount,
  });

  final List<ImageProfile> items;
  final int totalCount;

  factory ImageProfileListResponse.fromJson(Map<String, dynamic> json) {
    return ImageProfileListResponse(
      items: _asList(json['items']).map(ImageProfile.fromJson).toList(),
      totalCount: _asInt(json['totalCount'] ?? json['total_count']) ?? 0,
    );
  }
}

class GenerateImageFromProfileResult {
  const GenerateImageFromProfileResult({
    required this.success,
    required this.responsiveUrls,
    required this.referenceIds,
    required this.visualMemoryApplied,
    required this.referencesUsed,
    required this.historyPersisted,
    required this.providerMetadata,
    this.profile,
    this.imageType,
    this.cdnUrl,
    this.primaryUrl,
    this.fileName,
    this.altText,
    this.providerUsed,
    this.promptUsed,
    this.styleGuideUsed,
    this.pathTypeUsed,
    this.generationId,
    this.jobId,
    this.status,
    this.model,
    this.width,
    this.height,
    this.seed,
    this.providerRequestId,
    this.providerCost,
    this.assetId,
    this.errorCode,
    this.error,
  });

  final bool success;
  final ImageProfile? profile;
  final String? imageType;
  final String? cdnUrl;
  final String? primaryUrl;
  final Map<String, String> responsiveUrls;
  final String? fileName;
  final String? altText;
  final String? providerUsed;
  final String? promptUsed;
  final String? styleGuideUsed;
  final String? pathTypeUsed;
  final String? generationId;
  final String? jobId;
  final String? status;
  final String? model;
  final int? width;
  final int? height;
  final int? seed;
  final List<String> referenceIds;
  final bool visualMemoryApplied;
  final int referencesUsed;
  final bool historyPersisted;
  final String? providerRequestId;
  final double? providerCost;
  final Map<String, dynamic> providerMetadata;
  final String? assetId;
  final String? errorCode;
  final String? error;

  factory GenerateImageFromProfileResult.fromJson(Map<String, dynamic> json) {
    final profile = _asMap(json['profile']);
    return GenerateImageFromProfileResult(
      success: _asBool(json['success']) ?? false,
      profile: profile.isEmpty ? null : ImageProfile.fromJson(profile),
      imageType: _asStringOrNull(json['imageType'] ?? json['image_type']),
      cdnUrl: _asStringOrNull(json['cdnUrl'] ?? json['cdn_url']),
      primaryUrl: _asStringOrNull(json['primaryUrl'] ?? json['primary_url']),
      responsiveUrls: _asStringMap(
        json['responsiveUrls'] ?? json['responsive_urls'],
      ),
      fileName: _asStringOrNull(json['fileName'] ?? json['file_name']),
      altText: _asStringOrNull(json['altText'] ?? json['alt_text']),
      providerUsed: _asStringOrNull(
        json['providerUsed'] ?? json['provider_used'],
      ),
      promptUsed: _asStringOrNull(json['promptUsed'] ?? json['prompt_used']),
      styleGuideUsed: _asStringOrNull(
        json['styleGuideUsed'] ?? json['style_guide_used'],
      ),
      pathTypeUsed: _asStringOrNull(
        json['pathTypeUsed'] ?? json['path_type_used'],
      ),
      generationId: _asStringOrNull(
        json['generationId'] ?? json['generation_id'],
      ),
      jobId: _asStringOrNull(json['jobId'] ?? json['job_id']),
      status: _asStringOrNull(json['status']),
      model: _asStringOrNull(json['model']),
      width: _asInt(json['width']),
      height: _asInt(json['height']),
      seed: _asInt(json['seed']),
      referenceIds: _asStringList(
        json['referenceIds'] ?? json['reference_ids'],
      ),
      visualMemoryApplied:
          _asBool(
            json['visualMemoryApplied'] ?? json['visual_memory_applied'],
          ) ??
          false,
      referencesUsed:
          _asInt(json['referencesUsed'] ?? json['references_used']) ?? 0,
      historyPersisted:
          _asBool(json['historyPersisted'] ?? json['history_persisted']) ??
          false,
      providerRequestId: _asStringOrNull(
        json['providerRequestId'] ?? json['provider_request_id'],
      ),
      providerCost: _asDouble(json['providerCost'] ?? json['provider_cost']),
      providerMetadata: _asMap(
        json['providerMetadata'] ?? json['provider_metadata'],
      ),
      assetId: _asStringOrNull(json['assetId'] ?? json['asset_id']),
      errorCode: _asStringOrNull(json['errorCode'] ?? json['error_code']),
      error: _asStringOrNull(json['error']),
    );
  }
}

class ImageGenerationRecord {
  const ImageGenerationRecord({
    required this.id,
    required this.projectId,
    required this.userId,
    required this.profileId,
    required this.provider,
    required this.model,
    required this.status,
    required this.prompt,
    required this.promptHash,
    required this.width,
    required this.height,
    required this.outputFormat,
    required this.responsiveUrls,
    required this.referenceIds,
    required this.visualMemoryApplied,
    required this.providerMetadata,
    required this.createdAt,
    required this.updatedAt,
    this.jobId,
    this.seed,
    this.cdnUrl,
    this.primaryUrl,
    this.providerCost,
    this.providerRequestId,
    this.errorCode,
    this.errorMessage,
    this.assetId,
    this.startedAt,
    this.completedAt,
  });

  final String id;
  final String projectId;
  final String userId;
  final String profileId;
  final String provider;
  final String model;
  final String status;
  final String? jobId;
  final String prompt;
  final String promptHash;
  final int width;
  final int height;
  final int? seed;
  final String outputFormat;
  final String? cdnUrl;
  final String? primaryUrl;
  final Map<String, String> responsiveUrls;
  final List<String> referenceIds;
  final bool visualMemoryApplied;
  final double? providerCost;
  final String? providerRequestId;
  final String? errorCode;
  final String? errorMessage;
  final String? assetId;
  final Map<String, dynamic> providerMetadata;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? startedAt;
  final DateTime? completedAt;

  factory ImageGenerationRecord.fromJson(Map<String, dynamic> json) {
    return ImageGenerationRecord(
      id: (json['id'] ?? '').toString(),
      projectId: (json['projectId'] ?? json['project_id'] ?? '').toString(),
      userId: (json['userId'] ?? json['user_id'] ?? '').toString(),
      profileId: (json['profileId'] ?? json['profile_id'] ?? '').toString(),
      provider: (json['provider'] ?? '').toString(),
      model: (json['model'] ?? '').toString(),
      status: (json['status'] ?? '').toString(),
      jobId: _asStringOrNull(json['jobId'] ?? json['job_id']),
      prompt: (json['prompt'] ?? '').toString(),
      promptHash: (json['promptHash'] ?? json['prompt_hash'] ?? '').toString(),
      width: _asInt(json['width']) ?? 0,
      height: _asInt(json['height']) ?? 0,
      seed: _asInt(json['seed']),
      outputFormat: (json['outputFormat'] ?? json['output_format'] ?? '')
          .toString(),
      cdnUrl: _asStringOrNull(json['cdnUrl'] ?? json['cdn_url']),
      primaryUrl: _asStringOrNull(json['primaryUrl'] ?? json['primary_url']),
      responsiveUrls: _asStringMap(
        json['responsiveUrls'] ?? json['responsive_urls'],
      ),
      referenceIds: _asStringList(
        json['referenceIds'] ?? json['reference_ids'],
      ),
      visualMemoryApplied:
          _asBool(
            json['visualMemoryApplied'] ?? json['visual_memory_applied'],
          ) ??
          false,
      providerCost: _asDouble(json['providerCost'] ?? json['provider_cost']),
      providerRequestId: _asStringOrNull(
        json['providerRequestId'] ?? json['provider_request_id'],
      ),
      errorCode: _asStringOrNull(json['errorCode'] ?? json['error_code']),
      errorMessage: _asStringOrNull(
        json['errorMessage'] ?? json['error_message'],
      ),
      assetId: _asStringOrNull(json['assetId'] ?? json['asset_id']),
      providerMetadata: _asMap(
        json['providerMetadata'] ?? json['provider_metadata'],
      ),
      createdAt: _asDateTime(json['createdAt'] ?? json['created_at']),
      updatedAt: _asDateTime(json['updatedAt'] ?? json['updated_at']),
      startedAt: _asDateTimeOrNull(json['startedAt'] ?? json['started_at']),
      completedAt: _asDateTimeOrNull(
        json['completedAt'] ?? json['completed_at'],
      ),
    );
  }
}

class ImageGenerationListResponse {
  const ImageGenerationListResponse({
    required this.items,
    required this.totalCount,
  });

  final List<ImageGenerationRecord> items;
  final int totalCount;

  factory ImageGenerationListResponse.fromJson(Map<String, dynamic> json) {
    return ImageGenerationListResponse(
      items: _asList(
        json['items'],
      ).map(ImageGenerationRecord.fromJson).toList(),
      totalCount: _asInt(json['totalCount'] ?? json['total_count']) ?? 0,
    );
  }
}

class ImageReferenceRecord {
  const ImageReferenceRecord({
    required this.id,
    required this.projectId,
    required this.userId,
    required this.cdnUrl,
    required this.mimeType,
    required this.referenceType,
    required this.approved,
    required this.createdAt,
    required this.updatedAt,
    this.primaryUrl,
    this.width,
    this.height,
    this.label,
  });

  final String id;
  final String projectId;
  final String userId;
  final String cdnUrl;
  final String? primaryUrl;
  final String mimeType;
  final int? width;
  final int? height;
  final String? label;
  final String referenceType;
  final bool approved;
  final DateTime createdAt;
  final DateTime updatedAt;

  factory ImageReferenceRecord.fromJson(Map<String, dynamic> json) {
    return ImageReferenceRecord(
      id: (json['id'] ?? '').toString(),
      projectId: (json['projectId'] ?? json['project_id'] ?? '').toString(),
      userId: (json['userId'] ?? json['user_id'] ?? '').toString(),
      cdnUrl: (json['cdnUrl'] ?? json['cdn_url'] ?? '').toString(),
      primaryUrl: _asStringOrNull(json['primaryUrl'] ?? json['primary_url']),
      mimeType: (json['mimeType'] ?? json['mime_type'] ?? '').toString(),
      width: _asInt(json['width']),
      height: _asInt(json['height']),
      label: _asStringOrNull(json['label']),
      referenceType: (json['referenceType'] ?? json['reference_type'] ?? '')
          .toString(),
      approved: _asBool(json['approved']) ?? false,
      createdAt: _asDateTime(json['createdAt'] ?? json['created_at']),
      updatedAt: _asDateTime(json['updatedAt'] ?? json['updated_at']),
    );
  }
}

class ImageReferenceListResponse {
  const ImageReferenceListResponse({
    required this.items,
    required this.totalCount,
  });

  final List<ImageReferenceRecord> items;
  final int totalCount;

  factory ImageReferenceListResponse.fromJson(Map<String, dynamic> json) {
    return ImageReferenceListResponse(
      items: _asList(json['items']).map(ImageReferenceRecord.fromJson).toList(),
      totalCount: _asInt(json['totalCount'] ?? json['total_count']) ?? 0,
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

List<String> _asStringList(Object? value) {
  if (value is! List) {
    return const <String>[];
  }
  return value
      .whereType<Object?>()
      .map((item) => item.toString())
      .where((item) => item.trim().isNotEmpty)
      .toList(growable: false);
}

Map<String, String> _asStringMap(Object? value) {
  return _asMap(value).map((key, value) => MapEntry(key, value.toString()));
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

double? _asDouble(Object? value) {
  if (value is double) {
    return value;
  }
  if (value is num) {
    return value.toDouble();
  }
  if (value is String) {
    return double.tryParse(value);
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

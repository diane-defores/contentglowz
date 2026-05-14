import 'dart:typed_data';

class ProjectIntelligenceUploadFile {
  const ProjectIntelligenceUploadFile({
    required this.fileName,
    required this.mimeType,
    required this.bytes,
  });

  final String fileName;
  final String mimeType;
  final Uint8List bytes;
}

class ProjectIntelligenceJob {
  const ProjectIntelligenceJob({
    required this.id,
    required this.userId,
    required this.projectId,
    required this.jobType,
    required this.status,
    this.summary = const <String, dynamic>{},
    this.errorCode,
    this.errorMessage,
    this.createdAt,
    this.updatedAt,
    this.startedAt,
    this.completedAt,
  });

  final String id;
  final String userId;
  final String projectId;
  final String jobType;
  final String status;
  final Map<String, dynamic> summary;
  final String? errorCode;
  final String? errorMessage;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final DateTime? startedAt;
  final DateTime? completedAt;

  bool get isRunning => status == 'running' || status == 'queued';

  factory ProjectIntelligenceJob.fromJson(Map<String, dynamic> json) {
    return ProjectIntelligenceJob(
      id: _string(json, 'id', null),
      userId: _string(json, 'userId', 'user_id'),
      projectId: _string(json, 'projectId', 'project_id'),
      jobType: _string(json, 'jobType', 'job_type'),
      status: _string(json, 'status', null, fallback: 'unknown'),
      summary: _map(json['summary']) ?? const <String, dynamic>{},
      errorCode: _nullableString(json, 'errorCode', 'error_code'),
      errorMessage: _nullableString(json, 'errorMessage', 'error_message'),
      createdAt: _date(json['createdAt'] ?? json['created_at']),
      updatedAt: _date(json['updatedAt'] ?? json['updated_at']),
      startedAt: _date(json['startedAt'] ?? json['started_at']),
      completedAt: _date(json['completedAt'] ?? json['completed_at']),
    );
  }
}

class ProjectIntelligenceSource {
  const ProjectIntelligenceSource({
    required this.id,
    required this.projectId,
    required this.sourceType,
    required this.sourceLabel,
    required this.status,
    this.originRef,
    this.summaryText,
    this.contentHash,
    this.metadata = const <String, dynamic>{},
    this.createdAt,
    this.updatedAt,
    this.removedAt,
  });

  final String id;
  final String projectId;
  final String sourceType;
  final String sourceLabel;
  final String status;
  final String? originRef;
  final String? summaryText;
  final String? contentHash;
  final Map<String, dynamic> metadata;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final DateTime? removedAt;

  factory ProjectIntelligenceSource.fromJson(Map<String, dynamic> json) {
    return ProjectIntelligenceSource(
      id: _string(json, 'id', null),
      projectId: _string(json, 'projectId', 'project_id'),
      sourceType: _string(json, 'sourceType', 'source_type'),
      sourceLabel: _string(json, 'sourceLabel', 'source_label'),
      status: _string(json, 'status', null, fallback: 'unknown'),
      originRef: _nullableString(json, 'originRef', 'origin_ref'),
      summaryText: _nullableString(json, 'summaryText', 'summary_text'),
      contentHash: _nullableString(json, 'contentHash', 'content_hash'),
      metadata: _map(json['metadata']) ?? const <String, dynamic>{},
      createdAt: _date(json['createdAt'] ?? json['created_at']),
      updatedAt: _date(json['updatedAt'] ?? json['updated_at']),
      removedAt: _date(json['removedAt'] ?? json['removed_at']),
    );
  }
}

class ProjectIntelligenceDocument {
  const ProjectIntelligenceDocument({
    required this.id,
    required this.sourceId,
    required this.title,
    required this.contentHash,
    required this.normalizedHash,
    this.fileName,
    this.mimeType,
    this.charCount = 0,
    this.snippet,
    this.isDuplicate = false,
    this.canonicalDocumentId,
    this.nearDuplicateScore,
  });

  final String id;
  final String sourceId;
  final String title;
  final String contentHash;
  final String normalizedHash;
  final String? fileName;
  final String? mimeType;
  final int charCount;
  final String? snippet;
  final bool isDuplicate;
  final String? canonicalDocumentId;
  final double? nearDuplicateScore;

  factory ProjectIntelligenceDocument.fromJson(Map<String, dynamic> json) {
    return ProjectIntelligenceDocument(
      id: _string(json, 'id', null),
      sourceId: _string(json, 'sourceId', 'source_id'),
      title: _string(json, 'title', null),
      fileName: _nullableString(json, 'fileName', 'file_name'),
      mimeType: _nullableString(json, 'mimeType', 'mime_type'),
      contentHash: _string(json, 'contentHash', 'content_hash'),
      normalizedHash: _string(json, 'normalizedHash', 'normalized_hash'),
      charCount: _int(json['charCount'] ?? json['char_count']),
      snippet: _nullableString(json, 'snippet', null),
      isDuplicate: _bool(json['isDuplicate'] ?? json['is_duplicate']) ?? false,
      canonicalDocumentId: _nullableString(
        json,
        'canonicalDocumentId',
        'canonical_document_id',
      ),
      nearDuplicateScore: _nullableDouble(
        json['nearDuplicateScore'] ?? json['near_duplicate_score'],
      ),
    );
  }
}

class ProjectIntelligenceFact {
  const ProjectIntelligenceFact({
    required this.id,
    required this.category,
    required this.subject,
    required this.statement,
    this.confidence = 0,
    this.priority = 3,
    this.evidenceSnippet,
  });

  final String id;
  final String category;
  final String subject;
  final String statement;
  final double confidence;
  final int priority;
  final String? evidenceSnippet;

  factory ProjectIntelligenceFact.fromJson(Map<String, dynamic> json) {
    return ProjectIntelligenceFact(
      id: _string(json, 'id', null),
      category: _string(json, 'category', null),
      subject: _string(json, 'subject', null),
      statement: _string(json, 'statement', null),
      confidence: _double(json['confidence']),
      priority: _int(json['priority']),
      evidenceSnippet: _nullableString(
        json,
        'evidenceSnippet',
        'evidence_snippet',
      ),
    );
  }
}

class ProjectIntelligenceEvidenceRef {
  const ProjectIntelligenceEvidenceRef({
    required this.sourceId,
    this.documentId,
    this.chunkId,
    this.snippet,
  });

  final String sourceId;
  final String? documentId;
  final String? chunkId;
  final String? snippet;

  factory ProjectIntelligenceEvidenceRef.fromJson(Map<String, dynamic> json) {
    return ProjectIntelligenceEvidenceRef(
      sourceId: _string(json, 'sourceId', 'source_id'),
      documentId: _nullableString(json, 'documentId', 'document_id'),
      chunkId: _nullableString(json, 'chunkId', 'chunk_id'),
      snippet: _nullableString(json, 'snippet', null),
    );
  }
}

class ProjectIntelligenceRecommendation {
  const ProjectIntelligenceRecommendation({
    required this.id,
    required this.recommendationKey,
    required this.recommendationType,
    required this.title,
    required this.summary,
    this.rationale,
    this.priority = 3,
    this.confidence = 0,
    this.status = 'open',
    this.evidenceIds = const <String>[],
    this.evidence = const <ProjectIntelligenceEvidenceRef>[],
  });

  final String id;
  final String recommendationKey;
  final String recommendationType;
  final String title;
  final String summary;
  final String? rationale;
  final int priority;
  final double confidence;
  final String status;
  final List<String> evidenceIds;
  final List<ProjectIntelligenceEvidenceRef> evidence;

  factory ProjectIntelligenceRecommendation.fromJson(
    Map<String, dynamic> json,
  ) {
    return ProjectIntelligenceRecommendation(
      id: _string(json, 'id', null),
      recommendationKey: _string(
        json,
        'recommendationKey',
        'recommendation_key',
      ),
      recommendationType: _string(
        json,
        'recommendationType',
        'recommendation_type',
      ),
      title: _string(json, 'title', null),
      summary: _string(json, 'summary', null),
      rationale: _nullableString(json, 'rationale', null),
      priority: _int(json['priority']),
      confidence: _double(json['confidence']),
      status: _string(json, 'status', null, fallback: 'open'),
      evidenceIds: _list(
        json['evidenceIds'] ?? json['evidence_ids'],
      ).map((entry) => entry.toString()).toList(),
      evidence: _list(json['evidence'])
          .whereType<Map>()
          .map(
            (entry) => ProjectIntelligenceEvidenceRef.fromJson(_mapFrom(entry)),
          )
          .toList(),
    );
  }
}

class ProjectIntelligenceProviderReadiness {
  const ProjectIntelligenceProviderReadiness({
    required this.projectId,
    required this.readiness,
    required this.score,
    required this.rationale,
    required this.recommendedNextStep,
    this.warnings = const <String>[],
  });

  final String projectId;
  final String readiness;
  final int score;
  final String rationale;
  final String recommendedNextStep;
  final List<String> warnings;

  factory ProjectIntelligenceProviderReadiness.fromJson(
    Map<String, dynamic> json,
  ) {
    return ProjectIntelligenceProviderReadiness(
      projectId: _string(json, 'projectId', 'project_id'),
      readiness: _string(json, 'readiness', null, fallback: 'unknown'),
      score: _int(json['score']),
      rationale: _string(json, 'rationale', null),
      recommendedNextStep: _string(
        json,
        'recommendedNextStep',
        'recommended_next_step',
      ),
      warnings: _list(
        json['warnings'],
      ).map((entry) => entry.toString()).toList(),
    );
  }
}

class ProjectIntelligenceStatus {
  const ProjectIntelligenceStatus({
    required this.projectId,
    this.counts = const <String, int>{},
    this.activeJob,
    this.lastJob,
    this.degraded = false,
    this.degradedReason,
  });

  final String projectId;
  final Map<String, int> counts;
  final ProjectIntelligenceJob? activeJob;
  final ProjectIntelligenceJob? lastJob;
  final bool degraded;
  final String? degradedReason;

  factory ProjectIntelligenceStatus.empty([String? projectId]) {
    return ProjectIntelligenceStatus(
      projectId: projectId ?? '',
      counts: const <String, int>{},
      degraded: false,
    );
  }

  factory ProjectIntelligenceStatus.fromJson(Map<String, dynamic> json) {
    final counts = _map(json['counts']) ?? const <String, dynamic>{};
    return ProjectIntelligenceStatus(
      projectId: _string(json, 'projectId', 'project_id'),
      counts: counts.map((key, value) => MapEntry(key, _int(value))),
      activeJob: _map(json['activeJob'] ?? json['active_job']) == null
          ? null
          : ProjectIntelligenceJob.fromJson(
              _map(json['activeJob'] ?? json['active_job'])!,
            ),
      lastJob: _map(json['lastJob'] ?? json['last_job']) == null
          ? null
          : ProjectIntelligenceJob.fromJson(
              _map(json['lastJob'] ?? json['last_job'])!,
            ),
      degraded: _bool(json['degraded']) ?? false,
      degradedReason: _nullableString(
        json,
        'degradedReason',
        'degraded_reason',
      ),
    );
  }
}

class ProjectIntelligenceUploadResult {
  const ProjectIntelligenceUploadResult({
    required this.projectId,
    required this.job,
    this.accepted = 0,
    this.failed = 0,
    this.duplicated = 0,
    this.errors = const <Map<String, dynamic>>[],
  });

  final String projectId;
  final ProjectIntelligenceJob job;
  final int accepted;
  final int failed;
  final int duplicated;
  final List<Map<String, dynamic>> errors;

  factory ProjectIntelligenceUploadResult.fromJson(Map<String, dynamic> json) {
    return ProjectIntelligenceUploadResult(
      projectId: _string(json, 'projectId', 'project_id'),
      job: ProjectIntelligenceJob.fromJson(
        _map(json['job']) ?? const <String, dynamic>{},
      ),
      accepted: _int(json['accepted']),
      failed: _int(json['failed']),
      duplicated: _int(json['duplicated']),
      errors: _list(json['errors']).whereType<Map>().map(_mapFrom).toList(),
    );
  }
}

class ProjectIntelligenceIdeaPoolActionResult {
  const ProjectIntelligenceIdeaPoolActionResult({
    required this.projectId,
    required this.recommendationId,
    required this.action,
    this.ideaId,
    this.message = '',
  });

  final String projectId;
  final String recommendationId;
  final String action;
  final String? ideaId;
  final String message;

  factory ProjectIntelligenceIdeaPoolActionResult.fromJson(
    Map<String, dynamic> json,
  ) {
    return ProjectIntelligenceIdeaPoolActionResult(
      projectId: _string(json, 'projectId', 'project_id'),
      recommendationId: _string(json, 'recommendationId', 'recommendation_id'),
      action: _string(json, 'action', null, fallback: 'skipped'),
      ideaId: _nullableString(json, 'ideaId', 'idea_id'),
      message: _string(json, 'message', null),
    );
  }
}

Map<String, dynamic>? _map(Object? value) {
  if (value is Map<String, dynamic>) {
    return value;
  }
  if (value is Map) {
    return value.map((key, entry) => MapEntry(key.toString(), entry));
  }
  return null;
}

Map<String, dynamic> _mapFrom(Map<dynamic, dynamic> value) {
  return value.map((key, entry) => MapEntry(key.toString(), entry));
}

List<dynamic> _list(Object? value) {
  return value is List ? value : const <dynamic>[];
}

String _string(
  Map<String, dynamic> json,
  String key,
  String? fallbackKey, {
  String fallback = '',
}) {
  final raw = json[key] ?? (fallbackKey == null ? null : json[fallbackKey]);
  final value = raw?.toString().trim();
  if (value == null || value.isEmpty) {
    return fallback;
  }
  return value;
}

String? _nullableString(
  Map<String, dynamic> json,
  String key,
  String? fallbackKey,
) {
  final value = _string(json, key, fallbackKey);
  return value.isEmpty ? null : value;
}

bool? _bool(Object? value) {
  if (value is bool) return value;
  if (value is num) return value != 0;
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

int _int(Object? value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value) ?? 0;
  return 0;
}

double _double(Object? value) {
  if (value is double) return value;
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? 0;
  return 0;
}

double? _nullableDouble(Object? value) {
  if (value == null) return null;
  final parsed = _double(value);
  return parsed;
}

DateTime? _date(Object? raw) {
  if (raw == null) return null;
  if (raw is DateTime) return raw;
  if (raw is String) return DateTime.tryParse(raw);
  if (raw is num) {
    return DateTime.fromMillisecondsSinceEpoch(raw.toInt() * 1000);
  }
  return null;
}

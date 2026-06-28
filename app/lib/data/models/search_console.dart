class SearchConsoleConnectionStatus {
  const SearchConsoleConnectionStatus({
    required this.projectId,
    required this.connected,
    required this.status,
    this.source = 'search_console',
    this.sourceLabel = 'Google Search',
    this.propertyUrl,
    this.propertyLabel,
    this.accountEmail,
    this.scopes = const <String>[],
    this.validationStatus = 'unknown',
    this.connectedAt,
    this.syncedAt,
    this.lastSyncStatus,
    this.lastSyncMessage,
    this.tokenExpiresAt,
  });

  final String projectId;
  final bool connected;
  final String status;
  final String source;
  final String sourceLabel;
  final String? propertyUrl;
  final String? propertyLabel;
  final String? accountEmail;
  final List<String> scopes;
  final String validationStatus;
  final DateTime? connectedAt;
  final DateTime? syncedAt;
  final String? lastSyncStatus;
  final String? lastSyncMessage;
  final DateTime? tokenExpiresAt;

  bool get isMissing => !connected || status == 'missing';
  bool get isValid => status == 'valid' || validationStatus == 'valid';
  bool get isDegraded => status == 'degraded' || validationStatus == 'degraded';
  bool get isInvalid =>
      status == 'invalid' ||
      status == 'expired' ||
      validationStatus == 'invalid';

  factory SearchConsoleConnectionStatus.missing([String? projectId]) {
    return SearchConsoleConnectionStatus(
      projectId: projectId ?? '',
      connected: false,
      status: 'missing',
      validationStatus: 'missing',
    );
  }

  factory SearchConsoleConnectionStatus.fromJson(Map<String, dynamic> json) {
    final scopes = _list(json['scopes']).map((entry) => entry.toString());
    return SearchConsoleConnectionStatus(
      projectId: _string(json, 'projectId', 'project_id'),
      connected: _bool(json['connected']) ?? false,
      status: _string(json, 'status', null, fallback: 'unknown'),
      source: _string(json, 'source', null, fallback: 'search_console'),
      sourceLabel: _string(
        json,
        'sourceLabel',
        'source_label',
        fallback: 'Google Search',
      ),
      propertyUrl: _nullableString(json, 'propertyUrl', 'property_url'),
      propertyLabel: _nullableString(json, 'propertyLabel', 'property_label'),
      accountEmail: _nullableString(json, 'accountEmail', 'account_email'),
      scopes: scopes.toList(),
      validationStatus: _string(
        json,
        'validationStatus',
        'validation_status',
        fallback: 'unknown',
      ),
      connectedAt: _date(json['connectedAt'] ?? json['connected_at']),
      syncedAt: _date(json['syncedAt'] ?? json['synced_at']),
      lastSyncStatus: _nullableString(
        json,
        'lastSyncStatus',
        'last_sync_status',
      ),
      lastSyncMessage: _nullableString(
        json,
        'lastSyncMessage',
        'last_sync_message',
      ),
      tokenExpiresAt: _date(json['tokenExpiresAt'] ?? json['token_expires_at']),
    );
  }
}

class SearchConsoleOAuthStart {
  const SearchConsoleOAuthStart({
    required this.authorizeUrl,
    required this.state,
    this.expiresAt,
  });

  final String authorizeUrl;
  final String state;
  final DateTime? expiresAt;

  factory SearchConsoleOAuthStart.fromJson(Map<String, dynamic> json) {
    return SearchConsoleOAuthStart(
      authorizeUrl: _string(json, 'authorizeUrl', 'authorize_url'),
      state: _string(json, 'state', null),
      expiresAt: _date(json['expiresAt'] ?? json['expires_at']),
    );
  }
}

class SearchConsoleProperty {
  const SearchConsoleProperty({
    required this.siteUrl,
    this.permissionLevel,
    this.displayName,
    this.matchesProjectDomain = false,
  });

  final String siteUrl;
  final String? permissionLevel;
  final String? displayName;
  final bool matchesProjectDomain;

  factory SearchConsoleProperty.fromJson(Map<String, dynamic> json) {
    return SearchConsoleProperty(
      siteUrl: _string(json, 'siteUrl', 'site_url'),
      permissionLevel: _nullableString(
        json,
        'permissionLevel',
        'permission_level',
      ),
      displayName: _nullableString(json, 'displayName', 'display_name'),
      matchesProjectDomain:
          _bool(
            json['matchesProjectDomain'] ?? json['matches_project_domain'],
          ) ??
          false,
    );
  }
}

class SearchConsoleTopRow {
  const SearchConsoleTopRow({
    required this.key,
    this.clicks = 0,
    this.impressions = 0,
    this.ctr = 0,
    this.position,
    this.url,
    this.query,
    this.period,
    this.evidence,
  });

  final String key;
  final int clicks;
  final int impressions;
  final double ctr;
  final double? position;
  final String? url;
  final String? query;
  final String? period;
  final Map<String, dynamic>? evidence;

  factory SearchConsoleTopRow.fromJson(Map<String, dynamic> json) {
    return SearchConsoleTopRow(
      key: _string(json, 'key', null),
      clicks: _int(json['clicks']),
      impressions: _int(json['impressions']),
      ctr: _double(json['ctr']),
      position: _nullableDouble(json['position']),
      url: _nullableString(json, 'url', null),
      query: _nullableString(json, 'query', null),
      period: _nullableString(json, 'period', null),
      evidence: _map(json['evidence']),
    );
  }
}

class SearchConsoleSitePage {
  const SearchConsoleSitePage({required this.path, required this.views});

  final String path;
  final int views;

  factory SearchConsoleSitePage.fromJson(Map<String, dynamic> json) {
    return SearchConsoleSitePage(
      path: _string(json, 'path', 'url'),
      views: _int(json['views'] ?? json['pageviews'] ?? json['count']),
    );
  }
}

class SearchConsoleSourceSection {
  const SearchConsoleSourceSection({
    required this.source,
    required this.sourceLabel,
    required this.period,
    required this.summary,
    this.isPartial = false,
    this.stale = false,
    this.syncedAt,
    this.metrics = const <String, dynamic>{},
    this.topPages = const <SearchConsoleTopRow>[],
    this.topQueries = const <SearchConsoleTopRow>[],
    this.issues = const <Map<String, dynamic>>[],
  });

  final String source;
  final String sourceLabel;
  final String period;
  final bool isPartial;
  final bool stale;
  final DateTime? syncedAt;
  final String summary;
  final Map<String, dynamic> metrics;
  final List<SearchConsoleTopRow> topPages;
  final List<SearchConsoleTopRow> topQueries;
  final List<Map<String, dynamic>> issues;

  factory SearchConsoleSourceSection.fromJson(Map<String, dynamic> json) {
    return SearchConsoleSourceSection(
      source: _string(json, 'source', null),
      sourceLabel: _string(json, 'sourceLabel', 'source_label'),
      period: _string(json, 'period', null),
      isPartial: _bool(json['isPartial'] ?? json['is_partial']) ?? false,
      stale: _bool(json['stale']) ?? false,
      syncedAt: _date(json['syncedAt'] ?? json['synced_at']),
      summary: _string(json, 'summary', null),
      metrics: _map(json['metrics']) ?? const <String, dynamic>{},
      topPages: _list(json['topPages'] ?? json['top_pages'])
          .whereType<Map>()
          .map((entry) => SearchConsoleTopRow.fromJson(_mapFrom(entry)))
          .toList(),
      topQueries: _list(json['topQueries'] ?? json['top_queries'])
          .whereType<Map>()
          .map((entry) => SearchConsoleTopRow.fromJson(_mapFrom(entry)))
          .toList(),
      issues: _list(
        json['issues'],
      ).whereType<Map>().map(_mapFrom).toList(growable: false),
    );
  }
}

class SearchConsoleSiteTrafficSection {
  const SearchConsoleSiteTrafficSection({
    required this.source,
    required this.sourceLabel,
    required this.period,
    this.isPartial = false,
    this.stale = false,
    this.syncedAt,
    this.metrics = const <String, dynamic>{},
    this.topPages = const <SearchConsoleSitePage>[],
    this.message,
  });

  final String source;
  final String sourceLabel;
  final String period;
  final bool isPartial;
  final bool stale;
  final DateTime? syncedAt;
  final Map<String, dynamic> metrics;
  final List<SearchConsoleSitePage> topPages;
  final String? message;

  factory SearchConsoleSiteTrafficSection.fromJson(Map<String, dynamic> json) {
    return SearchConsoleSiteTrafficSection(
      source: _string(json, 'source', null),
      sourceLabel: _string(json, 'sourceLabel', 'source_label'),
      period: _string(json, 'period', null),
      isPartial: _bool(json['isPartial'] ?? json['is_partial']) ?? false,
      stale: _bool(json['stale']) ?? false,
      syncedAt: _date(json['syncedAt'] ?? json['synced_at']),
      metrics: _map(json['metrics']) ?? const <String, dynamic>{},
      topPages: _list(json['topPages'] ?? json['top_pages'])
          .whereType<Map>()
          .map((entry) => SearchConsoleSitePage.fromJson(_mapFrom(entry)))
          .toList(),
      message: _nullableString(json, 'message', null),
    );
  }
}

class SearchConsoleSummary {
  const SearchConsoleSummary({
    required this.projectId,
    required this.period,
    required this.googleSearch,
    required this.siteTraffic,
    required this.overview,
    this.periodName = '',
    this.opportunitiesCount = 0,
    this.errors = const <String>[],
  });

  final String projectId;
  final String period;
  final String periodName;
  final SearchConsoleSourceSection googleSearch;
  final SearchConsoleSiteTrafficSection siteTraffic;
  final String overview;
  final int opportunitiesCount;
  final List<String> errors;

  factory SearchConsoleSummary.fromJson(Map<String, dynamic> json) {
    return SearchConsoleSummary(
      projectId: _string(json, 'projectId', 'project_id'),
      period: _string(json, 'period', null),
      periodName: _string(json, 'periodName', 'period_name'),
      googleSearch: SearchConsoleSourceSection.fromJson(
        _map(json['googleSearch'] ?? json['google_search']) ??
            const <String, dynamic>{},
      ),
      siteTraffic: SearchConsoleSiteTrafficSection.fromJson(
        _map(json['siteTraffic'] ?? json['site_traffic']) ??
            const <String, dynamic>{},
      ),
      overview: _string(json, 'overview', null),
      opportunitiesCount: _int(
        json['opportunitiesCount'] ?? json['opportunities_count'],
      ),
      errors: _list(json['errors']).map((entry) => entry.toString()).toList(),
    );
  }
}

class SearchConsoleOpportunity {
  const SearchConsoleOpportunity({
    required this.reason,
    required this.period,
    required this.title,
    required this.summary,
    required this.evidence,
    this.confidence = 0.5,
    this.priorityScore = 0,
    this.targetQuery,
    this.targetUrl,
    this.source = 'search_console_feedback',
    this.sourceLabel = 'Search Console Feedback',
  });

  final String reason;
  final String period;
  final String title;
  final double confidence;
  final double priorityScore;
  final String? targetQuery;
  final String? targetUrl;
  final String summary;
  final Map<String, dynamic> evidence;
  final String source;
  final String sourceLabel;

  String get stableKey =>
      '$reason|$period|${targetUrl ?? ''}|${targetQuery ?? ''}';

  factory SearchConsoleOpportunity.fromJson(Map<String, dynamic> json) {
    return SearchConsoleOpportunity(
      reason: _string(json, 'reason', null),
      period: _string(json, 'period', null),
      title: _string(json, 'title', null),
      confidence: _double(json['confidence'], fallback: 0.5),
      priorityScore: _double(json['priorityScore'] ?? json['priority_score']),
      targetQuery: _nullableString(json, 'targetQuery', 'target_query'),
      targetUrl: _nullableString(json, 'targetUrl', 'target_url'),
      summary: _string(json, 'summary', null),
      evidence: _map(json['evidence']) ?? const <String, dynamic>{},
      source: _string(
        json,
        'source',
        null,
        fallback: 'search_console_feedback',
      ),
      sourceLabel: _string(
        json,
        'sourceLabel',
        'source_label',
        fallback: 'Search Console Feedback',
      ),
    );
  }

  Map<String, dynamic> toIngestJson() {
    return {
      'reason': reason,
      'period': period,
      'title': title,
      'priorityScore': priorityScore,
      'targetQuery': targetQuery,
      'targetUrl': targetUrl,
      'summary': summary,
      'evidence': evidence,
    };
  }
}

class SearchConsoleIngestResponse {
  const SearchConsoleIngestResponse({
    required this.projectId,
    required this.ingested,
    this.skipped = 0,
  });

  final String projectId;
  final int ingested;
  final int skipped;

  factory SearchConsoleIngestResponse.fromJson(Map<String, dynamic> json) {
    return SearchConsoleIngestResponse(
      projectId: _string(json, 'projectId', 'project_id'),
      ingested: _int(json['ingested']),
      skipped: _int(json['skipped']),
    );
  }
}

const searchConsolePeriods = <String>['today', '7d', '30d', '90d', '6m'];

String searchConsolePeriodLabel(String period) {
  return switch (period) {
    'today' => 'Today',
    '7d' => 'Last 7 days',
    '30d' => 'Last 30 days',
    '90d' => 'Last 90 days',
    '6m' => 'Last 6 months',
    _ => period,
  };
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

int _int(Object? value) {
  if (value is int) {
    return value;
  }
  if (value is num) {
    return value.toInt();
  }
  if (value is String) {
    return int.tryParse(value) ?? 0;
  }
  return 0;
}

double _double(Object? value, {double fallback = 0}) {
  if (value is double) {
    return value;
  }
  if (value is num) {
    return value.toDouble();
  }
  if (value is String) {
    return double.tryParse(value) ?? fallback;
  }
  return fallback;
}

double? _nullableDouble(Object? value) {
  if (value == null) {
    return null;
  }
  return _double(value);
}

DateTime? _date(Object? value) {
  if (value is DateTime) {
    return value;
  }
  if (value is int) {
    return DateTime.fromMillisecondsSinceEpoch(value * 1000);
  }
  if (value is double) {
    return DateTime.fromMillisecondsSinceEpoch(value.toInt() * 1000);
  }
  if (value is String && value.trim().isNotEmpty) {
    return DateTime.tryParse(value);
  }
  return null;
}

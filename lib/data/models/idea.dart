/// Data model for an Idea Pool item coming from GET /api/ideas.
class Idea {
  final String id;
  final String source;
  final String title;
  final Map<String, dynamic> rawData;
  final Map<String, dynamic>? seoSignals;
  final Map<String, dynamic>? trendingSignals;
  final List<String> tags;
  final double? priorityScore;
  final String status;
  final String? projectId;
  final String? userId;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Idea({
    required this.id,
    required this.source,
    required this.title,
    this.rawData = const {},
    this.seoSignals,
    this.trendingSignals,
    this.tags = const [],
    this.priorityScore,
    this.status = 'raw',
    this.projectId,
    this.userId,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Idea.fromJson(Map<String, dynamic> json) {
    return Idea(
      id: (json['id'] ?? '').toString(),
      source: (json['source'] ?? 'manual').toString(),
      title: (json['title'] ?? '').toString(),
      rawData: (json['raw_data'] as Map<String, dynamic>?) ?? {},
      seoSignals: json['seo_signals'] as Map<String, dynamic>?,
      trendingSignals: json['trending_signals'] as Map<String, dynamic>?,
      tags: (json['tags'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      priorityScore: (json['priority_score'] as num?)?.toDouble(),
      status: (json['status'] ?? 'raw').toString(),
      projectId: json['project_id'] as String?,
      userId: json['user_id'] as String?,
      createdAt: _parseDate(json['created_at']),
      updatedAt: _parseDate(json['updated_at']),
    );
  }

  static DateTime _parseDate(dynamic v) {
    if (v is String) return DateTime.tryParse(v) ?? DateTime.now();
    if (v is num) return DateTime.fromMillisecondsSinceEpoch(v.toInt() * 1000);
    return DateTime.now();
  }

  /// Human-readable source label.
  String get sourceLabel => switch (source) {
        'newsletter_inbox' => 'Newsletter',
        'seo_keywords' => 'SEO',
        'competitor_watch' => 'Competitor',
        'social_listening' => 'Social',
        'weekly_ritual' => 'Ritual',
        'manual' => 'Manual',
        _ => source,
      };

  /// Status display label.
  String get statusLabel => switch (status) {
        'raw' => 'Raw',
        'enriched' => 'Enriched',
        'used' => 'Used',
        'dismissed' => 'Dismissed',
        _ => status,
      };

  /// SEO search volume if available.
  int? get searchVolume =>
      (seoSignals?['search_volume'] as num?)?.toInt();

  /// SEO keyword difficulty if available.
  double? get keywordDifficulty =>
      (seoSignals?['keyword_difficulty'] as num?)?.toDouble();
}

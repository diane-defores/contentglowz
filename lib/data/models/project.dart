enum Framework { astro, nextjs, gatsby, nuxt, hugo, jekyll, unknown }

enum OnboardingStatus {
  pending,
  cloning,
  analyzing,
  awaitingConfirmation,
  completed,
  failed,
}

class Project {
  final String id;
  final String name;
  final String url;
  final String? description;
  final bool isDefault;
  final bool isArchived;
  final bool isDeleted;
  final ProjectSettings? settings;
  final DateTime? lastAnalyzedAt;
  final DateTime? archivedAt;
  final DateTime? deletedAt;
  final DateTime createdAt;

  const Project({
    required this.id,
    required this.name,
    required this.url,
    this.description,
    this.isDefault = false,
    this.isArchived = false,
    this.isDeleted = false,
    this.settings,
    this.lastAnalyzedAt,
    this.archivedAt,
    this.deletedAt,
    required this.createdAt,
  });

  factory Project.fromJson(Map<String, dynamic> json) => Project(
    id: json['id'] as String,
    name: json['name'] as String,
    url: (json['url'] ?? json['github_url'] ?? '') as String,
    description: json['description'] as String?,
    isDefault: json['is_default'] as bool? ?? false,
    isArchived: json['is_archived'] as bool? ?? (json['archived_at'] != null),
    isDeleted: json['is_deleted'] as bool? ?? (json['deleted_at'] != null),
    settings: json['settings'] != null
        ? ProjectSettings.fromJson(json['settings'] as Map<String, dynamic>)
        : null,
    lastAnalyzedAt: json['last_analyzed_at'] != null
        ? DateTime.parse(json['last_analyzed_at'] as String)
        : null,
    archivedAt: json['archived_at'] != null
        ? DateTime.tryParse(json['archived_at'] as String)
        : null,
    deletedAt: json['deleted_at'] != null
        ? DateTime.tryParse(json['deleted_at'] as String)
        : null,
    createdAt: DateTime.parse(json['created_at'] as String),
  );

  Project copyWith({
    String? id,
    String? name,
    String? url,
    String? description,
    bool? isDefault,
    bool? isArchived,
    bool? isDeleted,
    ProjectSettings? settings,
    DateTime? lastAnalyzedAt,
    DateTime? archivedAt,
    DateTime? deletedAt,
    DateTime? createdAt,
  }) {
    return Project(
      id: id ?? this.id,
      name: name ?? this.name,
      url: url ?? this.url,
      description: description ?? this.description,
      isDefault: isDefault ?? this.isDefault,
      isArchived: isArchived ?? this.isArchived,
      isDeleted: isDeleted ?? this.isDeleted,
      settings: settings ?? this.settings,
      lastAnalyzedAt: lastAnalyzedAt ?? this.lastAnalyzedAt,
      archivedAt: archivedAt ?? this.archivedAt,
      deletedAt: deletedAt ?? this.deletedAt,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}

class ProjectSettings {
  final TechStackDetection? techStack;
  final OnboardingStatus onboardingStatus;
  final List<ContentTypeConfig> contentTypes;

  const ProjectSettings({
    this.techStack,
    this.onboardingStatus = OnboardingStatus.pending,
    this.contentTypes = const <ContentTypeConfig>[],
  });

  factory ProjectSettings.fromJson(Map<String, dynamic> json) =>
      ProjectSettings(
        techStack: json['tech_stack'] != null
            ? TechStackDetection.fromJson(
                json['tech_stack'] as Map<String, dynamic>,
              )
            : null,
        onboardingStatus: OnboardingStatus.values.firstWhere(
          (e) => e.name == (json['onboarding_status'] as String? ?? 'pending'),
          orElse: () => OnboardingStatus.pending,
        ),
        contentTypes: _parseContentTypes(json),
      );
}

class TechStackDetection {
  final Framework framework;
  final String? frameworkVersion;
  final double confidence;

  const TechStackDetection({
    required this.framework,
    this.frameworkVersion,
    required this.confidence,
  });

  factory TechStackDetection.fromJson(Map<String, dynamic> json) =>
      TechStackDetection(
        framework: Framework.values.firstWhere(
          (e) => e.name == (json['framework'] as String? ?? 'unknown'),
          orElse: () => Framework.unknown,
        ),
        frameworkVersion: json['framework_version'] as String?,
        confidence: (json['confidence'] as num?)?.toDouble() ?? 0,
      );
}

class ContentTypeConfig {
  final String type;
  final String label;
  final String icon;
  final bool enabled;
  final int frequencyPerWeek;
  final List<String> channels;

  const ContentTypeConfig({
    required this.type,
    required this.label,
    required this.icon,
    this.enabled = false,
    this.frequencyPerWeek = 1,
    this.channels = const [],
  });

  ContentTypeConfig copyWith({
    bool? enabled,
    int? frequencyPerWeek,
    List<String>? channels,
    String? label,
    String? icon,
  }) {
    return ContentTypeConfig(
      type: type,
      label: label ?? this.label,
      icon: icon ?? this.icon,
      enabled: enabled ?? this.enabled,
      frequencyPerWeek: frequencyPerWeek ?? this.frequencyPerWeek,
      channels: channels ?? this.channels,
    );
  }

  factory ContentTypeConfig.fromJson(Map<String, dynamic> json) {
    return ContentTypeConfig(
      type: (json['type'] ?? '').toString(),
      label: (json['label'] ?? json['name'] ?? json['type'] ?? '').toString(),
      icon: (json['icon'] ?? 'auto_awesome').toString(),
      enabled: json['enabled'] as bool? ?? true,
      frequencyPerWeek: (json['frequency_per_week'] as num?)?.toInt() ?? 1,
      channels: ((json['channels'] as List?) ?? const <Object>[])
          .map((entry) => entry.toString())
          .where((entry) => entry.isNotEmpty)
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'label': label,
      'icon': icon,
      'enabled': enabled,
      'frequency_per_week': frequencyPerWeek,
      'channels': channels,
    };
  }

  static List<ContentTypeConfig> defaults() => [
    const ContentTypeConfig(
      type: 'blog_post',
      label: 'Blog articles',
      icon: 'article',
      enabled: true,
      frequencyPerWeek: 2,
      channels: ['wordpress'],
    ),
    const ContentTypeConfig(
      type: 'newsletter',
      label: 'Newsletters',
      icon: 'email',
      enabled: true,
      frequencyPerWeek: 1,
      channels: ['email'],
    ),
    const ContentTypeConfig(
      type: 'social_post',
      label: 'Social posts',
      icon: 'chat',
      enabled: true,
      frequencyPerWeek: 5,
      channels: ['twitter', 'linkedin'],
    ),
    const ContentTypeConfig(
      type: 'video_script',
      label: 'Video scripts',
      icon: 'videocam',
      enabled: false,
      frequencyPerWeek: 1,
      channels: ['youtube'],
    ),
    const ContentTypeConfig(
      type: 'reel',
      label: 'Reels / Shorts',
      icon: 'slow_motion_video',
      enabled: false,
      frequencyPerWeek: 3,
      channels: ['instagram', 'tiktok'],
    ),
  ];
}

List<ContentTypeConfig> _parseContentTypes(Map<String, dynamic> json) {
  final rawContentTypes =
      json['content_types'] ?? json['contentTypes'] ?? json['content_config'];
  if (rawContentTypes is! List) {
    return const <ContentTypeConfig>[];
  }

  return rawContentTypes
      .whereType<Map<String, dynamic>>()
      .map(ContentTypeConfig.fromJson)
      .toList();
}

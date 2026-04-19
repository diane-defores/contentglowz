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
  final ProjectSettings? settings;
  final DateTime? lastAnalyzedAt;
  final DateTime createdAt;

  const Project({
    required this.id,
    required this.name,
    required this.url,
    this.description,
    this.isDefault = false,
    this.settings,
    this.lastAnalyzedAt,
    required this.createdAt,
  });

  factory Project.fromJson(Map<String, dynamic> json) => Project(
    id: json['id'] as String,
    name: json['name'] as String,
    url: json['url'] as String,
    description: json['description'] as String?,
    isDefault: json['is_default'] as bool? ?? false,
    settings: json['settings'] != null
        ? ProjectSettings.fromJson(json['settings'] as Map<String, dynamic>)
        : null,
    lastAnalyzedAt: json['last_analyzed_at'] != null
        ? DateTime.parse(json['last_analyzed_at'] as String)
        : null,
    createdAt: DateTime.parse(json['created_at'] as String),
  );
}

class ProjectSettings {
  final TechStackDetection? techStack;
  final OnboardingStatus onboardingStatus;

  const ProjectSettings({
    this.techStack,
    this.onboardingStatus = OnboardingStatus.pending,
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
  }) {
    return ContentTypeConfig(
      type: type,
      label: label,
      icon: icon,
      enabled: enabled ?? this.enabled,
      frequencyPerWeek: frequencyPerWeek ?? this.frequencyPerWeek,
      channels: channels ?? this.channels,
    );
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

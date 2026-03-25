class AppSettings {
  final String id;
  final String userId;
  final String theme;
  final String? language;
  final bool emailNotifications;
  final String? webhookUrl;
  final String? defaultProjectId;
  final Map<String, dynamic>? dashboardLayout;
  final Map<String, dynamic>? robotSettings;

  const AppSettings({
    required this.id,
    required this.userId,
    this.theme = 'system',
    this.language,
    this.emailNotifications = true,
    this.webhookUrl,
    this.defaultProjectId,
    this.dashboardLayout,
    this.robotSettings,
  });

  bool get notificationsEnabled => emailNotifications;

  AppSettings copyWith({
    String? id,
    String? userId,
    String? theme,
    String? language,
    bool? emailNotifications,
    String? webhookUrl,
    bool clearWebhookUrl = false,
    String? defaultProjectId,
    bool clearDefaultProjectId = false,
    Map<String, dynamic>? dashboardLayout,
    Map<String, dynamic>? robotSettings,
  }) {
    return AppSettings(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      theme: theme ?? this.theme,
      language: language ?? this.language,
      emailNotifications: emailNotifications ?? this.emailNotifications,
      webhookUrl: clearWebhookUrl ? null : (webhookUrl ?? this.webhookUrl),
      defaultProjectId: clearDefaultProjectId
          ? null
          : (defaultProjectId ?? this.defaultProjectId),
      dashboardLayout: dashboardLayout ?? this.dashboardLayout,
      robotSettings: robotSettings ?? this.robotSettings,
    );
  }

  factory AppSettings.fromJson(Map<String, dynamic> json) {
    return AppSettings(
      id: json['id'] as String,
      userId: json['userId'] as String,
      theme: json['theme'] as String? ?? 'system',
      language: json['language'] as String?,
      emailNotifications: json['emailNotifications'] as bool? ?? true,
      webhookUrl: json['webhookUrl'] as String?,
      defaultProjectId: json['defaultProjectId'] as String?,
      dashboardLayout: json['dashboardLayout'] as Map<String, dynamic>?,
      robotSettings: json['robotSettings'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toUpdateJson() {
    return {
      'theme': theme,
      'language': language,
      'emailNotifications': emailNotifications,
      'webhookUrl': webhookUrl,
      'defaultProjectId': defaultProjectId,
      'dashboardLayout': dashboardLayout,
      'robotSettings': robotSettings,
    };
  }
}

class PublishAccount {
  final String id;
  final String platform;
  final String username;
  final String displayName;
  final String? avatar;
  final String status;

  const PublishAccount({
    required this.id,
    required this.platform,
    required this.username,
    required this.displayName,
    this.avatar,
    this.status = 'active',
  });

  bool get isActive => status.toLowerCase() == 'active';

  factory PublishAccount.fromJson(Map<String, dynamic> json) {
    final username = (json['username'] ?? '').toString();
    final displayName =
        (json['display_name'] ?? json['displayName'] ?? username).toString();

    return PublishAccount(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      platform: (json['platform'] ?? '').toString().toLowerCase(),
      username: username,
      displayName: displayName.isEmpty ? username : displayName,
      avatar: json['avatar'] as String?,
      status: (json['status'] ?? 'active').toString(),
    );
  }
}

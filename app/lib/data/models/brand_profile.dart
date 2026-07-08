class BrandProfile {
  const BrandProfile({
    required this.id,
    required this.userId,
    required this.projectId,
    required this.name,
    this.logoAssetId,
    this.primaryColors = const <String>[],
    this.secondaryColors = const <String>[],
    this.fontHeading,
    this.fontBody,
    this.toneKeywords = const <String>[],
    this.ctaDefaults,
    this.captionStyleDefaults,
    this.motionIntensity = 'medium',
    this.transitionFamily,
    this.introModuleEnabled = true,
    this.outroModuleEnabled = true,
    this.isDefault = false,
    required this.revision,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String userId;
  final String projectId;
  final String name;
  final String? logoAssetId;
  final List<String> primaryColors;
  final List<String> secondaryColors;
  final String? fontHeading;
  final String? fontBody;
  final List<String> toneKeywords;
  final Map<String, dynamic>? ctaDefaults;
  final Map<String, dynamic>? captionStyleDefaults;
  final String motionIntensity;
  final String? transitionFamily;
  final bool introModuleEnabled;
  final bool outroModuleEnabled;
  final bool isDefault;
  final int revision;
  final DateTime createdAt;
  final DateTime updatedAt;

  factory BrandProfile.fromJson(Map<String, dynamic> json) {
    return BrandProfile(
      id: _asString(json['id']),
      userId: _asString(json['userId'] ?? json['user_id']),
      projectId: _asString(json['projectId'] ?? json['project_id']),
      name: _asString(json['name']),
      logoAssetId: _asStringOrNull(
        json['logoAssetId'] ?? json['logo_asset_id'],
      ),
      primaryColors: _asStringList(
        json['primaryColors'] ?? json['primary_colors'],
      ),
      secondaryColors: _asStringList(
        json['secondaryColors'] ?? json['secondary_colors'],
      ),
      fontHeading: _asStringOrNull(json['fontHeading'] ?? json['font_heading']),
      fontBody: _asStringOrNull(json['fontBody'] ?? json['font_body']),
      toneKeywords: _asStringList(
        json['toneKeywords'] ?? json['tone_keywords'],
      ),
      ctaDefaults: _asMapOrNull(json['ctaDefaults'] ?? json['cta_defaults']),
      captionStyleDefaults: _asMapOrNull(
        json['captionStyleDefaults'] ?? json['caption_style_defaults'],
      ),
      motionIntensity: _asString(
        json['motionIntensity'] ?? json['motion_intensity'] ?? 'medium',
      ),
      transitionFamily: _asStringOrNull(
        json['transitionFamily'] ?? json['transition_family'],
      ),
      introModuleEnabled: _asBool(
        json['introModuleEnabled'] ?? json['intro_module_enabled'],
        fallback: true,
      ),
      outroModuleEnabled: _asBool(
        json['outroModuleEnabled'] ?? json['outro_module_enabled'],
        fallback: true,
      ),
      isDefault: _asBool(
        json['isDefault'] ?? json['is_default'],
        fallback: false,
      ),
      revision: _asInt(json['revision'], fallback: 1),
      createdAt: _asDateTime(json['createdAt'] ?? json['created_at']),
      updatedAt: _asDateTime(json['updatedAt'] ?? json['updated_at']),
    );
  }

  BrandProfileDraft toDraft() {
    return BrandProfileDraft(
      name: name,
      logoAssetId: logoAssetId,
      primaryColors: primaryColors,
      secondaryColors: secondaryColors,
      fontHeading: fontHeading,
      fontBody: fontBody,
      toneKeywords: toneKeywords,
      ctaDefaults: ctaDefaults,
      captionStyleDefaults: captionStyleDefaults,
      motionIntensity: motionIntensity,
      transitionFamily: transitionFamily,
      introModuleEnabled: introModuleEnabled,
      outroModuleEnabled: outroModuleEnabled,
      isDefault: isDefault,
    );
  }

  BrandProfile copyWith({
    String? id,
    String? userId,
    String? projectId,
    String? name,
    String? logoAssetId,
    bool clearLogoAssetId = false,
    List<String>? primaryColors,
    List<String>? secondaryColors,
    String? fontHeading,
    bool clearFontHeading = false,
    String? fontBody,
    bool clearFontBody = false,
    List<String>? toneKeywords,
    Map<String, dynamic>? ctaDefaults,
    bool clearCtaDefaults = false,
    Map<String, dynamic>? captionStyleDefaults,
    bool clearCaptionStyleDefaults = false,
    String? motionIntensity,
    String? transitionFamily,
    bool clearTransitionFamily = false,
    bool? introModuleEnabled,
    bool? outroModuleEnabled,
    bool? isDefault,
    int? revision,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return BrandProfile(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      projectId: projectId ?? this.projectId,
      name: name ?? this.name,
      logoAssetId: clearLogoAssetId ? null : (logoAssetId ?? this.logoAssetId),
      primaryColors: primaryColors ?? this.primaryColors,
      secondaryColors: secondaryColors ?? this.secondaryColors,
      fontHeading: clearFontHeading ? null : (fontHeading ?? this.fontHeading),
      fontBody: clearFontBody ? null : (fontBody ?? this.fontBody),
      toneKeywords: toneKeywords ?? this.toneKeywords,
      ctaDefaults: clearCtaDefaults ? null : (ctaDefaults ?? this.ctaDefaults),
      captionStyleDefaults: clearCaptionStyleDefaults
          ? null
          : (captionStyleDefaults ?? this.captionStyleDefaults),
      motionIntensity: motionIntensity ?? this.motionIntensity,
      transitionFamily: clearTransitionFamily
          ? null
          : (transitionFamily ?? this.transitionFamily),
      introModuleEnabled: introModuleEnabled ?? this.introModuleEnabled,
      outroModuleEnabled: outroModuleEnabled ?? this.outroModuleEnabled,
      isDefault: isDefault ?? this.isDefault,
      revision: revision ?? this.revision,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'project_id': projectId,
      'name': name,
      'logo_asset_id': logoAssetId,
      'primary_colors': primaryColors,
      'secondary_colors': secondaryColors,
      'font_heading': fontHeading,
      'font_body': fontBody,
      'tone_keywords': toneKeywords,
      'cta_defaults': ctaDefaults,
      'caption_style_defaults': captionStyleDefaults,
      'motion_intensity': motionIntensity,
      'transition_family': transitionFamily,
      'intro_module_enabled': introModuleEnabled,
      'outro_module_enabled': outroModuleEnabled,
      'is_default': isDefault,
      'revision': revision,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }
}

class BrandProfileDraft {
  const BrandProfileDraft({
    required this.name,
    this.logoAssetId,
    this.primaryColors = const <String>[],
    this.secondaryColors = const <String>[],
    this.fontHeading,
    this.fontBody,
    this.toneKeywords = const <String>[],
    this.ctaDefaults,
    this.captionStyleDefaults,
    this.motionIntensity = 'medium',
    this.transitionFamily,
    this.introModuleEnabled = true,
    this.outroModuleEnabled = true,
    this.isDefault = false,
  });

  final String name;
  final String? logoAssetId;
  final List<String> primaryColors;
  final List<String> secondaryColors;
  final String? fontHeading;
  final String? fontBody;
  final List<String> toneKeywords;
  final Map<String, dynamic>? ctaDefaults;
  final Map<String, dynamic>? captionStyleDefaults;
  final String motionIntensity;
  final String? transitionFamily;
  final bool introModuleEnabled;
  final bool outroModuleEnabled;
  final bool isDefault;

  factory BrandProfileDraft.fromProfile(BrandProfile profile) {
    return BrandProfileDraft(
      name: profile.name,
      logoAssetId: profile.logoAssetId,
      primaryColors: profile.primaryColors,
      secondaryColors: profile.secondaryColors,
      fontHeading: profile.fontHeading,
      fontBody: profile.fontBody,
      toneKeywords: profile.toneKeywords,
      ctaDefaults: profile.ctaDefaults,
      captionStyleDefaults: profile.captionStyleDefaults,
      motionIntensity: profile.motionIntensity,
      transitionFamily: profile.transitionFamily,
      introModuleEnabled: profile.introModuleEnabled,
      outroModuleEnabled: profile.outroModuleEnabled,
      isDefault: profile.isDefault,
    );
  }

  BrandProfileDraft copyWith({
    String? name,
    String? logoAssetId,
    bool clearLogoAssetId = false,
    List<String>? primaryColors,
    List<String>? secondaryColors,
    String? fontHeading,
    bool clearFontHeading = false,
    String? fontBody,
    bool clearFontBody = false,
    List<String>? toneKeywords,
    Map<String, dynamic>? ctaDefaults,
    bool clearCtaDefaults = false,
    Map<String, dynamic>? captionStyleDefaults,
    bool clearCaptionStyleDefaults = false,
    String? motionIntensity,
    String? transitionFamily,
    bool clearTransitionFamily = false,
    bool? introModuleEnabled,
    bool? outroModuleEnabled,
    bool? isDefault,
  }) {
    return BrandProfileDraft(
      name: name ?? this.name,
      logoAssetId: clearLogoAssetId ? null : (logoAssetId ?? this.logoAssetId),
      primaryColors: primaryColors ?? this.primaryColors,
      secondaryColors: secondaryColors ?? this.secondaryColors,
      fontHeading: clearFontHeading ? null : (fontHeading ?? this.fontHeading),
      fontBody: clearFontBody ? null : (fontBody ?? this.fontBody),
      toneKeywords: toneKeywords ?? this.toneKeywords,
      ctaDefaults: clearCtaDefaults ? null : (ctaDefaults ?? this.ctaDefaults),
      captionStyleDefaults: clearCaptionStyleDefaults
          ? null
          : (captionStyleDefaults ?? this.captionStyleDefaults),
      motionIntensity: motionIntensity ?? this.motionIntensity,
      transitionFamily: clearTransitionFamily
          ? null
          : (transitionFamily ?? this.transitionFamily),
      introModuleEnabled: introModuleEnabled ?? this.introModuleEnabled,
      outroModuleEnabled: outroModuleEnabled ?? this.outroModuleEnabled,
      isDefault: isDefault ?? this.isDefault,
    );
  }

  Map<String, dynamic> toCreateJson() {
    return {
      'name': name,
      'logo_asset_id': logoAssetId,
      'primary_colors': primaryColors,
      'secondary_colors': secondaryColors,
      'font_heading': fontHeading,
      'font_body': fontBody,
      'tone_keywords': toneKeywords,
      'cta_defaults': ctaDefaults,
      'caption_style_defaults': captionStyleDefaults,
      'motion_intensity': motionIntensity,
      'transition_family': transitionFamily,
      'intro_module_enabled': introModuleEnabled,
      'outro_module_enabled': outroModuleEnabled,
      'is_default': isDefault,
    };
  }

  Map<String, dynamic> toUpdateJson() {
    return {
      'name': name,
      'logo_asset_id': logoAssetId,
      'primary_colors': primaryColors,
      'secondary_colors': secondaryColors,
      'font_heading': fontHeading,
      'font_body': fontBody,
      'tone_keywords': toneKeywords,
      'cta_defaults': ctaDefaults,
      'caption_style_defaults': captionStyleDefaults,
      'motion_intensity': motionIntensity,
      'transition_family': transitionFamily,
      'intro_module_enabled': introModuleEnabled,
      'outro_module_enabled': outroModuleEnabled,
      'is_default': isDefault,
    };
  }
}

String _asString(dynamic value) {
  final raw = value?.toString();
  final result = raw?.trim();
  if (result == null || result.isEmpty) {
    throw FormatException('Expected non-empty string value.');
  }
  return result;
}

String? _asStringOrNull(dynamic value) {
  if (value == null) {
    return null;
  }
  final result = value.toString().trim();
  return result.isEmpty ? null : result;
}

List<String> _asStringList(dynamic value) {
  if (value is List) {
    return value
        .map((entry) => entry?.toString().trim() ?? '')
        .where((entry) => entry.isNotEmpty)
        .toList();
  }
  return const <String>[];
}

Map<String, dynamic>? _asMapOrNull(dynamic value) {
  if (value is Map<String, dynamic>) {
    return value;
  }
  if (value is Map) {
    return Map<String, dynamic>.from(value);
  }
  return null;
}

bool _asBool(dynamic value, {required bool fallback}) {
  if (value is bool) {
    return value;
  }
  if (value is num) {
    return value != 0;
  }
  if (value is String) {
    final normalized = value.trim().toLowerCase();
    if (normalized == 'true' || normalized == '1') return true;
    if (normalized == 'false' || normalized == '0') return false;
  }
  return fallback;
}

int _asInt(dynamic value, {required int fallback}) {
  if (value is int) {
    return value;
  }
  if (value is num) {
    return value.toInt();
  }
  return int.tryParse(value?.toString() ?? '') ?? fallback;
}

DateTime _asDateTime(dynamic value) {
  final text = value?.toString();
  if (text == null || text.isEmpty) {
    throw FormatException('Expected valid datetime.');
  }
  return DateTime.parse(text);
}

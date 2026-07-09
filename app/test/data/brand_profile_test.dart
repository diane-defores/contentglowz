import 'package:app/data/models/brand_profile.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('parses brand profile payloads and preserves draft values', () {
    final profile = BrandProfile.fromJson({
      'id': 'brand-1',
      'user_id': 'user-1',
      'project_id': 'project-1',
      'name': 'Primary',
      'logo_asset_id': 'asset-1',
      'primary_colors': ['#111111', '#222222'],
      'secondary_colors': ['#EEEEEE'],
      'font_heading': 'Inter',
      'font_body': 'Inter',
      'tone_keywords': ['clear', 'direct'],
      'cta_defaults': {'label': 'Swipe to publish'},
      'caption_style_defaults': {'size': 'large'},
      'motion_intensity': 'high',
      'transition_family': 'snappy',
      'intro_module_enabled': true,
      'outro_module_enabled': false,
      'is_default': true,
      'revision': 3,
      'created_at': '2026-07-08T12:00:00Z',
      'updated_at': '2026-07-08T12:30:00Z',
    });

    expect(profile.id, 'brand-1');
    expect(profile.isDefault, isTrue);
    expect(profile.motionIntensity, 'high');
    expect(profile.primaryColors, ['#111111', '#222222']);
    expect(profile.toDraft().name, 'Primary');
    expect(profile.toJson()['project_id'], 'project-1');
  });

  test('builds create and update payloads from a draft', () {
    const draft = BrandProfileDraft(
      name: 'Brand A',
      primaryColors: ['#000000'],
      motionIntensity: 'medium',
      isDefault: true,
    );

    expect(draft.toCreateJson()['name'], 'Brand A');
    expect(draft.toUpdateJson()['is_default'], isTrue);
    expect(draft.copyWith(name: 'Brand B').name, 'Brand B');
  });
}

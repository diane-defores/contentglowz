import 'package:app/core/app_config.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AppConfig Sentry defaults', () {
    test('keeps Sentry disabled without build-time DSN', () {
      expect(AppConfig.sentryDsn, isEmpty);
      expect(AppConfig.effectiveSentryDist, isEmpty);
      expect(AppConfig.sentryTracesSampleRate, 0.0);
      expect(AppConfig.sentrySendDefaultPii, isFalse);
      expect(AppConfig.sentryDebug, isFalse);
    });

    test('does not invent a release when build commit is unknown', () {
      expect(AppConfig.effectiveSentryRelease, isEmpty);
    });
  });

  group('AppConfig.normalizeHttpOrigin', () {
    test('normalizes the compiled API_BASE_URL value', () {
      expect(AppConfig.apiBaseUrl, startsWith('https://'));
      expect(AppConfig.apiBaseUrl, isNot(contains('://api.contentglowz.com/')));
    });

    test('adds https scheme when production API host is provided without one', () {
      expect(
        AppConfig.normalizeHttpOrigin(
          'api.contentglowz.com',
          fallback: 'https://fallback.example',
        ),
        'https://api.contentglowz.com',
      );
    });

    test('rejects pathful API origins and keeps the fallback', () {
      expect(
        AppConfig.normalizeHttpOrigin(
          'https://api.contentglowz.com/api',
          fallback: 'https://fallback.example',
        ),
        'https://fallback.example',
      );
    });
  });
}

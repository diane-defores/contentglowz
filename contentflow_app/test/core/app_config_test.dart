import 'package:flutter_test/flutter_test.dart';

import 'package:contentflow_app/core/app_config.dart';

void main() {
  group('AppConfig Sentry defaults', () {
    test('keeps Sentry disabled without build-time DSN', () {
      expect(AppConfig.sentryDsn, isEmpty);
      expect(AppConfig.sentryTracesSampleRate, 0.0);
      expect(AppConfig.sentrySendDefaultPii, isFalse);
      expect(AppConfig.sentryDebug, isFalse);
    });

    test('does not invent a release when build commit is unknown', () {
      expect(AppConfig.effectiveSentryRelease, isEmpty);
    });
  });
}

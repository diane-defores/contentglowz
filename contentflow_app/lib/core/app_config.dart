class AppConfig {
  static const canonicalSiteUrl = 'https://contentflow.winflowz.com';

  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.winflowz.com',
  );

  static const clerkPublishableKey = String.fromEnvironment(
    'CLERK_PUBLISHABLE_KEY',
    defaultValue: '',
  );

  static const siteUrl = String.fromEnvironment(
    'APP_SITE_URL',
    defaultValue: canonicalSiteUrl,
  );

  static const appWebUrl = String.fromEnvironment(
    'APP_WEB_URL',
    defaultValue: 'https://app.contentflow.winflowz.com',
  );

  static const buildCommitSha = String.fromEnvironment(
    'BUILD_COMMIT_SHA',
    defaultValue: 'unknown',
  );

  static const buildEnvironment = String.fromEnvironment(
    'BUILD_ENVIRONMENT',
    defaultValue: 'unknown',
  );

  static const buildTimestamp = String.fromEnvironment(
    'BUILD_TIMESTAMP',
    defaultValue: 'unknown',
  );

  static const sentryDsn = String.fromEnvironment(
    'SENTRY_DSN',
    defaultValue: '',
  );

  static const sentryEnvironment = String.fromEnvironment(
    'SENTRY_ENVIRONMENT',
    defaultValue: buildEnvironment,
  );

  static const sentryRelease = String.fromEnvironment(
    'SENTRY_RELEASE',
    defaultValue: '',
  );

  static const sentryTracesSampleRateValue = String.fromEnvironment(
    'SENTRY_TRACES_SAMPLE_RATE',
    defaultValue: '0.0',
  );

  static const sentrySendDefaultPii = bool.fromEnvironment(
    'SENTRY_SEND_DEFAULT_PII',
    defaultValue: false,
  );

  static const sentryDebug = bool.fromEnvironment(
    'SENTRY_DEBUG',
    defaultValue: false,
  );

  static String get effectiveSentryEnvironment {
    final configured = sentryEnvironment.trim();
    return configured.isEmpty ? 'unknown' : configured;
  }

  static String get effectiveSentryRelease {
    final configured = sentryRelease.trim();
    if (configured.isNotEmpty) {
      return configured;
    }

    final commit = buildCommitSha.trim();
    if (commit.isEmpty || commit == 'unknown') {
      return '';
    }

    return 'contentflow_app@$commit';
  }

  static double get sentryTracesSampleRate {
    return _parseSampleRate(sentryTracesSampleRateValue, fallback: 0.0);
  }

  static bool get siteUrlPointsToAppHost {
    final configured = Uri.tryParse(siteUrl);
    final app = Uri.tryParse(appWebUrl);
    if (configured == null || configured.host.isEmpty) {
      return false;
    }
    if (app == null || app.host.isEmpty) {
      return false;
    }
    return configured.host == app.host;
  }

  static String get effectiveSiteUrl {
    final configured = Uri.tryParse(siteUrl);
    if (configured == null || configured.host.isEmpty) {
      return canonicalSiteUrl;
    }
    if (siteUrlPointsToAppHost) {
      return canonicalSiteUrl;
    }
    return siteUrl;
  }

  static double _parseSampleRate(String value, {required double fallback}) {
    final parsed = double.tryParse(value.trim());
    if (parsed == null || parsed < 0.0 || parsed > 1.0) {
      return fallback;
    }
    return parsed;
  }
}

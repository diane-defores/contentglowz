class AppConfig {
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
    defaultValue: 'https://contentflow.winflowz.com',
  );

  static const appWebUrl = String.fromEnvironment(
    'APP_WEB_URL',
    defaultValue: 'https://app.contentflow.winflowz.com',
  );
}

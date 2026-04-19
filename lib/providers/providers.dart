import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/app_config.dart';
import '../core/app_diagnostics.dart';
import '../core/app_language.dart';
import '../core/shared_preferences_provider.dart';
import '../data/models/affiliate_link.dart';
import '../data/models/drip_plan.dart';
import '../data/models/app_access_state.dart';
import '../data/models/app_bootstrap.dart';
import '../data/models/app_settings.dart';
import '../data/models/auth_session.dart';
import '../data/models/content_item.dart';
import '../data/models/creator_profile.dart';
import '../data/models/feedback_entry.dart';
import '../data/models/idea.dart';
import '../data/models/persona.dart';
import '../data/models/project.dart';
import '../data/models/ritual.dart';
import '../data/services/api_service.dart';
import '../data/services/clerk_auth_service.dart';
import '../data/services/feedback_local_store.dart';
import '../data/services/feedback_service.dart';

const _apiBaseUrlKey = 'api_base_url';
const _appLanguagePreferenceKey = 'app_language_preference';
const _demoModeKey = 'demo_mode_enabled';
const _demoOnboardingKey = 'demo_onboarding_complete';

final apiBaseUrlProvider = StateNotifierProvider<ApiBaseUrlNotifier, String>((
  ref,
) {
  return ApiBaseUrlNotifier(ref);
});

final appLanguagePreferenceProvider =
    StateNotifierProvider<AppLanguagePreferenceNotifier, String>((ref) {
      return AppLanguagePreferenceNotifier(ref);
    });

String _normalizeApiBaseUrl(String? raw) {
  final fallback = AppConfig.apiBaseUrl;
  final value = raw?.trim();
  if (value == null || value.isEmpty) {
    return fallback;
  }

  final uri = Uri.tryParse(value);
  if (uri == null ||
      !uri.hasScheme ||
      !(uri.scheme == 'http' || uri.scheme == 'https') ||
      uri.host.isEmpty) {
    return fallback;
  }

  if (uri.path.isNotEmpty && uri.path != '/') {
    return fallback;
  }

  return uri
      .replace(path: '', query: null, fragment: null)
      .toString()
      .replaceAll(RegExp(r'/$'), '');
}

class ApiBaseUrlNotifier extends StateNotifier<String> {
  ApiBaseUrlNotifier(this.ref)
    : super(
        _normalizeApiBaseUrl(
          ref.read(sharedPrefsProvider).getString(_apiBaseUrlKey),
        ),
      );

  final Ref ref;

  Future<void> update(String url) async {
    final normalized = _normalizeApiBaseUrl(url);
    state = normalized;
    await ref.read(sharedPrefsProvider).setString(_apiBaseUrlKey, normalized);
  }
}

class AppLanguagePreferenceNotifier extends StateNotifier<String> {
  AppLanguagePreferenceNotifier(this.ref)
    : super(
        normalizeAppLanguagePreference(
          ref.read(sharedPrefsProvider).getString(_appLanguagePreferenceKey),
        ),
      );

  final Ref ref;

  Future<void> update(String language) async {
    final normalized = normalizeAppLanguagePreference(language);
    state = normalized;
    await ref
        .read(sharedPrefsProvider)
        .setString(_appLanguagePreferenceKey, normalized);
  }
}

final apiServiceProvider = Provider<ApiService>((ref) {
  final baseUrl = ref.watch(apiBaseUrlProvider);
  final authSession = ref.watch(authSessionProvider);
  final clerkAuthService = ref.watch(clerkAuthServiceProvider);
  return ApiService(
    baseUrl: baseUrl,
    authToken: authSession.bearerToken,
    authTokenProvider: authSession.isAuthenticated
        ? () async => clerkAuthService?.getFreshToken()
        : null,
    allowDemoData: authSession.isDemo,
    diagnostics: ref.watch(appDiagnosticsProvider),
    onUnauthorized: () {
      ref.read(authSessionProvider.notifier).handleUnauthorized();
    },
  );
});

final Provider<FeedbackLocalStore> feedbackLocalStoreProvider =
    Provider<FeedbackLocalStore>((ref) {
      return FeedbackLocalStore(ref.read(sharedPrefsProvider));
    });

final Provider<FeedbackService> feedbackServiceProvider =
    Provider<FeedbackService>((ref) {
      return FeedbackService(
        api: () => ref.read(apiServiceProvider),
        localStore: () => ref.read(feedbackLocalStoreProvider),
        authSession: () => ref.read(authSessionProvider),
        language: () =>
            ref.read(currentUserSettingsProvider).valueOrNull?.language,
        invalidateRecentSubmissions: () {
          ref.invalidate(feedbackRecentSubmissionsProvider);
        },
        invalidateDefaultAdminEntries: () {
          ref.invalidate(
            feedbackAdminEntriesProvider(const FeedbackAdminQuery()),
          );
        },
      );
    });

final isFeedbackAdminProvider = Provider<bool>((ref) {
  final session = ref.watch(authSessionProvider);
  final email = session.email?.trim().toLowerCase();
  if (email == null || email.isEmpty) {
    return false;
  }
  return AppConfig.feedbackAdminEmails.contains(email);
});

final Provider<String> feedbackDraftProvider = Provider<String>((ref) {
  return ref.read(feedbackServiceProvider).loadDraftMessage();
});

final FutureProvider<List<LocalFeedbackSubmission>>
feedbackRecentSubmissionsProvider =
    FutureProvider<List<LocalFeedbackSubmission>>((ref) async {
      return ref.read(feedbackServiceProvider).loadRecentSubmissions();
    });

final FutureProviderFamily<List<FeedbackEntry>, FeedbackAdminQuery>
feedbackAdminEntriesProvider =
    FutureProvider.family<List<FeedbackEntry>, FeedbackAdminQuery>((
      ref,
      query,
    ) async {
      return ref.read(feedbackServiceProvider).listAdmin(query: query);
    });

final clerkPublishableKeyProvider = Provider<String>(
  (ref) => AppConfig.clerkPublishableKey,
);

final clerkAuthServiceProvider = Provider<ClerkAuthService?>((ref) {
  final publishableKey = ref.watch(clerkPublishableKeyProvider);
  if (publishableKey.isEmpty) {
    return null;
  }

  final service = ClerkAuthService(
    publishableKey: publishableKey,
    sharedPreferences: ref.read(sharedPrefsProvider),
  );
  ref.onDispose(service.terminate);
  return service;
});

final authSessionProvider =
    StateNotifierProvider<AuthSessionNotifier, AuthSession>(
      (ref) => AuthSessionNotifier(ref),
    );

final appAccessStateProvider =
    AsyncNotifierProvider<AppAccessNotifier, AppAccessState>(
      AppAccessNotifier.new,
    );

class AuthSessionNotifier extends StateNotifier<AuthSession> {
  AuthSessionNotifier(this.ref)
    : super(const AuthSession(status: AuthStatus.loading)) {
    unawaited(_restoreSession());
  }

  final Ref ref;

  Future<void> _restoreSession() async {
    final diagnostics = ref.read(appDiagnosticsProvider);
    diagnostics.info(
      scope: 'auth.restore',
      message: 'Restoring stored session.',
    );
    final prefs = ref.read(sharedPrefsProvider);
    if (prefs.getBool(_demoModeKey) == true) {
      state = AuthSession(
        status: AuthStatus.demo,
        onboardingComplete: prefs.getBool(_demoOnboardingKey) ?? false,
      );
      diagnostics.info(
        scope: 'auth.restore',
        message: 'Restored demo session.',
        context: {'onboardingComplete': state.onboardingComplete},
      );
      ref.invalidate(appBootstrapProvider);
      return;
    }

    final service = ref.read(clerkAuthServiceProvider);
    if (service == null) {
      _clearLegacyAuthPrefs();
      state = const AuthSession(status: AuthStatus.signedOut);
      diagnostics.warning(
        scope: 'auth.restore',
        message: 'Clerk is not configured. Starting signed out.',
      );
      return;
    }

    try {
      final restored = await service.restoreSession();
      if (restored == null) {
        _clearLegacyAuthPrefs();
        state = const AuthSession(status: AuthStatus.signedOut);
        diagnostics.info(
          scope: 'auth.restore',
          message: 'No active Clerk session found.',
        );
        return;
      }

      _clearLegacyAuthPrefs();
      state = AuthSession(
        status: AuthStatus.authenticated,
        bearerToken: restored.bearerToken,
        email: restored.email,
      );
      diagnostics.info(
        scope: 'auth.restore',
        message: 'Restored authenticated Clerk session.',
        context: {'email': restored.email ?? 'none'},
      );
      _invalidateAuthenticatedState();
    } catch (error, stackTrace) {
      _clearLegacyAuthPrefs();
      state = const AuthSession(status: AuthStatus.signedOut);
      diagnostics.error(
        scope: 'auth.restore',
        message: 'Failed to restore Clerk session.',
        error: error,
        stackTrace: stackTrace,
      );
    }
  }

  void signInDemo() {
    final prefs = ref.read(sharedPrefsProvider);
    prefs.setBool(_demoModeKey, true);
    prefs.setBool(_demoOnboardingKey, false);
    _clearLegacyAuthPrefs();
    state = const AuthSession(
      status: AuthStatus.demo,
      onboardingComplete: false,
    );
    ref
        .read(appDiagnosticsProvider)
        .info(scope: 'auth.session', message: 'Signed in to demo workspace.');
    _invalidateAuthenticatedState();
  }

  void setAuthenticatedSession(String token, {String? email}) {
    final prefs = ref.read(sharedPrefsProvider);
    prefs.remove(_demoModeKey);
    prefs.remove(_demoOnboardingKey);
    _clearLegacyAuthPrefs();

    state = AuthSession(
      status: AuthStatus.authenticated,
      bearerToken: token,
      email: email,
    );
    ref
        .read(appDiagnosticsProvider)
        .info(
          scope: 'auth.session',
          message: 'Authenticated session established.',
          context: {'email': email ?? 'none'},
        );
    _invalidateAuthenticatedState();
  }

  void markOnboardingComplete() {
    if (!state.isDemo) {
      return;
    }

    final prefs = ref.read(sharedPrefsProvider);
    prefs.setBool(_demoOnboardingKey, true);
    state = state.copyWith(onboardingComplete: true);
    ref.invalidate(appBootstrapProvider);
  }

  Future<void> signInWithPassword({
    required String email,
    required String password,
  }) async {
    final diagnostics = ref.read(appDiagnosticsProvider);
    final service = ref.read(clerkAuthServiceProvider);
    if (service == null) {
      diagnostics.warning(
        scope: 'auth.sign_in',
        message: 'Sign-in requested without Clerk configuration.',
        context: {'email': email},
      );
      throw StateError('Clerk is not configured. Set CLERK_PUBLISHABLE_KEY.');
    }

    diagnostics.info(
      scope: 'auth.sign_in',
      message: 'Attempting password sign-in.',
      context: {'email': email},
    );

    try {
      final result = await service.signInWithPassword(
        email: email,
        password: password,
      );
      setAuthenticatedSession(result.bearerToken, email: result.email ?? email);
    } catch (error, stackTrace) {
      diagnostics.error(
        scope: 'auth.sign_in',
        message: 'Password sign-in failed.',
        error: error,
        stackTrace: stackTrace,
        context: {'email': email},
      );
      rethrow;
    }
  }

  Future<void> signUpWithPassword({
    required String email,
    required String password,
    String? firstName,
    String? lastName,
  }) async {
    final diagnostics = ref.read(appDiagnosticsProvider);
    final service = ref.read(clerkAuthServiceProvider);
    if (service == null) {
      diagnostics.warning(
        scope: 'auth.sign_up',
        message: 'Sign-up requested without Clerk configuration.',
        context: {'email': email},
      );
      throw StateError('Clerk is not configured. Set CLERK_PUBLISHABLE_KEY.');
    }

    diagnostics.info(
      scope: 'auth.sign_up',
      message: 'Attempting password sign-up.',
      context: {'email': email, 'firstName': firstName, 'lastName': lastName},
    );

    try {
      final result = await service.signUpWithPassword(
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
      );
      setAuthenticatedSession(result.bearerToken, email: result.email ?? email);
    } catch (error, stackTrace) {
      diagnostics.error(
        scope: 'auth.sign_up',
        message: 'Password sign-up failed.',
        error: error,
        stackTrace: stackTrace,
        context: {'email': email, 'firstName': firstName, 'lastName': lastName},
      );
      rethrow;
    }
  }

  Future<void> syncFromClerkSession() async {
    final diagnostics = ref.read(appDiagnosticsProvider);
    final service = ref.read(clerkAuthServiceProvider);
    if (service == null) {
      diagnostics.warning(
        scope: 'auth.sync',
        message: 'Session sync requested without Clerk configuration.',
      );
      throw StateError('Clerk is not configured. Set CLERK_PUBLISHABLE_KEY.');
    }

    diagnostics.info(
      scope: 'auth.sync',
      message: 'Syncing from Clerk session.',
    );

    try {
      final restored = await service.restoreSession();
      if (restored == null) {
        throw StateError('Clerk did not return an active session.');
      }

      setAuthenticatedSession(restored.bearerToken, email: restored.email);
    } catch (error, stackTrace) {
      diagnostics.error(
        scope: 'auth.sync',
        message: 'Failed to sync from Clerk session.',
        error: error,
        stackTrace: stackTrace,
      );
      rethrow;
    }
  }

  Future<void> clearLocalSession() async {
    final diagnostics = ref.read(appDiagnosticsProvider);
    final service = ref.read(clerkAuthServiceProvider);
    try {
      await service?.signOut();
    } catch (error, stackTrace) {
      diagnostics.warning(
        scope: 'auth.clear_session',
        message: 'Remote sign-out failed while clearing local session.',
        error: error,
        stackTrace: stackTrace,
      );
    }

    final prefs = ref.read(sharedPrefsProvider);
    await prefs.remove(_demoModeKey);
    await prefs.remove(_demoOnboardingKey);

    for (final key in prefs.getKeys()) {
      final normalized = key.toLowerCase();
      if (normalized.contains('clerk') ||
          normalized.contains('session') ||
          normalized.contains('jwt')) {
        await prefs.remove(key);
      }
    }

    _clearLegacyAuthPrefs();
    state = const AuthSession(status: AuthStatus.signedOut);
    diagnostics.info(
      scope: 'auth.clear_session',
      message: 'Local auth session cleared.',
    );
    _invalidateAuthenticatedState();
  }

  void signOut() {
    ref
        .read(appDiagnosticsProvider)
        .info(scope: 'auth.sign_out', message: 'Sign-out requested.');
    unawaited(_signOut(remote: true));
  }

  void handleUnauthorized() {
    if (!state.isAuthenticated) {
      return;
    }
    ref
        .read(appDiagnosticsProvider)
        .warning(
          scope: 'auth.unauthorized',
          message: 'Backend returned unauthorized for active session.',
        );
    unawaited(_signOut(remote: false));
  }

  Future<void> _signOut({required bool remote}) async {
    if (remote) {
      final service = ref.read(clerkAuthServiceProvider);
      try {
        await service?.signOut();
      } catch (error, stackTrace) {
        ref
            .read(appDiagnosticsProvider)
            .warning(
              scope: 'auth.sign_out',
              message: 'Remote sign-out failed. Clearing local session anyway.',
              error: error,
              stackTrace: stackTrace,
            );
      }
    }

    final prefs = ref.read(sharedPrefsProvider);
    await prefs.remove(_demoModeKey);
    await prefs.remove(_demoOnboardingKey);
    _clearLegacyAuthPrefs();

    state = const AuthSession(status: AuthStatus.signedOut);
    ref
        .read(appDiagnosticsProvider)
        .info(
          scope: 'auth.sign_out',
          message: 'Session signed out locally.',
          context: {'remote': remote},
        );
    _invalidateAuthenticatedState();
  }

  void _invalidateAuthenticatedState() {
    ref.invalidate(appBootstrapProvider);
    ref.invalidate(projectsProvider);
    ref.invalidate(currentUserSettingsProvider);
    ref.invalidate(creatorProfileProvider);
    ref.invalidate(publishAccountsProvider);
    ref.invalidate(pendingContentProvider);
    ref.invalidate(contentHistoryProvider);
    ref.invalidate(personasProvider);
    ref.invalidate(isFeedbackAdminProvider);
    ref.invalidate(feedbackRecentSubmissionsProvider);
    ref.invalidate(feedbackAdminEntriesProvider(const FeedbackAdminQuery()));
  }

  void _clearLegacyAuthPrefs() {
    final prefs = ref.read(sharedPrefsProvider);
    prefs.remove('auth_mode');
    prefs.remove('auth_bearer_token');
    prefs.remove('auth_email');
    prefs.remove('is_logged_in');
    prefs.remove('onboarding_complete');
  }
}

class AppAccessNotifier extends AsyncNotifier<AppAccessState> {
  @override
  Future<AppAccessState> build() async {
    ref.watch(apiBaseUrlProvider);
    final authSession = ref.watch(authSessionProvider);
    return _resolve(authSession);
  }

  Future<void> refresh() async {
    final authSession = ref.read(authSessionProvider);
    state = await AsyncValue.guard(() => _resolve(authSession));
  }

  Future<AppAccessState> _resolve(AuthSession authSession) async {
    final diagnostics = ref.read(appDiagnosticsProvider);
    if (authSession.isLoading) {
      return const AppAccessState(stage: AppAccessStage.restoringSession);
    }

    if (authSession.status == AuthStatus.signedOut) {
      diagnostics.info(
        scope: 'app_access.resolve',
        message: 'Access resolution ended in signed-out state.',
      );
      return const AppAccessState(stage: AppAccessStage.signedOut);
    }

    if (authSession.isDemo || authSession.bearerToken == null) {
      diagnostics.info(
        scope: 'app_access.resolve',
        message: 'Access resolution entered demo mode.',
      );
      return AppAccessState(
        stage: AppAccessStage.demo,
        bootstrap: AppBootstrap.demo(
          onboardingComplete: authSession.onboardingComplete,
        ),
        checkedAt: DateTime.now(),
      );
    }

    final api = ref.read(apiServiceProvider);
    diagnostics.info(
      scope: 'app_access.resolve',
      message: 'Checking backend availability.',
    );
    state = AsyncData(
      AppAccessState(
        stage: AppAccessStage.checkingBackend,
        checkedAt: DateTime.now(),
      ),
    );

    final health = await api.healthCheck();
    final checkedAt = DateTime.now();
    final backendReachable =
        health['status'] == 'ok' || health['status'] == 'healthy';

    if (!backendReachable) {
      diagnostics.warning(
        scope: 'app_access.resolve',
        message: 'Backend health check reported unavailable status.',
        context: {'backendStatus': health['status']},
      );
      return AppAccessState(
        stage: AppAccessStage.apiUnavailable,
        backendHealth: health,
        message: 'FastAPI health check did not return a healthy status.',
        checkedAt: checkedAt,
      );
    }

    state = AsyncData(
      AppAccessState(
        stage: AppAccessStage.checkingWorkspace,
        backendHealth: health,
        checkedAt: checkedAt,
      ),
    );

    try {
      diagnostics.info(
        scope: 'app_access.resolve',
        message: 'Loading workspace bootstrap.',
      );
      final bootstrap = await api.fetchBootstrap();
      diagnostics.info(
        scope: 'app_access.resolve',
        message: bootstrap.shouldOnboard
            ? 'Workspace requires onboarding.'
            : 'Workspace bootstrap completed.',
      );
      return AppAccessState(
        stage: bootstrap.shouldOnboard
            ? AppAccessStage.needsOnboarding
            : AppAccessStage.ready,
        backendHealth: health,
        bootstrap: bootstrap,
        checkedAt: DateTime.now(),
      );
    } on ApiException catch (error) {
      diagnostics.warning(
        scope: 'app_access.resolve',
        message: error.isUnauthorized
            ? 'Workspace bootstrap was rejected by the backend.'
            : 'Workspace bootstrap failed.',
        error: error,
        context: {
          'statusCode': error.statusCode,
          'path': error.path,
          'method': error.method,
        },
      );
      return AppAccessState(
        stage: error.isUnauthorized
            ? AppAccessStage.bootstrapUnauthorized
            : AppAccessStage.bootstrapFailed,
        backendHealth: health,
        statusCode: error.statusCode,
        message: error.message,
        checkedAt: DateTime.now(),
      );
    } catch (error, stackTrace) {
      diagnostics.error(
        scope: 'app_access.resolve',
        message: 'Workspace bootstrap failed unexpectedly.',
        error: error,
        stackTrace: stackTrace,
      );
      return AppAccessState(
        stage: AppAccessStage.bootstrapFailed,
        backendHealth: health,
        message: error.toString(),
        checkedAt: DateTime.now(),
      );
    }
  }
}

final appBootstrapProvider = Provider<AppBootstrap?>((ref) {
  return ref.watch(appAccessStateProvider).valueOrNull?.bootstrap;
});

final projectsProvider = FutureProvider<List<Project>>((ref) async {
  final api = ref.read(apiServiceProvider);
  return api.fetchProjects();
});

final publishAccountsProvider = FutureProvider<List<PublishAccount>>((
  ref,
) async {
  final accessState = ref.watch(appAccessStateProvider).valueOrNull;
  if (accessState?.isReady != true) {
    return const <PublishAccount>[];
  }
  final api = ref.watch(apiServiceProvider);
  return api.fetchPublishAccounts();
});

final pendingContentProvider =
    AsyncNotifierProvider<PendingContentNotifier, List<ContentItem>>(
      PendingContentNotifier.new,
    );

class PendingContentNotifier extends AsyncNotifier<List<ContentItem>> {
  @override
  Future<List<ContentItem>> build() async {
    final api = ref.read(apiServiceProvider);
    return api.fetchPendingContent();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final api = ref.read(apiServiceProvider);
      return api.fetchPendingContent();
    });
  }

  Future<ApproveResult> approve(String id) async {
    final current = state.valueOrNull ?? [];
    final item = current.where((c) => c.id == id).firstOrNull;
    state = AsyncData(current.where((c) => c.id != id).toList());
    try {
      final api = ref.read(apiServiceProvider);
      await api.approveContent(id);

      if (item == null) {
        ref.invalidate(contentHistoryProvider);
        return const ApproveResult(
          approved: true,
          published: false,
          message: 'Content approved.',
        );
      }

      if (item.channels.isEmpty) {
        ref.invalidate(contentHistoryProvider);
        return ApproveResult(
          approved: true,
          published: false,
          message:
              'Approved "${item.title}" with no publish channels configured.',
          severity: ApproveSeverity.info,
        );
      }

      final publishableChannels = <PublishingChannel>[];
      final unsupportedChannels = <String>[];
      for (final channel in item.channels) {
        if (channelToPlatform(channel) != null) {
          publishableChannels.add(channel);
        } else {
          unsupportedChannels.add(channel.name);
        }
      }

      if (publishableChannels.isEmpty) {
        ref.invalidate(contentHistoryProvider);
        return ApproveResult(
          approved: true,
          published: false,
          message:
              'Approved "${item.title}", but selected channels are not wired to LATE yet: ${unsupportedChannels.join(', ')}.',
          severity: ApproveSeverity.warning,
        );
      }

      final accounts = await ref.read(publishAccountsProvider.future);
      final platforms = <Map<String, String>>[];
      final missingAccounts = <String>[];

      for (final channel in publishableChannels) {
        final platform = channelToPlatform(channel);
        if (platform == null) continue;
        final account = _resolvePublishAccount(accounts, platform);
        if (account == null) {
          missingAccounts.add(platform);
          continue;
        }
        platforms.add({'platform': platform, 'account_id': account.id});
      }

      if (platforms.isEmpty) {
        ref.invalidate(contentHistoryProvider);
        return ApproveResult(
          approved: true,
          published: false,
          message:
              'Approved "${item.title}", but no connected LATE accounts matched: ${missingAccounts.join(', ')}.',
          severity: ApproveSeverity.warning,
        );
      }

      final response = await api.publishContent(
        content: item.body,
        platforms: platforms,
        title: item.title,
        tags: item.tags,
        contentRecordId: item.id,
      );

      ref.invalidate(contentHistoryProvider);

      final success = response['success'] == true;
      final publishedPlatforms = platforms
          .map((p) => p['platform'])
          .whereType<String>()
          .toList();
      final warnings = <String>[
        if (missingAccounts.isNotEmpty)
          'missing accounts: ${missingAccounts.join(', ')}',
        if (unsupportedChannels.isNotEmpty)
          'unsupported channels: ${unsupportedChannels.join(', ')}',
      ];

      if (!success) {
        final error = (response['error'] ?? 'Publishing failed').toString();
        return ApproveResult(
          approved: true,
          published: false,
          message:
              'Approved "${item.title}", but publish failed: $error${warnings.isNotEmpty ? ' (${warnings.join(' | ')})' : ''}.',
          severity: ApproveSeverity.warning,
        );
      }

      return ApproveResult(
        approved: true,
        published: true,
        message:
            'Published "${item.title}" to ${publishedPlatforms.join(', ')}${warnings.isNotEmpty ? ' (${warnings.join(' | ')})' : ''}.',
        severity: warnings.isEmpty
            ? ApproveSeverity.success
            : ApproveSeverity.warning,
      );
    } catch (error) {
      state = AsyncData(current);
      return ApproveResult(
        approved: false,
        published: false,
        message: 'Approval failed: $error',
        severity: ApproveSeverity.error,
      );
    }
  }

  Future<void> reject(String id) async {
    final current = state.valueOrNull ?? [];
    state = AsyncData(current.where((c) => c.id != id).toList());
    try {
      final api = ref.read(apiServiceProvider);
      await api.rejectContent(id);
      ref.invalidate(contentHistoryProvider);
    } catch (_) {
      state = AsyncData(current);
    }
  }

  void updateItem(ContentItem updated) {
    final current = state.valueOrNull ?? [];
    state = AsyncData(
      current.map((c) => c.id == updated.id ? updated : c).toList(),
    );
  }
}

enum ApproveSeverity { success, info, warning, error }

class ApproveResult {
  final bool approved;
  final bool published;
  final String message;
  final ApproveSeverity severity;

  const ApproveResult({
    required this.approved,
    required this.published,
    required this.message,
    this.severity = ApproveSeverity.success,
  });
}

String? channelToPlatform(PublishingChannel ch) => switch (ch) {
  PublishingChannel.twitter => 'twitter',
  PublishingChannel.linkedin => 'linkedin',
  PublishingChannel.instagram => 'instagram',
  PublishingChannel.tiktok => 'tiktok',
  PublishingChannel.youtube => 'youtube',
  _ => null,
};

PublishAccount? _resolvePublishAccount(
  List<PublishAccount> accounts,
  String platform,
) {
  for (final account in accounts) {
    if (account.platform == platform && account.isActive) {
      return account;
    }
  }
  for (final account in accounts) {
    if (account.platform == platform) {
      return account;
    }
  }
  return null;
}

final contentHistoryProvider = FutureProvider<List<ContentItem>>((ref) async {
  final api = ref.read(apiServiceProvider);
  return api.fetchContentHistory();
});

final pendingCountProvider = Provider<int>((ref) {
  return ref.watch(pendingContentProvider).valueOrNull?.length ?? 0;
});

final backendStatusProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final accessState = ref.watch(appAccessStateProvider).valueOrNull;
  if (accessState?.backendHealth != null) {
    return accessState!.backendHealth!;
  }
  final api = ref.read(apiServiceProvider);
  return api.healthCheck();
});

final currentUserSettingsProvider =
    AsyncNotifierProvider<UserSettingsNotifier, AppSettings?>(
      UserSettingsNotifier.new,
    );

class UserSettingsNotifier extends AsyncNotifier<AppSettings?> {
  @override
  Future<AppSettings?> build() async {
    final authSession = ref.watch(authSessionProvider);
    final accessState = ref.watch(appAccessStateProvider).valueOrNull;
    if (authSession.isLoading || authSession.status == AuthStatus.signedOut) {
      return null;
    }

    if (authSession.isDemo) {
      return AppSettings(
        id: 'demo-settings',
        userId: 'demo-user',
        theme: 'system',
        language: ref.read(appLanguagePreferenceProvider),
        emailNotifications: true,
      );
    }

    if (accessState?.isReady != true) {
      return null;
    }

    final api = ref.read(apiServiceProvider);
    final settings = await api.fetchSettings();
    final normalizedLanguage = normalizeAppLanguagePreference(
      settings.language,
    );
    await ref
        .read(appLanguagePreferenceProvider.notifier)
        .update(normalizedLanguage);
    return settings.copyWith(language: normalizedLanguage);
  }

  Future<void> toggleNotifications(bool enabled) async {
    final current = state.valueOrNull;
    if (current == null) {
      return;
    }

    if (ref.read(authSessionProvider).isDemo) {
      state = AsyncData(current.copyWith(emailNotifications: enabled));
      return;
    }

    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final api = ref.read(apiServiceProvider);
      return api.updateSettings({'emailNotifications': enabled});
    });
  }

  Future<void> toggleIdeaPool(bool enabled) async {
    final current = state.valueOrNull;
    if (current == null) return;

    if (ref.read(authSessionProvider).isDemo) {
      final rs = Map<String, dynamic>.from(current.robotSettings ?? {});
      rs['ideaPoolEnabled'] = enabled;
      state = AsyncData(current.copyWith(robotSettings: rs));
      return;
    }

    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final api = ref.read(apiServiceProvider);
      return api.updateSettings({
        'robotSettings': {'ideaPoolEnabled': enabled},
      });
    });
  }

  Future<void> updateLanguage(String language) async {
    final normalizedLanguage = normalizeAppLanguagePreference(language);
    await ref
        .read(appLanguagePreferenceProvider.notifier)
        .update(normalizedLanguage);

    final current = state.valueOrNull;
    if (current == null) {
      return;
    }

    if (ref.read(authSessionProvider).isDemo) {
      state = AsyncData(current.copyWith(language: normalizedLanguage));
      return;
    }

    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final api = ref.read(apiServiceProvider);
      final settings = await api.updateSettings({
        'language': normalizedLanguage,
      });
      return settings.copyWith(language: normalizedLanguage);
    });
  }
}

final creatorProfileProvider = FutureProvider<CreatorProfile?>((ref) async {
  final authSession = ref.watch(authSessionProvider);
  if (!authSession.isAuthenticated) {
    return null;
  }

  final api = ref.read(apiServiceProvider);
  return api.fetchCreatorProfile();
});

final personasProvider = FutureProvider<List<Persona>>((ref) async {
  final api = ref.read(apiServiceProvider);
  return api.fetchPersonas();
});

final affiliationsProvider = FutureProvider<List<AffiliateLink>>((ref) async {
  final api = ref.read(apiServiceProvider);
  return api.fetchAffiliations();
});

final lastNarrativeProvider = StateProvider<NarrativeSynthesisResult?>(
  (ref) => null,
);

// ─── Idea Pool ──────────────────────────────────────────

final ideasProvider = AsyncNotifierProvider<IdeasNotifier, List<Idea>>(
  IdeasNotifier.new,
);

class IdeasNotifier extends AsyncNotifier<List<Idea>> {
  String _statusFilter = 'all';
  String _sourceFilter = 'all';

  String get statusFilter => _statusFilter;
  String get sourceFilter => _sourceFilter;

  @override
  Future<List<Idea>> build() async {
    final api = ref.read(apiServiceProvider);
    return api.fetchIdeas(
      status: _statusFilter == 'all' ? null : _statusFilter,
      source: _sourceFilter == 'all' ? null : _sourceFilter,
    );
  }

  void setStatusFilter(String filter) {
    _statusFilter = filter;
    ref.invalidateSelf();
  }

  void setSourceFilter(String filter) {
    _sourceFilter = filter;
    ref.invalidateSelf();
  }

  Future<void> dismissIdea(String id) async {
    final api = ref.read(apiServiceProvider);
    await api.updateIdea(id, {'status': 'dismissed'});
    ref.invalidateSelf();
  }

  Future<void> prioritizeIdea(String id, double score) async {
    final api = ref.read(apiServiceProvider);
    await api.updateIdea(id, {'priority_score': score});
    ref.invalidateSelf();
  }

  Future<void> deleteIdea(String id) async {
    final api = ref.read(apiServiceProvider);
    await api.deleteIdea(id);
    ref.invalidateSelf();
  }
}

// ─── Content Drip ──────────────────────────────────────────

final dripPlansProvider = FutureProvider<List<DripPlan>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final raw = await api.fetchDripPlans();
  return raw.map((j) => DripPlan.fromJson(j)).toList();
});

final dripStatsProvider = FutureProvider.family<DripStats, String>((
  ref,
  planId,
) async {
  final api = ref.read(apiServiceProvider);
  final raw = await api.getDripStats(planId);
  return DripStats.fromJson(raw);
});

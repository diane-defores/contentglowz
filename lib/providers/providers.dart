import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/app_config.dart';
import '../data/models/affiliate_link.dart';
import '../data/models/app_bootstrap.dart';
import '../data/models/app_settings.dart';
import '../data/models/auth_session.dart';
import '../data/models/content_item.dart';
import '../data/models/creator_profile.dart';
import '../data/models/persona.dart';
import '../data/models/project.dart';
import '../data/models/ritual.dart';
import '../data/services/api_service.dart';
import '../data/services/clerk_auth_service.dart';
import '../main.dart';

const _apiBaseUrlKey = 'api_base_url';
const _demoModeKey = 'demo_mode_enabled';
const _demoOnboardingKey = 'demo_onboarding_complete';

final apiBaseUrlProvider =
    StateNotifierProvider<ApiBaseUrlNotifier, String>((ref) {
      return ApiBaseUrlNotifier(ref);
    });

class ApiBaseUrlNotifier extends StateNotifier<String> {
  ApiBaseUrlNotifier(this.ref)
    : super(
        ref.read(sharedPrefsProvider).getString(_apiBaseUrlKey) ??
            AppConfig.apiBaseUrl,
      );

  final Ref ref;

  Future<void> update(String url) async {
    state = url;
    await ref.read(sharedPrefsProvider).setString(_apiBaseUrlKey, url);
  }
}

final apiServiceProvider = Provider<ApiService>((ref) {
  final baseUrl = ref.watch(apiBaseUrlProvider);
  final authSession = ref.watch(authSessionProvider);
  return ApiService(
    baseUrl: baseUrl,
    authToken: authSession.bearerToken,
    allowDemoData: authSession.isDemo,
    onUnauthorized: () {
      ref.read(authSessionProvider.notifier).handleUnauthorized();
    },
  );
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

class AuthSessionNotifier extends StateNotifier<AuthSession> {
  AuthSessionNotifier(this.ref)
    : super(const AuthSession(status: AuthStatus.loading)) {
    unawaited(_restoreSession());
  }

  final Ref ref;

  Future<void> _restoreSession() async {
    final prefs = ref.read(sharedPrefsProvider);
    if (prefs.getBool(_demoModeKey) == true) {
      state = AuthSession(
        status: AuthStatus.demo,
        onboardingComplete: prefs.getBool(_demoOnboardingKey) ?? false,
      );
      ref.invalidate(appBootstrapProvider);
      return;
    }

    final service = ref.read(clerkAuthServiceProvider);
    if (service == null) {
      _clearLegacyAuthPrefs();
      state = const AuthSession(status: AuthStatus.signedOut);
      return;
    }

    try {
      final restored = await service.restoreSession();
      if (restored == null) {
        _clearLegacyAuthPrefs();
        state = const AuthSession(status: AuthStatus.signedOut);
        return;
      }

      _clearLegacyAuthPrefs();
      state = AuthSession(
        status: AuthStatus.authenticated,
        bearerToken: restored.bearerToken,
        email: restored.email,
      );
      _invalidateAuthenticatedState();
    } catch (_) {
      _clearLegacyAuthPrefs();
      state = const AuthSession(status: AuthStatus.signedOut);
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
    _invalidateAuthenticatedState();
  }

  void setAuthenticatedSession(
    String token, {
    String? email,
  }) {
    final prefs = ref.read(sharedPrefsProvider);
    prefs.remove(_demoModeKey);
    prefs.remove(_demoOnboardingKey);
    _clearLegacyAuthPrefs();

    state = AuthSession(
      status: AuthStatus.authenticated,
      bearerToken: token,
      email: email,
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
    final service = ref.read(clerkAuthServiceProvider);
    if (service == null) {
      throw StateError('Clerk is not configured. Set CLERK_PUBLISHABLE_KEY.');
    }

    final result = await service.signInWithPassword(
      email: email,
      password: password,
    );
    setAuthenticatedSession(result.bearerToken, email: result.email ?? email);
  }

  Future<void> signUpWithPassword({
    required String email,
    required String password,
    String? firstName,
    String? lastName,
  }) async {
    final service = ref.read(clerkAuthServiceProvider);
    if (service == null) {
      throw StateError('Clerk is not configured. Set CLERK_PUBLISHABLE_KEY.');
    }

    final result = await service.signUpWithPassword(
      email: email,
      password: password,
      firstName: firstName,
      lastName: lastName,
    );
    setAuthenticatedSession(result.bearerToken, email: result.email ?? email);
  }

  Future<void> clearLocalSession() async {
    final service = ref.read(clerkAuthServiceProvider);
    try {
      await service?.signOut();
    } catch (_) {
      // Ignore remote/session API failures and clear local state anyway.
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
    _invalidateAuthenticatedState();
  }

  void signOut() {
    unawaited(_signOut(remote: true));
  }

  void handleUnauthorized() {
    if (!state.isAuthenticated) {
      return;
    }
    unawaited(_signOut(remote: false));
  }

  Future<void> _signOut({required bool remote}) async {
    if (remote) {
      final service = ref.read(clerkAuthServiceProvider);
      await service?.signOut();
    }

    final prefs = ref.read(sharedPrefsProvider);
    await prefs.remove(_demoModeKey);
    await prefs.remove(_demoOnboardingKey);
    _clearLegacyAuthPrefs();

    state = const AuthSession(status: AuthStatus.signedOut);
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

final appBootstrapProvider = FutureProvider<AppBootstrap?>((ref) async {
  final authSession = ref.watch(authSessionProvider);
  if (authSession.isLoading || authSession.status == AuthStatus.signedOut) {
    return null;
  }

  if (authSession.isDemo || authSession.bearerToken == null) {
    return AppBootstrap.demo(
      onboardingComplete: authSession.onboardingComplete,
    );
  }

  final api = ref.watch(apiServiceProvider);
  return api.fetchBootstrap();
});

final projectsProvider = FutureProvider<List<Project>>((ref) async {
  final api = ref.read(apiServiceProvider);
  return api.fetchProjects();
});

final publishAccountsProvider = FutureProvider<List<PublishAccount>>((
  ref,
) async {
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
    if (authSession.isLoading || authSession.status == AuthStatus.signedOut) {
      return null;
    }

    if (authSession.isDemo) {
      return const AppSettings(
        id: 'demo-settings',
        userId: 'demo-user',
        theme: 'system',
        emailNotifications: true,
      );
    }

    final api = ref.read(apiServiceProvider);
    return api.fetchSettings();
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

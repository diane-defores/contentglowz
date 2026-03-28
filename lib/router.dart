import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'data/models/auth_session.dart';
import 'providers/providers.dart';
import 'presentation/screens/app_shell.dart';
import 'presentation/screens/feed/feed_screen.dart';
import 'presentation/screens/editor/editor_screen.dart';
import 'presentation/screens/history/history_screen.dart';
import 'presentation/screens/settings/settings_screen.dart';
import 'presentation/screens/onboarding/onboarding_screen.dart';
import 'presentation/screens/entry/entry_screen.dart';
import 'presentation/screens/auth/auth_screen.dart';
import 'presentation/screens/ritual/ritual_screen.dart';
import 'presentation/screens/personas/personas_list_screen.dart';
import 'presentation/screens/personas/persona_editor_screen.dart';
import 'presentation/screens/affiliations/affiliations_screen.dart';
import 'presentation/screens/angles/angles_screen.dart';
import 'presentation/screens/calendar/calendar_screen.dart';

GoRouter createAppRouter(WidgetRef ref) {
  final authSession = ref.watch(authSessionProvider);
  final bootstrap = ref.watch(appBootstrapProvider);

  return GoRouter(
    initialLocation: '/entry',
    redirect: (context, state) {
      final location = state.uri.path;
      final isEntry = location == '/entry';
      final isAuth = location == '/auth';
      final isOnboarding = location == '/onboarding';
      final onboardingIntent = state.uri.queryParameters['intent'];
      final allowOnboarding = onboardingIntent == 'entry';
      final isSignedOut = authSession.status == AuthStatus.signedOut;

      if (authSession.isLoading && !isEntry) {
        return '/entry';
      }

      if (isSignedOut && !isEntry && !isAuth) {
        return '/entry';
      }

      if (authSession.isDemo) {
        if (isAuth) {
          return '/entry';
        }

        if (isOnboarding && !allowOnboarding) {
          return '/entry';
        }

        if (!authSession.onboardingComplete && !isEntry && !isOnboarding) {
          return '/entry';
        }

        if (authSession.onboardingComplete && isOnboarding) {
          return '/entry';
        }

        return null;
      }

      if (bootstrap.isLoading && !isEntry) {
        return '/entry';
      }

      if (bootstrap.hasError && !isEntry) {
        return '/entry';
      }

      final data = bootstrap.valueOrNull;
      if (authSession.isAuthenticated && data != null) {
        if (isAuth) {
          return '/entry';
        }

        if (isOnboarding && !allowOnboarding) {
          return '/entry';
        }

        if (data.shouldOnboard && !isEntry && !isOnboarding) {
          return '/entry';
        }

        if (!data.shouldOnboard && isOnboarding) {
          return '/entry';
        }
      }

      return null;
    },
    routes: [
      GoRoute(path: '/', redirect: (context, state) => '/entry'),
      GoRoute(
        path: '/entry',
        pageBuilder: (context, state) =>
            const MaterialPage(child: EntryScreen()),
      ),
      GoRoute(
        path: '/auth',
        pageBuilder: (context, state) =>
            const MaterialPage(child: AuthScreen()),
      ),
      ShellRoute(
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(
            path: '/feed',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: FeedScreen()),
          ),
          GoRoute(
            path: '/calendar',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: CalendarScreen()),
          ),
          GoRoute(
            path: '/history',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: HistoryScreen()),
          ),
          GoRoute(
            path: '/affiliations',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: AffiliationsScreen()),
          ),
          GoRoute(
            path: '/settings',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: SettingsScreen()),
          ),
        ],
      ),
      GoRoute(
        path: '/onboarding',
        pageBuilder: (context, state) =>
            const MaterialPage(child: OnboardingScreen()),
      ),
      GoRoute(
        path: '/editor/:id',
        pageBuilder: (context, state) => MaterialPage(
          child: EditorScreen(contentId: state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/ritual',
        pageBuilder: (context, state) =>
            const MaterialPage(child: RitualScreen()),
      ),
      GoRoute(
        path: '/personas',
        pageBuilder: (context, state) =>
            const MaterialPage(child: PersonasListScreen()),
      ),
      GoRoute(
        path: '/personas/new',
        pageBuilder: (context, state) =>
            const MaterialPage(child: PersonaEditorScreen()),
      ),
      GoRoute(
        path: '/personas/:id',
        pageBuilder: (context, state) => MaterialPage(
          child: PersonaEditorScreen(personaId: state.pathParameters['id']),
        ),
      ),
      GoRoute(
        path: '/angles',
        pageBuilder: (context, state) =>
            const MaterialPage(child: AnglesScreen()),
      ),
    ],
  );
}

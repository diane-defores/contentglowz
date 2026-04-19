import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'data/models/app_access_state.dart';
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
import 'presentation/screens/activity/activity_screen.dart';
import 'presentation/screens/analytics/analytics_screen.dart';
import 'presentation/screens/content_tools/content_tools_screen.dart';
import 'presentation/screens/reels/reels_screen.dart';
import 'presentation/screens/affiliations/affiliations_screen.dart';
import 'presentation/screens/angles/angles_screen.dart';
import 'presentation/screens/calendar/calendar_screen.dart';
import 'presentation/screens/newsletter/newsletter_screen.dart';
import 'presentation/screens/research/research_screen.dart';
import 'presentation/screens/runs/runs_screen.dart';
import 'presentation/screens/performance/performance_screen.dart';
import 'presentation/screens/seo/seo_screen.dart';
import 'presentation/screens/templates/templates_screen.dart';
import 'presentation/screens/uptime/uptime_screen.dart';
import 'presentation/screens/idea_pool/idea_pool_screen.dart';
import 'presentation/screens/work_domains/work_domains_screen.dart';
import 'presentation/screens/drip/drip_screen.dart';

GoRouter createAppRouter(WidgetRef ref) {
  final appAccessAsync = ref.watch(appAccessStateProvider);

  return GoRouter(
    initialLocation: '/entry',
    redirect: (context, state) {
      final location = state.uri.path;
      final isEntry = location == '/entry';
      final isAuth = location == '/auth';
      final isOnboarding = location == '/onboarding';
      final isUptime = location == '/uptime';
      final isSettings = location == '/settings';
      final onboardingIntent = state.uri.queryParameters['intent'];
      final allowOnboarding = onboardingIntent == 'entry';
      final access = appAccessAsync.valueOrNull;

      if (appAccessAsync.isLoading || access == null) {
        if (isEntry || isAuth) {
          return null;
        }
        return '/entry';
      }

      switch (access.stage) {
        case AppAccessStage.restoringSession:
        case AppAccessStage.checkingBackend:
        case AppAccessStage.checkingWorkspace:
          if (!isEntry && !isUptime && !isSettings) {
            return '/entry';
          }
          return null;
        case AppAccessStage.signedOut:
        case AppAccessStage.bootstrapUnauthorized:
          if (!isEntry && !isAuth) {
            return '/entry';
          }
          return null;
        case AppAccessStage.demo:
          if (isAuth) {
            return '/entry';
          }
          if (isOnboarding && !allowOnboarding) {
            return '/entry';
          }
          if (access.bootstrap?.shouldOnboard == true && !isEntry && !isOnboarding) {
            return '/entry';
          }
          if (access.bootstrap?.shouldOnboard == false && isOnboarding) {
            return '/entry';
          }
          return null;
        case AppAccessStage.apiUnavailable:
        case AppAccessStage.bootstrapFailed:
          if (isAuth || isOnboarding) {
            return '/entry';
          }
          if (!isEntry && !isUptime && !isSettings) {
            return '/uptime';
          }
          return null;
        case AppAccessStage.needsOnboarding:
          if (isAuth) {
            return '/entry';
          }
          if (isOnboarding && !allowOnboarding) {
            return '/entry';
          }
          if (!isEntry && !isOnboarding) {
            return '/entry';
          }
          return null;
        case AppAccessStage.ready:
          if (isAuth) {
            return '/entry';
          }
          if (isOnboarding) {
            return '/entry';
          }
          return null;
      }
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
            path: '/activity',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: ActivityScreen()),
          ),
          GoRoute(
            path: '/affiliations',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: AffiliationsScreen()),
          ),
          GoRoute(
            path: '/runs',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: RunsScreen()),
          ),
          GoRoute(
            path: '/templates',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: TemplatesScreen()),
          ),
          GoRoute(
            path: '/newsletter',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: NewsletterScreen()),
          ),
          GoRoute(
            path: '/research',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: ResearchScreen()),
          ),
          GoRoute(
            path: '/reels',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: ReelsScreen()),
          ),
          GoRoute(
            path: '/seo',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: SeoScreen()),
          ),
          GoRoute(
            path: '/drip',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: DripScreen()),
          ),
          GoRoute(
            path: '/content-tools',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: ContentToolsScreen()),
          ),
          GoRoute(
            path: '/analytics',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: AnalyticsScreen()),
          ),
          GoRoute(
            path: '/idea-pool',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: IdeaPoolScreen()),
          ),
          GoRoute(
            path: '/work-domains',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: WorkDomainsScreen()),
          ),
          GoRoute(
            path: '/performance',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: PerformanceScreen()),
          ),
          GoRoute(
            path: '/uptime',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: UptimeScreen()),
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

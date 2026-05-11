import 'package:contentflow_app/data/models/content_item.dart';
import 'package:contentflow_app/data/models/drip_plan.dart';
import 'package:contentflow_app/data/models/offline_sync.dart';
import 'package:contentflow_app/data/models/project.dart';
import 'package:contentflow_app/data/models/app_settings.dart';
import 'package:contentflow_app/l10n/app_localizations.dart';
import 'package:contentflow_app/presentation/screens/feed/feed_screen.dart';
import 'package:contentflow_app/providers/providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

void main() {
  testWidgets('empty mobile feed shows one swipe action and opens setup', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    await _pumpFeedScreen(tester, items: const []);

    expect(
      find.text('Your content machine is ready to be configured.'),
      findsOneWidget,
    );
    expect(find.text('Content rules'), findsOneWidget);
    expect(find.text('Connected context'), findsOneWidget);
    expect(find.text('Next swipe'), findsOneWidget);
    expect(find.text('Next best actions'), findsNothing);
    expect(find.text('Workspace status'), findsNothing);
    expect(find.text('Upcoming content queue'), findsNothing);
    expect(find.text('Pending review'), findsNothing);

    await tester.tap(find.byKey(const Key('flow-action-start-setup')));
    await tester.pumpAndSettle();

    expect(find.text('onboarding mode=create projectId='), findsOneWidget);
  });

  testWidgets(
    'empty feed opens onboarding in edit mode when active project exists',
    (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.reset);

      await _pumpFeedScreen(
        tester,
        items: const [],
        activeProject: Project(
          id: 'project-42',
          name: 'Project 42',
          url: 'https://example.com',
          createdAt: DateTime(2026, 4, 21),
        ),
      );

      await tester.tap(find.byKey(const Key('flow-action-start-setup')));
      await tester.pumpAndSettle();

      expect(
        find.text('onboarding mode=edit projectId=project-42'),
        findsOneWidget,
      );
    },
  );

  testWidgets('upcoming queue card appears only when drip content exists', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    await _pumpFeedScreen(
      tester,
      items: const [],
      dripPlans: [_dripPlan('plan-1')],
    );

    expect(find.text('Upcoming content queue'), findsNothing);

    await tester.tap(find.byKey(const Key('flow-action-later-setup')));
    await tester.pump();
    await tester.tap(find.byKey(const Key('flow-action-later-create')));
    await tester.pump();
    await tester.tap(find.byKey(const Key('flow-action-later-templates')));
    await tester.pump();

    expect(find.text('Upcoming content queue'), findsOneWidget);
    expect(find.text('1 plan(s)'), findsOneWidget);

    await tester.tap(find.byKey(const Key('flow-action-start-drip')));
    await tester.pumpAndSettle();

    expect(find.text('drip screen'), findsOneWidget);
  });

  testWidgets('left swipe postpones the current dashboard action', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    await _pumpFeedScreen(tester, items: const []);

    await tester.fling(
      find.byKey(const Key('flow-action-card-setup')),
      const Offset(-500, 0),
      1000,
    );
    await tester.pumpAndSettle();

    expect(
      find.text('Your content machine is ready to be configured.'),
      findsNothing,
    );
    expect(find.text('Create your first content'), findsOneWidget);
  });

  testWidgets('right swipe gives visual feedback before starting action', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    await _pumpFeedScreen(tester, items: const []);

    final card = find.byKey(const Key('flow-action-card-setup'));
    final gesture = await tester.startGesture(tester.getCenter(card));
    await gesture.moveBy(const Offset(60, 0));
    await tester.pump(const Duration(milliseconds: 16));
    await gesture.moveBy(const Offset(100, 0));
    await tester.pump(const Duration(milliseconds: 16));

    expect(find.text('START'), findsOneWidget);

    await gesture.up();
    await tester.pumpAndSettle();

    expect(find.text('onboarding mode=create projectId='), findsOneWidget);
  });

  testWidgets('feed with pending content keeps the swiper UI', (tester) async {
    await _pumpFeedScreen(
      tester,
      items: [
        ContentItem(
          id: 'content-1',
          title: 'Draft title',
          body: 'Draft body',
          summary: 'A concise draft summary for review.',
          type: ContentType.blogPost,
          status: ContentStatus.pending,
          channels: const [PublishingChannel.wordpress],
          metadata: const {
            'seo_keyword': 'content operations',
            'seo_signals': {'volume': 1200, 'difficulty': 31},
          },
          createdAt: DateTime(2026, 4, 21),
        ),
      ],
    );

    expect(find.text('Draft title'), findsOneWidget);
    expect(find.text('Article review template'), findsOneWidget);
    expect(find.text('content operations'), findsWidgets);
    expect(
      find.text('Your content machine is ready to be configured.'),
      findsNothing,
    );
  });

  testWidgets('empty feed remains usable on a narrow mobile viewport', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 720);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    await _pumpFeedScreen(
      tester,
      items: const [],
      dripPlans: [_dripPlan('plan-1')],
    );

    expect(
      find.text('Your content machine is ready to be configured.'),
      findsOneWidget,
    );
    expect(find.text('Start'), findsOneWidget);

    await tester.drag(find.byType(ListView), const Offset(0, -500));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });
}

Future<void> _pumpFeedScreen(
  WidgetTester tester, {
  required List<ContentItem> items,
  List<DripPlan> dripPlans = const [],
  List<QueuedOfflineAction> queuedActions = const [],
  Project? activeProject,
}) async {
  final router = GoRouter(
    initialLocation: '/feed',
    routes: [
      GoRoute(path: '/feed', builder: (context, state) => const FeedScreen()),
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => Scaffold(
          body: Center(
            child: Text(
              'onboarding mode=${state.uri.queryParameters['mode'] ?? ''} projectId=${state.uri.queryParameters['projectId'] ?? ''}',
            ),
          ),
        ),
      ),
      GoRoute(
        path: '/angles',
        builder: (context, state) =>
            const Scaffold(body: Center(child: Text('angles screen'))),
      ),
      GoRoute(
        path: '/templates',
        builder: (context, state) =>
            const Scaffold(body: Center(child: Text('templates screen'))),
      ),
      GoRoute(
        path: '/drip',
        builder: (context, state) =>
            const Scaffold(body: Center(child: Text('drip screen'))),
      ),
      GoRoute(
        path: '/history',
        builder: (context, state) =>
            const Scaffold(body: Center(child: Text('history screen'))),
      ),
      GoRoute(
        path: '/uptime',
        builder: (context, state) =>
            const Scaffold(body: Center(child: Text('uptime screen'))),
      ),
      GoRoute(
        path: '/editor/:id',
        builder: (context, state) =>
            const Scaffold(body: Center(child: Text('editor screen'))),
      ),
    ],
  );

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        pendingContentProvider.overrideWith(
          () => _TestPendingContentNotifier(items),
        ),
        dripPlansProvider.overrideWith((ref) async => dripPlans),
        offlineQueueEntriesProvider.overrideWith((ref) async => queuedActions),
        contentHistoryProvider.overrideWith(
          (ref) async => const <ContentItem>[],
        ),
        projectsStateProvider.overrideWith(
          (ref) async => const ProjectsState(),
        ),
        activeProjectProvider.overrideWith((ref) => activeProject),
        currentUserSettingsProvider.overrideWith(
          () => _TestUserSettingsNotifier(
            const AppSettings(
              id: 'settings-1',
              userId: 'user-1',
              projectSelectionMode: projectSelectionModeAuto,
            ),
          ),
        ),
      ],
      child: MaterialApp.router(
        routerConfig: router,
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
      ),
    ),
  );

  await tester.pumpAndSettle();
}

class _TestPendingContentNotifier extends PendingContentNotifier {
  _TestPendingContentNotifier(this.items);

  final List<ContentItem> items;

  @override
  Future<List<ContentItem>> build() async => items;
}

class _TestUserSettingsNotifier extends UserSettingsNotifier {
  _TestUserSettingsNotifier(this._settings);

  final AppSettings _settings;

  @override
  Future<AppSettings?> build() async => _settings;
}

DripPlan _dripPlan(String id) {
  return DripPlan(id: id, userId: 'user-1', name: 'Plan $id', status: 'active');
}

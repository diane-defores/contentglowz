import 'package:contentflow_app/data/models/search_console.dart';
import 'package:contentflow_app/l10n/app_localizations.dart';
import 'package:contentflow_app/presentation/screens/analytics/search_console_panel.dart';
import 'package:contentflow_app/providers/providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets(
    'renders Google Search and private traffic as separate sections',
    (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            activeProjectIdProvider.overrideWith((ref) => 'project-1'),
            searchConsolePeriodProvider.overrideWith((ref) => '30d'),
            searchConsoleConnectionStatusProvider.overrideWith(
              (ref) async => const SearchConsoleConnectionStatus(
                projectId: 'project-1',
                connected: true,
                status: 'valid',
                validationStatus: 'valid',
              ),
            ),
            searchConsoleSummaryProvider.overrideWith(
              (ref) async => _summary(),
            ),
            searchConsoleOpportunitiesProvider.overrideWith(
              (ref) async => [_opportunity()],
            ),
          ],
          child: const _Harness(child: SearchConsolePanel()),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Google Search'), findsOneWidget);
      expect(find.text('Site traffic'), findsOneWidget);
      expect(find.text('Organic clicks from Google'), findsOneWidget);
      expect(find.text('Site visits/pageviews'), findsOneWidget);
      expect(
        find.text('Top organic landing pages from Google'),
        findsOneWidget,
      );
      expect(find.text('Most visited pages on site'), findsOneWidget);
      expect(find.text('URL Inspection issues'), findsOneWidget);
      expect(find.text('Add to Idea Pool'), findsOneWidget);
    },
  );

  testWidgets('disables sync when Search Console is not connected', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          activeProjectIdProvider.overrideWith((ref) => 'project-1'),
          searchConsolePeriodProvider.overrideWith((ref) => '30d'),
          searchConsoleConnectionStatusProvider.overrideWith(
            (ref) async => SearchConsoleConnectionStatus.missing('project-1'),
          ),
          searchConsoleSummaryProvider.overrideWith((ref) async => _summary()),
          searchConsoleOpportunitiesProvider.overrideWith(
            (ref) async => const <SearchConsoleOpportunity>[],
          ),
        ],
        child: const _Harness(child: SearchConsolePanel()),
      ),
    );
    await tester.pumpAndSettle();

    final syncButton = tester.widget<FilledButton>(
      find.widgetWithText(FilledButton, 'Sync'),
    );
    expect(syncButton.onPressed, isNull);
  });
}

class _Harness extends StatelessWidget {
  const _Harness({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: Scaffold(
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: child,
        ),
      ),
    );
  }
}

SearchConsoleSummary _summary() {
  return const SearchConsoleSummary(
    projectId: 'project-1',
    period: '30d',
    overview:
        'Google Search signals and private site traffic are shown separately.',
    opportunitiesCount: 1,
    googleSearch: SearchConsoleSourceSection(
      source: 'search_console',
      sourceLabel: 'Google Search',
      period: '30d',
      summary: 'Organic clicks: 42, impressions: 1200, CTR: 3.5%.',
      metrics: {
        'organic_clicks': 42,
        'impressions': 1200,
        'ctr': 0.035,
        'avg_position': 8.4,
        'inspected_pages': 1,
        'inspection_issue_count': 1,
      },
      topPages: [
        SearchConsoleTopRow(
          key: 'https://example.com/a',
          url: 'https://example.com/a',
          clicks: 10,
          impressions: 200,
          ctr: 0.05,
          position: 6.2,
        ),
      ],
      topQueries: [
        SearchConsoleTopRow(
          key: 'content ops',
          query: 'content ops',
          clicks: 4,
          impressions: 90,
          ctr: 0.044,
        ),
      ],
      issues: [
        {
          'source': 'search_console',
          'type': 'indexation_problem',
          'url': 'https://example.com/a',
          'verdict': 'FAIL',
          'coverageState': 'Crawled - currently not indexed',
        },
      ],
    ),
    siteTraffic: SearchConsoleSiteTrafficSection(
      source: 'private_analytics',
      sourceLabel: 'Site traffic (private tracker)',
      period: '30d',
      metrics: {'visits_pageviews': 88, 'unique_pages': 6},
      topPages: [SearchConsoleSitePage(path: '/a', views: 44)],
    ),
  );
}

SearchConsoleOpportunity _opportunity() {
  return const SearchConsoleOpportunity(
    reason: 'low_ctr_high_impressions',
    period: '30d',
    title: 'Improve CTR for /a',
    priorityScore: 73,
    targetUrl: 'https://example.com/a',
    summary: 'High impressions with weak CTR.',
    evidence: {'source': 'search_console'},
  );
}

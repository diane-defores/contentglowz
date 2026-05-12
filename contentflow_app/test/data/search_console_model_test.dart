import 'package:contentflow_app/data/models/search_console.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('parses source-separated SEO Stats payload', () {
    final summary = SearchConsoleSummary.fromJson({
      'projectId': 'project-1',
      'period': '30d',
      'overview':
          'Google Search signals and private site traffic are shown separately.',
      'opportunitiesCount': 2,
      'googleSearch': {
        'source': 'search_console',
        'sourceLabel': 'Google Search',
        'period': '30d',
        'summary': 'Organic clicks: 42',
        'metrics': {
          'organic_clicks': 42,
          'impressions': 1200,
          'ctr': 0.035,
          'avg_position': 8.4,
        },
        'topPages': [
          {
            'key': 'https://example.com/a',
            'url': 'https://example.com/a',
            'clicks': 10,
            'impressions': 200,
            'ctr': 0.05,
            'position': 6.2,
          },
        ],
        'topQueries': [
          {
            'key': 'content ops',
            'query': 'content ops',
            'clicks': 4,
            'impressions': 90,
            'ctr': 0.044,
          },
        ],
      },
      'siteTraffic': {
        'source': 'private_analytics',
        'sourceLabel': 'Site traffic (private tracker)',
        'period': '30d',
        'metrics': {'visits_pageviews': 88, 'unique_pages': 6},
        'topPages': [
          {'path': '/a', 'views': 44},
        ],
      },
    });

    expect(summary.googleSearch.source, 'search_console');
    expect(summary.googleSearch.metrics['organic_clicks'], 42);
    expect(summary.googleSearch.topPages.single.url, 'https://example.com/a');
    expect(summary.siteTraffic.source, 'private_analytics');
    expect(summary.siteTraffic.metrics['visits_pageviews'], 88);
    expect(summary.siteTraffic.topPages.single.path, '/a');
  });

  test('serializes Search Console opportunities for ingest', () {
    final opportunity = SearchConsoleOpportunity.fromJson({
      'reason': 'low_ctr_high_impressions',
      'period': '30d',
      'title': 'Improve title',
      'priorityScore': 73,
      'targetUrl': 'https://example.com/a',
      'summary': 'High impressions with weak CTR.',
      'evidence': {'source': 'search_console'},
    });

    expect(opportunity.source, 'search_console_feedback');
    expect(
      opportunity.stableKey,
      'low_ctr_high_impressions|30d|https://example.com/a|',
    );
    expect(opportunity.toIngestJson()['priorityScore'], 73);
    expect(opportunity.toIngestJson()['targetUrl'], 'https://example.com/a');
  });

  test('parses accessible properties with project-domain match', () {
    final property = SearchConsoleProperty.fromJson({
      'siteUrl': 'sc-domain:example.com',
      'permissionLevel': 'siteFullUser',
      'matchesProjectDomain': true,
    });

    expect(property.siteUrl, 'sc-domain:example.com');
    expect(property.permissionLevel, 'siteFullUser');
    expect(property.matchesProjectDomain, isTrue);
  });
}

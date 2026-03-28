import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/models/content_item.dart';
import '../../../providers/providers.dart';

final _validationsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final api = ref.read(apiServiceProvider);
  return api.fetchPendingValidations(daysAhead: 14);
});

class ContentToolsScreen extends ConsumerWidget {
  const ContentToolsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Content Tools'),
          bottom: const TabBar(
            isScrollable: true,
            tabs: [
              Tab(text: 'Validations'),
              Tab(text: 'Funnel'),
              Tab(text: 'Audit'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _ValidationsTab(),
            _FunnelTab(),
            _AuditTab(),
          ],
        ),
      ),
    );
  }
}

class _ValidationsTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final validationsAsync = ref.watch(_validationsProvider);
    final theme = Theme.of(context);

    return validationsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error: $e')),
      data: (data) {
        final articles = (data['articles'] as List?) ?? [];
        final total = data['total'] as int? ?? 0;

        if (articles.isEmpty) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.check_circle_outline, size: 64,
                    color: theme.colorScheme.outlineVariant),
                const SizedBox(height: 16),
                Text('No pending validations',
                    style: TextStyle(color: theme.colorScheme.onSurfaceVariant)),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(_validationsProvider),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.orange.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text('$total articles awaiting validation',
                    style: TextStyle(fontWeight: FontWeight.w600, color: Colors.orange)),
              ),
              const SizedBox(height: 12),
              ...articles.map((a) {
                final article = a as Map<String, dynamic>;
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    dense: true,
                    title: Text(article['title']?.toString() ?? 'Untitled',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                    subtitle: Text(
                      [
                        article['cluster']?.toString() ?? '',
                        article['scheduled_pub_date']?.toString() ?? 'no date',
                      ].where((s) => s.isNotEmpty).join(' · '),
                      style: theme.textTheme.bodySmall,
                    ),
                    trailing: Icon(Icons.chevron_right,
                        color: theme.colorScheme.onSurfaceVariant),
                  ),
                );
              }),
            ],
          ),
        );
      },
    );
  }
}

class _FunnelTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(contentHistoryProvider);
    final pendingAsync = ref.watch(pendingContentProvider);
    final theme = Theme.of(context);

    final allContent = [
      ...pendingAsync.valueOrNull ?? [],
      ...historyAsync.valueOrNull ?? [],
    ];

    if (allContent.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.filter_alt_outlined, size: 64,
                color: theme.colorScheme.outlineVariant),
            const SizedBox(height: 16),
            Text('No content data for funnel analysis',
                style: TextStyle(color: theme.colorScheme.onSurfaceVariant)),
          ],
        ),
      );
    }

    // Group by cluster from metadata
    final clusters = <String, List<ContentItem>>{};
    for (final item in allContent) {
      final cluster = item.metadata?['cluster'] as String? ?? 'uncategorized';
      clusters.putIfAbsent(cluster, () => []).add(item);
    }

    final sorted = clusters.entries.toList()
      ..sort((a, b) => b.value.length.compareTo(a.value.length));

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(pendingContentProvider);
        ref.invalidate(contentHistoryProvider);
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Content Clusters', style: theme.textTheme.titleMedium),
          const SizedBox(height: 4),
          Text('Articles grouped by topic cluster',
              style: theme.textTheme.bodySmall
                  ?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
          const SizedBox(height: 16),
          ...sorted.map((entry) {
            final published = entry.value
                .where((c) => c.status == ContentStatus.published)
                .length;
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                title: Text(entry.key,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                subtitle: Text(
                  '${entry.value.length} total · $published published',
                  style: theme.textTheme.bodySmall,
                ),
                trailing: _clusterGrade(entry.value.length, theme),
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _clusterGrade(int count, ThemeData theme) {
    final grade = count >= 30
        ? 'A'
        : count >= 20
            ? 'B+'
            : count >= 12
                ? 'B'
                : count >= 6
                    ? 'C'
                    : count >= 3
                        ? 'D'
                        : 'F';
    final color = switch (grade) {
      'A' => Colors.green,
      'B+' || 'B' => Colors.blue,
      'C' => Colors.orange,
      _ => Colors.red,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(grade,
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: color)),
    );
  }
}

class _AuditTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(contentHistoryProvider);
    final pendingAsync = ref.watch(pendingContentProvider);
    final theme = Theme.of(context);

    final allContent = [
      ...pendingAsync.valueOrNull ?? [],
      ...historyAsync.valueOrNull ?? [],
    ];

    if (allContent.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.fact_check_outlined, size: 64,
                color: theme.colorScheme.outlineVariant),
            const SizedBox(height: 16),
            Text('No content to audit',
                style: TextStyle(color: theme.colorScheme.onSurfaceVariant)),
          ],
        ),
      );
    }

    // Simple audit: check for missing fields
    final issues = <_AuditIssue>[];
    for (final item in allContent) {
      if (item.title.isEmpty) {
        issues.add(_AuditIssue(item.id, item.title, 'Missing title'));
      }
      if (item.channels.isEmpty) {
        issues.add(_AuditIssue(item.id, item.title, 'No publishing channels'));
      }
      if (item.body.isEmpty) {
        issues.add(_AuditIssue(item.id, item.title, 'Empty body'));
      }
      if (item.tags.isEmpty) {
        issues.add(_AuditIssue(item.id, item.title, 'No tags'));
      }
    }

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(pendingContentProvider);
        ref.invalidate(contentHistoryProvider);
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Summary
          Row(
            children: [
              _AuditStat(label: 'Total', value: '${allContent.length}',
                  color: theme.colorScheme.primary),
              const SizedBox(width: 8),
              _AuditStat(label: 'Issues', value: '${issues.length}',
                  color: issues.isEmpty ? Colors.green : Colors.orange),
            ],
          ),
          const SizedBox(height: 16),

          if (issues.isEmpty)
            Card(
              color: Colors.green.withValues(alpha: 0.1),
              child: const Padding(
                padding: EdgeInsets.all(16),
                child: Row(
                  children: [
                    Icon(Icons.check_circle, color: Colors.green),
                    SizedBox(width: 8),
                    Text('All content passes basic audit checks'),
                  ],
                ),
              ),
            )
          else ...[
            Text('Issues Found', style: theme.textTheme.titleSmall),
            const SizedBox(height: 8),
            ...issues.map((issue) => Card(
                  margin: const EdgeInsets.only(bottom: 6),
                  child: ListTile(
                    dense: true,
                    leading: Icon(Icons.warning_amber, color: Colors.orange, size: 20),
                    title: Text(
                      issue.title.isEmpty ? '(no title)' : issue.title,
                      style: const TextStyle(fontSize: 13),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    subtitle: Text(issue.issue,
                        style: TextStyle(fontSize: 12, color: Colors.orange)),
                  ),
                )),
          ],
        ],
      ),
    );
  }
}

class _AuditIssue {
  final String contentId;
  final String title;
  final String issue;
  const _AuditIssue(this.contentId, this.title, this.issue);
}

class _AuditStat extends StatelessWidget {
  const _AuditStat({required this.label, required this.value, required this.color});
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: color)),
            const SizedBox(height: 2),
            Text(label, style: TextStyle(fontSize: 11, color: color)),
          ],
        ),
      ),
    );
  }
}

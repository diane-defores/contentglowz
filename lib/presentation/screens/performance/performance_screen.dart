import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/models/content_item.dart';
import '../../../providers/providers.dart';

class PerformanceScreen extends ConsumerWidget {
  const PerformanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingAsync = ref.watch(pendingContentProvider);
    final historyAsync = ref.watch(contentHistoryProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Performance'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.invalidate(pendingContentProvider);
              ref.invalidate(contentHistoryProvider);
            },
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Overview stats
          _buildStats(theme, pendingAsync, historyAsync),
          const SizedBox(height: 20),

          // Content by type
          Text('Content by Type', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          _buildTypeBreakdown(theme, historyAsync),

          const SizedBox(height: 20),

          // Recent published
          Text('Recently Published', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          _buildRecentPublished(theme, historyAsync),
        ],
      ),
    );
  }

  Widget _buildStats(
    ThemeData theme,
    AsyncValue<List<ContentItem>> pendingAsync,
    AsyncValue<List<ContentItem>> historyAsync,
  ) {
    final pending = pendingAsync.valueOrNull?.length ?? 0;
    final history = historyAsync.valueOrNull ?? [];
    final published = history.where((c) => c.status == ContentStatus.published).length;
    final rejected = history.where((c) => c.status == ContentStatus.rejected).length;
    final total = pending + history.length;

    return Row(
      children: [
        _StatCard(label: 'Total', value: '$total', color: theme.colorScheme.primary),
        const SizedBox(width: 8),
        _StatCard(label: 'Pending', value: '$pending', color: Colors.orange),
        const SizedBox(width: 8),
        _StatCard(label: 'Published', value: '$published', color: Colors.green),
        const SizedBox(width: 8),
        _StatCard(label: 'Rejected', value: '$rejected', color: Colors.red),
      ],
    );
  }

  Widget _buildTypeBreakdown(
    ThemeData theme,
    AsyncValue<List<ContentItem>> historyAsync,
  ) {
    final history = historyAsync.valueOrNull ?? [];
    if (history.isEmpty) {
      return Text('No content data yet',
          style: TextStyle(color: theme.colorScheme.onSurfaceVariant));
    }

    final typeCounts = <ContentType, int>{};
    for (final item in history) {
      typeCounts[item.type] = (typeCounts[item.type] ?? 0) + 1;
    }

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: typeCounts.entries.map((e) {
        final typeLabel = e.key.name.replaceAllMapped(
          RegExp(r'[A-Z]'),
          (m) => ' ${m.group(0)}',
        ).trim();
        return Chip(
          avatar: CircleAvatar(
            radius: 12,
            backgroundColor: theme.colorScheme.primaryContainer,
            child: Text('${e.value}',
                style: TextStyle(fontSize: 10, color: theme.colorScheme.onPrimaryContainer)),
          ),
          label: Text(typeLabel, style: const TextStyle(fontSize: 12)),
        );
      }).toList(),
    );
  }

  Widget _buildRecentPublished(
    ThemeData theme,
    AsyncValue<List<ContentItem>> historyAsync,
  ) {
    final published = (historyAsync.valueOrNull ?? [])
        .where((c) => c.status == ContentStatus.published)
        .take(5)
        .toList();

    if (published.isEmpty) {
      return Text('No published content yet',
          style: TextStyle(color: theme.colorScheme.onSurfaceVariant));
    }

    return Column(
      children: published
          .map((item) => Card(
                margin: const EdgeInsets.only(bottom: 6),
                child: ListTile(
                  dense: true,
                  leading: Icon(Icons.check_circle, color: Colors.green, size: 20),
                  title: Text(item.title, style: const TextStyle(fontSize: 13)),
                  subtitle: Text(
                    [
                      item.type.name,
                      if (item.publishedAt != null)
                        item.publishedAt!.toIso8601String().split('T').first,
                    ].join(' · '),
                    style: theme.textTheme.bodySmall,
                  ),
                ),
              ))
          .toList(),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value, required this.color});
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
            Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
            const SizedBox(height: 2),
            Text(label, style: TextStyle(fontSize: 11, color: color.withValues(alpha: 0.8))),
          ],
        ),
      ),
    );
  }
}

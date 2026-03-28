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

          // Publish destinations
          Text('Publish Destinations', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          _buildPublishDestinations(theme, historyAsync),

          const SizedBox(height: 20),

          // Approval rate
          Text('Approval Rate', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          _buildApprovalRate(theme, historyAsync),

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

  Widget _buildPublishDestinations(
    ThemeData theme,
    AsyncValue<List<ContentItem>> historyAsync,
  ) {
    final published = (historyAsync.valueOrNull ?? [])
        .where((c) => c.status == ContentStatus.published)
        .toList();

    if (published.isEmpty) {
      return Text('No published content yet',
          style: TextStyle(color: theme.colorScheme.onSurfaceVariant));
    }

    // Count by channel
    final channelCounts = <String, int>{};
    for (final item in published) {
      final publishMeta = item.metadata?['publish'] as Map<String, dynamic>?;
      final platformUrls = publishMeta?['platform_urls'] as Map<String, dynamic>?;
      if (platformUrls != null) {
        for (final platform in platformUrls.keys) {
          channelCounts[platform] = (channelCounts[platform] ?? 0) + 1;
        }
      } else {
        // Fall back to channels from content item
        for (final ch in item.channels) {
          channelCounts[ch.name] = (channelCounts[ch.name] ?? 0) + 1;
        }
      }
    }

    if (channelCounts.isEmpty) {
      return Text('No destination data available',
          style: TextStyle(color: theme.colorScheme.onSurfaceVariant));
    }

    final sorted = channelCounts.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return Column(
      children: sorted.map((e) {
        final platformColor = switch (e.key) {
          'twitter' => const Color(0xFF1DA1F2),
          'linkedin' => const Color(0xFF0A66C2),
          'instagram' => const Color(0xFFE4405F),
          'tiktok' => const Color(0xFF010101),
          'youtube' => const Color(0xFFFF0000),
          'ghost' => const Color(0xFF15171A),
          'wordpress' => const Color(0xFF21759B),
          _ => theme.colorScheme.primary,
        };
        return Padding(
          padding: const EdgeInsets.only(bottom: 6),
          child: Row(
            children: [
              SizedBox(width: 90, child: Text(e.key, style: const TextStyle(fontSize: 13))),
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: e.value / sorted.first.value,
                    backgroundColor: platformColor.withValues(alpha: 0.1),
                    color: platformColor,
                    minHeight: 18,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                width: 30,
                child: Text('${e.value}',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: platformColor),
                    textAlign: TextAlign.right),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildApprovalRate(
    ThemeData theme,
    AsyncValue<List<ContentItem>> historyAsync,
  ) {
    final history = historyAsync.valueOrNull ?? [];
    if (history.isEmpty) {
      return Text('No data yet',
          style: TextStyle(color: theme.colorScheme.onSurfaceVariant));
    }

    final published = history.where((c) => c.status == ContentStatus.published).length;
    final rejected = history.where((c) => c.status == ContentStatus.rejected).length;
    final total = published + rejected;
    final rate = total > 0 ? (published / total * 100).round() : 0;

    return Row(
      children: [
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.green.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                Text('$rate%',
                    style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Colors.green)),
                const SizedBox(height: 4),
                const Text('Approval Rate', style: TextStyle(fontSize: 12, color: Colors.green)),
              ],
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: theme.colorScheme.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                Text('$total',
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: theme.colorScheme.primary)),
                const SizedBox(height: 4),
                Text('Total Reviewed', style: TextStyle(fontSize: 12, color: theme.colorScheme.primary)),
              ],
            ),
          ),
        ),
      ],
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

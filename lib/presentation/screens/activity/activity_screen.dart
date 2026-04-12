import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../providers/providers.dart';

final _activityProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final api = ref.read(apiServiceProvider);
  return api.fetchActivity(limit: 50);
});

class ActivityScreen extends ConsumerWidget {
  const ActivityScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activityAsync = ref.watch(_activityProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Activity'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(_activityProvider),
          ),
        ],
      ),
      body: activityAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline, size: 48, color: theme.colorScheme.error),
              const SizedBox(height: 8),
              Text('Failed to load activity: $e'),
              const SizedBox(height: 16),
              FilledButton.tonal(
                onPressed: () => ref.invalidate(_activityProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (activities) {
          if (activities.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.timeline_outlined, size: 64,
                      color: theme.colorScheme.outlineVariant),
                  const SizedBox(height: 16),
                  Text('No activity yet',
                      style: TextStyle(color: theme.colorScheme.onSurfaceVariant)),
                  const SizedBox(height: 4),
                  Text('Actions from robots and your work will appear here',
                      style: theme.textTheme.bodySmall
                          ?.copyWith(color: theme.colorScheme.outlineVariant)),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(_activityProvider),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: activities.length,
              itemBuilder: (context, index) =>
                  _ActivityItem(activity: activities[index]),
            ),
          );
        },
      ),
    );
  }
}

class _ActivityItem extends StatelessWidget {
  const _ActivityItem({required this.activity});
  final Map<String, dynamic> activity;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final action = activity['action'] as String? ?? 'unknown';
    final robotId = activity['robotId'] as String?;
    final status = activity['status'] as String? ?? 'started';
    final createdAt = activity['createdAt'] as String? ?? '';

    final statusColor = switch (status) {
      'completed' => Colors.green,
      'running' => Colors.blue,
      'failed' => Colors.red,
      _ => theme.colorScheme.outline,
    };

    final actionIcon = switch (action) {
      String a when a.contains('mesh') => Icons.hub,
      String a when a.contains('seo') => Icons.search,
      String a when a.contains('newsletter') => Icons.email,
      String a when a.contains('robot') || a.contains('run') => Icons.smart_toy,
      String a when a.contains('publish') => Icons.publish,
      _ => Icons.bolt,
    };

    return Card(
      margin: const EdgeInsets.only(bottom: 6),
      child: ListTile(
        dense: true,
        leading: CircleAvatar(
          radius: 18,
          backgroundColor: statusColor.withValues(alpha: 0.15),
          child: Icon(actionIcon, color: statusColor, size: 18),
        ),
        title: Text(
          action.replaceAll('_', ' '),
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
        ),
        subtitle: Text(
          [
            robotId,
            status,
            createdAt.isNotEmpty ? createdAt.split('T').first : null,
          ].whereType<String>().join(' · '),
          style: theme.textTheme.bodySmall,
        ),
      ),
    );
  }
}

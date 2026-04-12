import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/models/drip_plan.dart';
import '../../../data/services/api_service.dart';
import '../../../providers/providers.dart';

class DripPlanDetailScreen extends ConsumerStatefulWidget {
  const DripPlanDetailScreen({super.key, required this.planId});
  final String planId;

  @override
  ConsumerState<DripPlanDetailScreen> createState() => _DripPlanDetailScreenState();
}

class _DripPlanDetailScreenState extends ConsumerState<DripPlanDetailScreen> {
  bool _loading = false;

  @override
  Widget build(BuildContext context) {
    final plansAsync = ref.watch(dripPlansProvider);
    final statsAsync = ref.watch(dripStatsProvider(widget.planId));

    final plan = plansAsync.whenData((plans) => plans.firstWhere(
      (p) => p.id == widget.planId,
      orElse: () => throw Exception('Plan not found'),
    ));

    return Scaffold(
      appBar: AppBar(
        title: plan.when(
          data: (p) => Text(p.name),
          loading: () => const Text('Loading...'),
          error: (error, stackTrace) => const Text('Error'),
        ),
        actions: [
          plan.when(
            data: (p) => _ActionMenu(plan: p, onAction: (a) => _handleAction(a, p)),
            loading: () => const SizedBox.shrink(),
            error: (error, stackTrace) => const SizedBox.shrink(),
          ),
        ],
      ),
      body: plan.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (p) => RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(dripPlansProvider);
            ref.invalidate(dripStatsProvider(widget.planId));
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Status + config summary
              _StatusHeader(plan: p),
              const SizedBox(height: 16),

              // Progress
              statsAsync.when(
                loading: () => const Card(child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Center(child: CircularProgressIndicator()),
                )),
                error: (_, _) => const SizedBox.shrink(),
                data: (stats) => _ProgressCard(stats: stats, colorScheme: Theme.of(context).colorScheme),
              ),
              const SizedBox(height: 16),

              // Clusters
              statsAsync.when(
                loading: () => const SizedBox.shrink(),
                error: (_, _) => const SizedBox.shrink(),
                data: (stats) => _ClustersCard(stats: stats, colorScheme: Theme.of(context).colorScheme),
              ),
              const SizedBox(height: 16),

              // Config details
              _ConfigCard(plan: p),
              const SizedBox(height: 16),

              // Action buttons
              if (!p.isTerminal) _ActionButtons(
                plan: p,
                loading: _loading,
                onAction: (a) => _handleAction(a, p),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _handleAction(String action, DripPlan plan) async {
    setState(() => _loading = true);
    final api = ref.read(apiServiceProvider);

    try {
      String message;
      switch (action) {
        case 'import':
          final dir = plan.ssgConfig['content_directory'] as String? ?? 'src/data';
          final result = await api.importDripContent(plan.id, dir);
          message = 'Imported ${result['items_imported']} articles';
        case 'cluster':
          final result = await api.clusterDripPlan(plan.id, mode: plan.clusterMode);
          message = 'Clustered into ${result['total_clusters']} groups';
        case 'schedule':
          final result = await api.scheduleDripPlan(plan.id);
          message = 'Scheduled ${result['total_items']} items';
        case 'activate':
          await api.activateDripPlan(plan.id);
          message = 'Plan activated — dripping starts!';
        case 'pause':
          await api.pauseDripPlan(plan.id);
          message = 'Plan paused';
        case 'resume':
          await api.resumeDripPlan(plan.id);
          message = 'Plan resumed';
        case 'cancel':
          await api.cancelDripPlan(plan.id);
          message = 'Plan cancelled';
        case 'execute':
          final result = await api.executeDripTick(plan.id);
          message = 'Published ${result['published']} articles';
        case 'delete':
          await api.deleteDripPlan(plan.id);
          if (mounted) Navigator.pop(context);
          message = 'Plan deleted';
        default:
          message = 'Unknown action';
      }

      ref.invalidate(dripPlansProvider);
      ref.invalidate(dripStatsProvider(widget.planId));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}

// ─── Sub-widgets ─────────────────────────────────────

class _StatusHeader extends StatelessWidget {
  const _StatusHeader({required this.plan});
  final DripPlan plan;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _statusIcon(plan.status),
                const SizedBox(width: 8),
                Text(
                  plan.status.toUpperCase(),
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    color: _statusColor(plan.status),
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _infoRow('Articles', '${plan.totalItems}'),
            _infoRow('Cadence', '${plan.itemsPerDay}/day (${plan.cadenceMode})'),
            _infoRow('Start', plan.startDate),
            if (plan.nextDripAt != null)
              _infoRow('Next drip', plan.nextDripAt!.substring(0, 10)),
            if (plan.lastDripAt != null)
              _infoRow('Last drip', plan.lastDripAt!.substring(0, 10)),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 2),
    child: Row(
      children: [
        SizedBox(width: 100, child: Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500))),
        Expanded(child: Text(value, style: const TextStyle(fontSize: 13))),
      ],
    ),
  );

  Widget _statusIcon(String status) => Icon(
    switch (status) {
      'active' => Icons.play_circle_filled,
      'paused' => Icons.pause_circle_filled,
      'completed' => Icons.check_circle,
      'cancelled' => Icons.cancel,
      _ => Icons.circle_outlined,
    },
    color: _statusColor(status),
    size: 20,
  );

  Color _statusColor(String status) => switch (status) {
    'active' => Colors.green,
    'paused' => Colors.orange,
    'completed' => Colors.blue,
    'cancelled' => Colors.grey,
    _ => Colors.grey,
  };
}

class _ProgressCard extends StatelessWidget {
  const _ProgressCard({required this.stats, required this.colorScheme});
  final DripStats stats;
  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Progress', style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(
                value: stats.progressPercent,
                minHeight: 16,
                backgroundColor: colorScheme.surfaceContainerHighest,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '${stats.published}/${stats.totalItems} published (${(stats.progressPercent * 100).toStringAsFixed(0)}%)',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 16,
              children: stats.byStatus.entries.map((e) => Chip(
                avatar: CircleAvatar(
                  radius: 6,
                  backgroundColor: switch (e.key) {
                    'published' => Colors.green,
                    'scheduled' => Colors.blue,
                    'approved' => Colors.orange,
                    _ => Colors.grey,
                  },
                ),
                label: Text('${e.key}: ${e.value}', style: const TextStyle(fontSize: 12)),
                visualDensity: VisualDensity.compact,
              )).toList(),
            ),
          ],
        ),
      ),
    );
  }
}

class _ClustersCard extends StatelessWidget {
  const _ClustersCard({required this.stats, required this.colorScheme});
  final DripStats stats;
  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    if (stats.clusters.isEmpty) return const SizedBox.shrink();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Clusters', style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 12),
            ...stats.clusters.map((c) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: [
                  Icon(
                    c.isComplete ? Icons.check_circle : Icons.circle_outlined,
                    size: 18,
                    color: c.isComplete ? Colors.green : colorScheme.onSurface.withValues(alpha: 0.4),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(c.name, style: const TextStyle(fontSize: 13)),
                  ),
                  Text(
                    '${c.published}/${c.total}',
                    style: TextStyle(fontSize: 13, color: colorScheme.onSurface.withValues(alpha: 0.6)),
                  ),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }
}

class _ConfigCard extends StatelessWidget {
  const _ConfigCard({required this.plan});
  final DripPlan plan;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Configuration', style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 12),
            _row('Framework', plan.ssgFramework),
            _row('Gating', plan.ssgConfig['gating_method'] as String? ?? '?'),
            _row('Rebuild', plan.rebuildMethod),
            _row('Clustering', plan.clusterMode),
            if (plan.gscConfig != null && plan.gscConfig!['enabled'] == true)
              _row('GSC', 'Enabled'),
          ],
        ),
      ),
    );
  }

  Widget _row(String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 2),
    child: Row(
      children: [
        SizedBox(width: 100, child: Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500))),
        Expanded(child: Text(value, style: const TextStyle(fontSize: 13))),
      ],
    ),
  );
}

class _ActionButtons extends StatelessWidget {
  const _ActionButtons({required this.plan, required this.loading, required this.onAction});
  final DripPlan plan;
  final bool loading;
  final void Function(String) onAction;

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Center(child: Padding(
        padding: EdgeInsets.all(16),
        child: CircularProgressIndicator(),
      ));
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (plan.isDraft) ...[
          FilledButton.icon(
            onPressed: () => onAction('import'),
            icon: const Icon(Icons.download),
            label: const Text('Import Content'),
          ),
          const SizedBox(height: 8),
          FilledButton.tonalIcon(
            onPressed: () => onAction('cluster'),
            icon: const Icon(Icons.hub),
            label: const Text('Cluster Items'),
          ),
          const SizedBox(height: 8),
          FilledButton.tonalIcon(
            onPressed: () => onAction('schedule'),
            icon: const Icon(Icons.calendar_month),
            label: const Text('Generate Schedule'),
          ),
          const SizedBox(height: 8),
          FilledButton.icon(
            onPressed: () => onAction('activate'),
            icon: const Icon(Icons.play_arrow),
            label: const Text('Activate Plan'),
          ),
        ],
        if (plan.isActive) ...[
          FilledButton.icon(
            onPressed: () => onAction('execute'),
            icon: const Icon(Icons.water_drop),
            label: const Text('Execute Drip Now'),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: () => onAction('pause'),
            icon: const Icon(Icons.pause),
            label: const Text('Pause'),
          ),
        ],
        if (plan.isPaused) ...[
          FilledButton.icon(
            onPressed: () => onAction('resume'),
            icon: const Icon(Icons.play_arrow),
            label: const Text('Resume'),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: () => onAction('cancel'),
            icon: const Icon(Icons.cancel),
            label: const Text('Cancel Plan'),
          ),
        ],
      ],
    );
  }
}

class _ActionMenu extends StatelessWidget {
  const _ActionMenu({required this.plan, required this.onAction});
  final DripPlan plan;
  final void Function(String) onAction;

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
      onSelected: onAction,
      itemBuilder: (_) => [
        if (plan.isDraft)
          const PopupMenuItem(value: 'delete', child: Text('Delete plan')),
        if (plan.isActive)
          const PopupMenuItem(value: 'cancel', child: Text('Cancel plan')),
        if (plan.isPaused) ...[
          const PopupMenuItem(value: 'resume', child: Text('Resume')),
          const PopupMenuItem(value: 'cancel', child: Text('Cancel')),
        ],
      ],
    );
  }
}

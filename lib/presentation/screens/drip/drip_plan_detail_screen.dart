import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/models/drip_plan.dart';
import '../../../data/services/api_service.dart';
import '../../../providers/providers.dart';
import '../../../l10n/app_localizations.dart';
import '../../widgets/app_error_view.dart';

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
          loading: () => Text(context.tr('Loading...')),
          error: (error, stackTrace) => Text(context.tr('Error')),
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
        error: (error, stackTrace) => Center(
          child: AppErrorView(
            scope: 'drip.plan_detail.load',
            title: context.tr('Failed to load drip plan'),
            error: error,
            stackTrace: stackTrace,
            onRetry: () {
              ref.invalidate(dripPlansProvider);
              ref.invalidate(dripStatsProvider(widget.planId));
            },
          ),
        ),
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
    final l10n = context.l10n;
    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);

    try {
      String message;
      switch (action) {
        case 'import':
          final dir = plan.ssgConfig['content_directory'] as String? ?? 'src/data';
          final result = await api.importDripContent(plan.id, dir);
          message = l10n.tr(
            'Imported {count} articles',
            params: {'count': '${result['items_imported']}'},
          );
        case 'cluster':
          final result = await api.clusterDripPlan(plan.id, mode: plan.clusterMode);
          message = l10n.tr(
            'Clustered into {count} groups',
            params: {'count': '${result['total_clusters']}'},
          );
        case 'schedule':
          final result = await api.scheduleDripPlan(plan.id);
          message = l10n.tr(
            'Scheduled {count} items',
            params: {'count': '${result['total_items']}'},
          );
        case 'activate':
          await api.activateDripPlan(plan.id);
          message = l10n.tr('Plan activated — dripping starts!');
        case 'pause':
          await api.pauseDripPlan(plan.id);
          message = l10n.tr('Plan paused');
        case 'resume':
          await api.resumeDripPlan(plan.id);
          message = l10n.tr('Plan resumed');
        case 'cancel':
          await api.cancelDripPlan(plan.id);
          message = l10n.tr('Plan cancelled');
        case 'execute':
          final result = await api.executeDripTick(plan.id);
          message = l10n.tr(
            'Published {count} articles',
            params: {'count': '${result['published']}'},
          );
        case 'delete':
          await api.deleteDripPlan(plan.id);
          if (mounted) {
            navigator.pop();
          }
          message = l10n.tr('Plan deleted');
        default:
          message = l10n.tr('Unknown action');
      }

      if (!mounted) return;
      ref.invalidate(dripPlansProvider);
      ref.invalidate(dripStatsProvider(widget.planId));
      messenger.showSnackBar(SnackBar(content: Text(message)));
    } catch (error, stackTrace) {
      if (!mounted) return;
      showDiagnosticSnackBar(
        context,
        ref,
        message: l10n.tr(
          'Action failed: {error}',
          params: {'error': '$error'},
        ),
        scope: 'drip.plan_detail.action',
        error: error,
        stackTrace: stackTrace,
        contextData: {'planId': widget.planId},
      );
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
                  context.tr(plan.status),
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    color: _statusColor(plan.status),
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _infoRow(context.tr('Articles'), '${plan.totalItems}'),
            _infoRow(
              context.tr('Cadence'),
              '${plan.itemsPerDay}/${context.tr('day')} (${context.tr(plan.cadenceMode)})',
            ),
            _infoRow(context.tr('Start'), plan.startDate),
            if (plan.nextDripAt != null)
              _infoRow(
                context.tr('Next drip'),
                plan.nextDripAt!.substring(0, 10),
              ),
            if (plan.lastDripAt != null)
              _infoRow(context.tr('Last drip'), plan.lastDripAt!.substring(0, 10)),
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
            Text(context.tr('Progress'),
                style: Theme.of(context).textTheme.titleSmall),
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
              context.tr('Published {published}/{total} ({percent}%)', {
                'published': '${stats.published}',
                'total': '${stats.totalItems}',
                'percent': (stats.progressPercent * 100).toStringAsFixed(0),
              }),
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
                label: Text(
                  context.tr('{status}: {count}', {
                    'status': context.tr(e.key),
                    'count': '${e.value}',
                  }),
                  style: const TextStyle(fontSize: 12),
                ),
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
            Text(context.tr('Clusters'),
                style: Theme.of(context).textTheme.titleSmall),
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
            Text(context.tr('Configuration'),
                style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 12),
            _row(context.tr('Framework'), plan.ssgFramework),
            _row(context.tr('Gating'), plan.ssgConfig['gating_method'] as String? ?? '?'),
            _row(context.tr('Rebuild'), plan.rebuildMethod),
            _row(context.tr('Clustering'), context.tr(plan.clusterMode)),
            if (plan.gscConfig != null && plan.gscConfig!['enabled'] == true)
              _row(context.tr('GSC'), context.tr('Enabled')),
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
            label: Text(context.tr('Import Content')),
          ),
          const SizedBox(height: 8),
          FilledButton.tonalIcon(
            onPressed: () => onAction('cluster'),
            icon: const Icon(Icons.hub),
            label: Text(context.tr('Cluster Items')),
          ),
          const SizedBox(height: 8),
          FilledButton.tonalIcon(
            onPressed: () => onAction('schedule'),
            icon: const Icon(Icons.calendar_month),
            label: Text(context.tr('Generate Schedule')),
          ),
          const SizedBox(height: 8),
          FilledButton.icon(
            onPressed: () => onAction('activate'),
            icon: const Icon(Icons.play_arrow),
            label: Text(context.tr('Activate Plan')),
          ),
        ],
        if (plan.isActive) ...[
          FilledButton.icon(
            onPressed: () => onAction('execute'),
            icon: const Icon(Icons.water_drop),
            label: Text(context.tr('Execute Drip Now')),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: () => onAction('pause'),
            icon: const Icon(Icons.pause),
            label: Text(context.tr('Pause')),
          ),
        ],
        if (plan.isPaused) ...[
          FilledButton.icon(
            onPressed: () => onAction('resume'),
            icon: const Icon(Icons.play_arrow),
            label: Text(context.tr('Resume')),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: () => onAction('cancel'),
            icon: const Icon(Icons.cancel),
            label: Text(context.tr('Cancel Plan')),
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
          PopupMenuItem(value: 'delete', child: Text(context.tr('Delete plan'))),
        if (plan.isActive)
          PopupMenuItem(value: 'cancel', child: Text(context.tr('Cancel plan'))),
        if (plan.isPaused) ...[
          PopupMenuItem(value: 'resume', child: Text(context.tr('Resume'))),
          PopupMenuItem(value: 'cancel', child: Text(context.tr('Cancel'))),
        ],
      ],
    );
  }
}

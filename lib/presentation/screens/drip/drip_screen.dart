import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/models/drip_plan.dart';
import '../../../providers/providers.dart';
import 'drip_plan_detail_screen.dart';
import 'drip_wizard_sheet.dart';

class DripScreen extends ConsumerWidget {
  const DripScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plansAsync = ref.watch(dripPlansProvider);
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Content Drip'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _openWizard(context, ref),
          ),
        ],
      ),
      body: plansAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline, size: 48, color: colorScheme.error),
              const SizedBox(height: 8),
              Text('Failed to load drip plans', style: TextStyle(color: colorScheme.error)),
              const SizedBox(height: 16),
              FilledButton.tonal(
                onPressed: () => ref.invalidate(dripPlansProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (plans) {
          if (plans.isEmpty) {
            return _EmptyState(onCreatePressed: () => _openWizard(context, ref));
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(dripPlansProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: plans.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) => _PlanCard(
                plan: plans[index],
                onTap: () => _openDetail(context, plans[index]),
              ),
            ),
          );
        },
      ),
    );
  }

  void _openWizard(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => DripWizardSheet(
        onCreated: () => ref.invalidate(dripPlansProvider),
      ),
    );
  }

  void _openDetail(BuildContext context, DripPlan plan) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => DripPlanDetailScreen(planId: plan.id)),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onCreatePressed});
  final VoidCallback onCreatePressed;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.water_drop_outlined, size: 64, color: colorScheme.primary.withValues(alpha: 0.5)),
            const SizedBox(height: 16),
            Text('No drip plans yet', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(
              'Create a plan to progressively publish your content.\nGoogle will see a natural publishing rhythm.',
              textAlign: TextAlign.center,
              style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.6)),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: onCreatePressed,
              icon: const Icon(Icons.add),
              label: const Text('Create drip plan'),
            ),
          ],
        ),
      ),
    );
  }
}

class _PlanCard extends ConsumerWidget {
  const _PlanCard({required this.plan, required this.onTap});
  final DripPlan plan;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final statsAsync = ref.watch(dripStatsProvider(plan.id));

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Title row
              Row(
                children: [
                  Expanded(
                    child: Text(plan.name, style: Theme.of(context).textTheme.titleMedium),
                  ),
                  _StatusChip(status: plan.status),
                ],
              ),
              const SizedBox(height: 8),

              // Config summary
              Text(
                '${plan.totalItems} articles  ·  ${plan.itemsPerDay}/day  ·  ${plan.clusterMode}  ·  ${plan.ssgFramework}',
                style: TextStyle(fontSize: 13, color: colorScheme.onSurface.withValues(alpha: 0.6)),
              ),
              const SizedBox(height: 12),

              // Progress bar
              statsAsync.when(
                loading: () => const LinearProgressIndicator(),
                error: (_, _) => const SizedBox.shrink(),
                data: (stats) => Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: stats.progressPercent,
                        minHeight: 8,
                        backgroundColor: colorScheme.surfaceContainerHighest,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '${stats.published}/${stats.totalItems} published',
                      style: TextStyle(fontSize: 12, color: colorScheme.onSurface.withValues(alpha: 0.5)),
                    ),
                  ],
                ),
              ),

              // Next drip
              if (plan.nextDripAt != null && plan.isActive) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.schedule, size: 14, color: colorScheme.primary),
                    const SizedBox(width: 4),
                    Text(
                      'Next drip: ${plan.nextDripAt!.substring(0, 10)}',
                      style: TextStyle(fontSize: 12, color: colorScheme.primary),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});
  final String status;

  @override
  Widget build(BuildContext context) {
    final (color, icon) = switch (status) {
      'active' => (Colors.green, Icons.play_circle_filled),
      'paused' => (Colors.orange, Icons.pause_circle_filled),
      'completed' => (Colors.blue, Icons.check_circle),
      'cancelled' => (Colors.grey, Icons.cancel),
      _ => (Colors.grey, Icons.circle_outlined), // draft
    };

    return Chip(
      avatar: Icon(icon, size: 16, color: color),
      label: Text(status, style: TextStyle(fontSize: 12, color: color)),
      visualDensity: VisualDensity.compact,
      padding: EdgeInsets.zero,
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
    );
  }
}

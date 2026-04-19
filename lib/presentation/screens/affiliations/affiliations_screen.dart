import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/models/affiliate_link.dart';
import '../../../providers/providers.dart';
import '../../widgets/app_error_view.dart';
import 'affiliation_form_sheet.dart';

const _statusFilters = ['all', 'active', 'paused', 'expired'];

class AffiliationsScreen extends ConsumerStatefulWidget {
  const AffiliationsScreen({super.key});

  @override
  ConsumerState<AffiliationsScreen> createState() => _AffiliationsScreenState();
}

class _AffiliationsScreenState extends ConsumerState<AffiliationsScreen> {
  String _statusFilter = 'all';

  @override
  Widget build(BuildContext context) {
    final affiliationsAsync = ref.watch(affiliationsProvider);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Affiliations'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _openForm(context),
          ),
        ],
      ),
      body: affiliationsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => Center(
          child: AppErrorView(
            scope: 'affiliations.load',
            title: 'Failed to load affiliations',
            error: error,
            stackTrace: stackTrace,
            onRetry: () => ref.invalidate(affiliationsProvider),
          ),
        ),
        data: (affiliations) {
          final filtered = _statusFilter == 'all'
              ? affiliations
              : affiliations.where((a) => a.status == _statusFilter).toList();

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(affiliationsProvider),
            child: CustomScrollView(
              slivers: [
                // Stats
                SliverToBoxAdapter(
                  child: _StatsRow(affiliations: affiliations),
                ),
                // Filter chips
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                    child: Wrap(
                      spacing: 8,
                      children: _statusFilters.map((filter) {
                        final isSelected = _statusFilter == filter;
                        return FilterChip(
                          label: Text(filter[0].toUpperCase() + filter.substring(1)),
                          selected: isSelected,
                          onSelected: (_) =>
                              setState(() => _statusFilter = filter),
                        );
                      }).toList(),
                    ),
                  ),
                ),
                // List or empty
                if (filtered.isEmpty)
                  SliverFillRemaining(
                    child: _EmptyState(
                      hasFilter: _statusFilter != 'all',
                      onAdd: () => _openForm(context),
                    ),
                  )
                else
                  SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) => _AffiliationCard(
                        affiliation: filtered[index],
                        onTap: () => _openForm(context, filtered[index]),
                        onDelete: () => _delete(context, filtered[index]),
                      ),
                      childCount: filtered.length,
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _openForm(BuildContext context, [AffiliateLink? existing]) async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => AffiliationFormSheet(affiliation: existing),
    );
    if (result == true && mounted) {
      ref.invalidate(affiliationsProvider);
    }
  }

  Future<void> _delete(BuildContext context, AffiliateLink affiliation) async {
    final messenger = ScaffoldMessenger.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete affiliate link?'),
        content: Text('Remove "${affiliation.name}"? This cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    final api = ref.read(apiServiceProvider);
    try {
      await api.deleteAffiliation(affiliation.id!);
      ref.invalidate(affiliationsProvider);
      if (mounted) {
        messenger.showSnackBar(
          SnackBar(content: Text('Deleted "${affiliation.name}"')),
        );
      }
    } catch (error, stackTrace) {
      if (mounted) {
        showDiagnosticSnackBar(
          context,
          ref,
          message: 'Failed to delete: $error',
          scope: 'affiliations.delete',
          error: error,
          stackTrace: stackTrace,
          contextData: {'affiliationId': affiliation.id ?? 'unknown'},
        );
      }
    }
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow({required this.affiliations});
  final List<AffiliateLink> affiliations;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final active = affiliations.where((a) => a.status == 'active').length;
    final paused = affiliations.where((a) => a.status == 'paused').length;
    final expired = affiliations.where((a) => a.status == 'expired').length;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Row(
        children: [
          _StatChip(label: 'Total', value: '${affiliations.length}', color: colorScheme.primary),
          const SizedBox(width: 8),
          _StatChip(label: 'Active', value: '$active', color: Colors.green),
          const SizedBox(width: 8),
          _StatChip(label: 'Paused', value: '$paused', color: Colors.orange),
          const SizedBox(width: 8),
          _StatChip(label: 'Expired', value: '$expired', color: Colors.red),
        ],
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  const _StatChip({required this.label, required this.value, required this.color});
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(value,
                style: TextStyle(
                    fontSize: 20, fontWeight: FontWeight.bold, color: color)),
            const SizedBox(height: 2),
            Text(label,
                style: TextStyle(
                    fontSize: 11, color: color.withValues(alpha: 0.8))),
          ],
        ),
      ),
    );
  }
}

class _AffiliationCard extends StatelessWidget {
  const _AffiliationCard({
    required this.affiliation,
    required this.onTap,
    required this.onDelete,
  });

  final AffiliateLink affiliation;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final statusColor = switch (affiliation.status) {
      'active' => Colors.green,
      'paused' => Colors.orange,
      'expired' => Colors.red,
      _ => colorScheme.outline,
    };

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: InkWell(
        onTap: onTap,
        onLongPress: onDelete,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header row
              Row(
                children: [
                  Expanded(
                    child: Text(
                      affiliation.name,
                      style: theme.textTheme.titleSmall
                          ?.copyWith(fontWeight: FontWeight.w600),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      affiliation.status,
                      style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: statusColor),
                    ),
                  ),
                ],
              ),
              if (affiliation.description != null) ...[
                const SizedBox(height: 4),
                Text(
                  affiliation.description!,
                  style: theme.textTheme.bodySmall
                      ?.copyWith(color: colorScheme.onSurfaceVariant),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
              const SizedBox(height: 8),
              // Metadata row
              Wrap(
                spacing: 12,
                runSpacing: 4,
                children: [
                  if (affiliation.category != null)
                    _MetaChip(
                        icon: Icons.category_outlined,
                        text: affiliation.category!),
                  if (affiliation.commission != null)
                    _MetaChip(
                        icon: Icons.payments_outlined,
                        text: affiliation.commission!),
                  if (affiliation.keywords.isNotEmpty)
                    _MetaChip(
                        icon: Icons.label_outline,
                        text: affiliation.keywords.take(3).join(', ')),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  const _MetaChip({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final color = Theme.of(context).colorScheme.onSurfaceVariant;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 4),
        Text(text, style: TextStyle(fontSize: 12, color: color)),
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.hasFilter, required this.onAdd});
  final bool hasFilter;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.link_off, size: 64, color: colorScheme.outlineVariant),
          const SizedBox(height: 16),
          Text(
            hasFilter
                ? 'No affiliate links match this filter'
                : 'No affiliate links yet',
            style: TextStyle(color: colorScheme.onSurfaceVariant),
          ),
          if (!hasFilter) ...[
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: onAdd,
              icon: const Icon(Icons.add),
              label: const Text('Add first link'),
            ),
          ],
        ],
      ),
    );
  }
}

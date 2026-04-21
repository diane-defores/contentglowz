import 'package:flutter/material.dart';
import 'package:flutter_card_swiper/flutter_card_swiper.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../data/models/content_item.dart';
import '../../../data/models/offline_sync.dart';
import '../../../l10n/app_localizations.dart';
import '../../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_error_view.dart';
import '../../widgets/project_picker_action.dart';
import '../../widgets/skeleton_loader.dart';
import 'content_card.dart';

class FeedScreen extends ConsumerStatefulWidget {
  const FeedScreen({super.key});

  @override
  ConsumerState<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends ConsumerState<FeedScreen>
    with SingleTickerProviderStateMixin {
  final CardSwiperController _swiperController = CardSwiperController();
  String? _swipeOverlay;
  late AnimationController _overlayAnimation;

  @override
  void initState() {
    super.initState();
    _overlayAnimation = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
  }

  @override
  void dispose() {
    _swiperController.dispose();
    _overlayAnimation.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final contentAsync = ref.watch(pendingContentProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('Content Feed')),
        actions: [
          if (contentAsync.valueOrNull != null &&
              contentAsync.valueOrNull!.length > 1)
            TextButton.icon(
              onPressed: () => _bulkApprove(contentAsync.valueOrNull!),
              icon: const Icon(Icons.done_all, size: 18),
              label: Text(
                context.tr('All ({count})', {
                  'count': contentAsync.valueOrNull!.length,
                }),
              ),
              style: TextButton.styleFrom(
                foregroundColor: AppTheme.approveColor,
              ),
            ),
          const ProjectPickerAction(),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () =>
                ref.read(pendingContentProvider.notifier).refresh(),
          ),
        ],
      ),
      body: contentAsync.when(
        loading: () => const FeedSkeletonLoader(),
        error: (err, stackTrace) => Center(
          child: AppErrorView(
            scope: 'feed.load_pending',
            title: context.tr('Could not load the review queue'),
            error: err,
            stackTrace: stackTrace,
            onRetry: () => ref.read(pendingContentProvider.notifier).refresh(),
          ),
        ),
        data: (items) {
          if (items.isEmpty) {
            return _buildEmptyState();
          }
          return _buildSwiper(items);
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return const _FeedEmptyDashboard();
  }

  Widget _buildSwiper(List<ContentItem> items) {
    return Stack(
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 20),
          child: CardSwiper(
            controller: _swiperController,
            cardsCount: items.length,
            numberOfCardsDisplayed: items.length.clamp(1, 3),
            backCardOffset: const Offset(0, -30),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 24),
            scale: 0.95,
            isLoop: false,
            onSwipe: (prevIndex, currentIndex, direction) =>
                _onSwipe(items, prevIndex, direction),
            onSwipeDirectionChange: (horizontalDirection, verticalDirection) {
              setState(() {
                if (verticalDirection == CardSwiperDirection.top) {
                  _swipeOverlay = 'edit';
                } else if (horizontalDirection == CardSwiperDirection.right) {
                  _swipeOverlay = 'approve';
                } else if (horizontalDirection == CardSwiperDirection.left) {
                  _swipeOverlay = 'reject';
                } else {
                  _swipeOverlay = null;
                }
              });
            },
            cardBuilder:
                (context, index, percentThresholdX, percentThresholdY) {
                  if (index >= items.length) return const SizedBox.shrink();
                  return ContentCard(
                    item: items[index],
                    onTap: () => _openEditor(items[index]),
                  );
                },
          ),
        ),
        // Swipe direction overlay
        if (_swipeOverlay != null) _buildOverlay(),
        // Bottom action buttons
        Positioned(bottom: 24, left: 0, right: 0, child: _buildActionButtons()),
      ],
    );
  }

  Widget _buildOverlay() {
    final (label, color, icon) = switch (_swipeOverlay) {
      'approve' => ('PUBLISH', AppTheme.approveColor, Icons.check_circle),
      'reject' => ('SKIP', AppTheme.rejectColor, Icons.cancel),
      'edit' => ('EDIT', AppTheme.editColor, Icons.edit),
      _ => (
        '',
        Theme.of(context).colorScheme.surface.withValues(alpha: 0),
        Icons.circle,
      ),
    };

    return Positioned.fill(
      child: IgnorePointer(
        child: Container(
          decoration: BoxDecoration(
            gradient: RadialGradient(
              colors: [
                color.withAlpha(30),
                Theme.of(context).colorScheme.surface.withValues(alpha: 0),
              ],
              radius: 1.5,
            ),
          ),
          child: Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              decoration: BoxDecoration(
                color: color.withAlpha(40),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: color, width: 2),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(icon, color: color, size: 28),
                  const SizedBox(width: 12),
                  Text(
                    context.tr(label),
                    style: TextStyle(
                      color: color,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 2,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildActionButtons() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        _actionButton(
          icon: Icons.close_rounded,
          color: AppTheme.rejectColor,
          label: 'Skip',
          onTap: () => _swiperController.swipe(CardSwiperDirection.left),
        ),
        _actionButton(
          icon: Icons.edit_rounded,
          color: AppTheme.editColor,
          label: 'Edit',
          onTap: () => _swiperController.swipe(CardSwiperDirection.top),
          large: true,
        ),
        _actionButton(
          icon: Icons.check_rounded,
          color: AppTheme.approveColor,
          label: 'Publish',
          onTap: () => _swiperController.swipe(CardSwiperDirection.right),
        ),
      ],
    );
  }

  Widget _actionButton({
    required IconData icon,
    required Color color,
    required String label,
    required VoidCallback onTap,
    bool large = false,
  }) {
    final size = large ? 64.0 : 52.0;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Material(
          color: color.withAlpha(30),
          shape: CircleBorder(
            side: BorderSide(color: color.withAlpha(150), width: 2),
          ),
          child: InkWell(
            onTap: onTap,
            customBorder: const CircleBorder(),
            splashColor: color.withAlpha(60),
            child: SizedBox(
              width: size,
              height: size,
              child: Icon(icon, color: color, size: large ? 32 : 26),
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          context.tr(label),
          style: TextStyle(
            color: color.withAlpha(180),
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Future<void> _bulkApprove(List<ContentItem> items) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(context.tr('Approve all?')),
        content: Text(
          context.tr('This will approve and publish {count} content item(s).', {
            'count': items.length,
          }),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(context.tr('Cancel')),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(
              backgroundColor: AppTheme.approveColor,
            ),
            child: Text(context.tr('Approve {count}', {'count': items.length})),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    final notifier = ref.read(pendingContentProvider.notifier);
    var approved = 0;
    var failed = 0;

    for (final item in List.of(items)) {
      try {
        await notifier.approve(item.id);
        approved++;
      } catch (_) {
        failed++;
      }
    }

    if (mounted) {
      final msg = failed == 0
          ? context.tr('Approved {approved} items', {'approved': approved})
          : context.tr('Approved {approved}, failed {failed}', {
              'approved': approved,
              'failed': failed,
            });
      _showSnackBar(
        msg,
        failed == 0 ? AppTheme.approveColor : AppTheme.warningColor,
      );
    }
  }

  bool _onSwipe(
    List<ContentItem> items,
    int prevIndex,
    CardSwiperDirection direction,
  ) {
    if (prevIndex >= items.length) return false;
    final item = items[prevIndex];

    setState(() => _swipeOverlay = null);

    switch (direction) {
      case CardSwiperDirection.right:
        // Approve & publish
        ref.read(pendingContentProvider.notifier).approve(item.id).then((
          result,
        ) {
          if (!mounted) return;
          _showSnackBar(
            result.message,
            _colorForApproveSeverity(result.severity),
          );
        });
        return true;

      case CardSwiperDirection.left:
        // Reject
        ref.read(pendingContentProvider.notifier).reject(item.id);
        _showSnackBar(
          context.tr('Skipped: {title}', {'title': item.title}),
          AppTheme.rejectColor,
        );
        return true;

      case CardSwiperDirection.top:
        // Edit
        _openEditor(item);
        return false; // Don't remove from stack

      default:
        return false;
    }
  }

  void _openEditor(ContentItem item) {
    context.push('/editor/${item.id}');
  }

  void _showSnackBar(String message, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: color.withAlpha(200),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  Color _colorForApproveSeverity(ApproveSeverity severity) =>
      switch (severity) {
        ApproveSeverity.success => AppTheme.approveColor,
        ApproveSeverity.info => AppTheme.infoColor,
        ApproveSeverity.warning => AppTheme.warningColor,
        ApproveSeverity.error => AppTheme.rejectColor,
      };
}

class _FeedEmptyDashboard extends ConsumerWidget {
  const _FeedEmptyDashboard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dripPlansAsync = ref.watch(dripPlansProvider);
    final queueAsync = ref.watch(offlineQueueEntriesProvider);
    final historyAsync = ref.watch(contentHistoryProvider);

    final dripCount = dripPlansAsync.valueOrNull?.length ?? 0;
    final queuedActions = _countPendingQueueActions(queueAsync.valueOrNull);
    final publishedCount = historyAsync.valueOrNull?.length ?? 0;
    final colorScheme = Theme.of(context).colorScheme;

    return RefreshIndicator(
      onRefresh: () async {
        await ref.read(pendingContentProvider.notifier).refresh();
        ref.invalidate(dripPlansProvider);
        ref.invalidate(offlineQueueEntriesProvider);
        ref.invalidate(contentHistoryProvider);
      },
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
        children: [
          _HeroCard(
            onPrimaryTap: () => context.push('/onboarding?intent=entry'),
            onSecondaryTap: () => context.push('/angles'),
          ),
          const SizedBox(height: 20),
          Text(
            context.tr('Next best actions'),
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _ActionCard(
                icon: Icons.tune_rounded,
                color: AppTheme.approveColor,
                title: context.tr('Review creation settings'),
                subtitle: context.tr(
                  'Check your project, content types, and generation frequency before the first run.',
                ),
                ctaLabel: context.tr('Open setup'),
                onTap: () => context.push('/onboarding?intent=entry'),
              ),
              _ActionCard(
                icon: Icons.auto_awesome_rounded,
                color: AppTheme.warningColor,
                title: context.tr('Create your first content'),
                subtitle: context.tr(
                  'Generate angles and turn one of them into a draft ready for review.',
                ),
                ctaLabel: context.tr('Create content'),
                onTap: () => context.push('/angles'),
              ),
              _ActionCard(
                icon: Icons.description_outlined,
                color: AppTheme.infoColor,
                title: context.tr('Templates'),
                subtitle: context.tr(
                  'Review the structures available for articles, newsletters, videos, and shorts.',
                ),
                ctaLabel: context.tr('Open templates'),
                onTap: () => context.push('/templates'),
              ),
              _ActionCard(
                icon: Icons.water_drop_outlined,
                color: colorScheme.primary,
                title: context.tr('Upcoming content queue'),
                subtitle: context.tr(
                  'Open the drip queue to schedule the next content items that should arrive.',
                ),
                ctaLabel: context.tr('Open drip queue'),
                onTap: () => context.push('/drip'),
                trailing: _InlineCountBadge(
                  label: context.tr('{count} plan(s)', {'count': dripCount}),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            context.tr('Workspace status'),
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _StatusCard(
                label: context.tr('Pending review'),
                value: '0',
                icon: Icons.dynamic_feed_rounded,
                color: AppTheme.approveColor,
                helper: context.tr('Nothing is waiting for approval yet.'),
              ),
              _StatusCard(
                label: context.tr('Drip plans'),
                value: '$dripCount',
                icon: Icons.water_drop_rounded,
                color: colorScheme.primary,
                helper: dripCount == 0
                    ? context.tr('No upcoming content is scheduled yet.')
                    : context.tr(
                        'Your future content queue is ready to inspect.',
                      ),
              ),
              _StatusCard(
                label: context.tr('Queued actions'),
                value: '$queuedActions',
                icon: Icons.sync_rounded,
                color: AppTheme.warningColor,
                helper: queuedActions == 0
                    ? context.tr('No local actions are waiting to sync.')
                    : context.tr('Some local actions are waiting for sync.'),
              ),
              _StatusCard(
                label: context.tr('Published content'),
                value: '$publishedCount',
                icon: Icons.history_rounded,
                color: AppTheme.infoColor,
                helper: publishedCount == 0
                    ? context.tr(
                        'Your published history will appear here after the first release.',
                      )
                    : context.tr(
                        'You already have published content in history.',
                      ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  int _countPendingQueueActions(List<QueuedOfflineAction>? entries) {
    if (entries == null) {
      return 0;
    }
    return entries.where((entry) => !entry.isTerminal).length;
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({required this.onPrimaryTap, required this.onSecondaryTap});

  final VoidCallback onPrimaryTap;
  final VoidCallback onSecondaryTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            colorScheme.primaryContainer,
            colorScheme.surfaceContainerHighest,
          ],
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: colorScheme.surface.withValues(alpha: 0.7),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.check_circle_outline,
                  size: 18,
                  color: AppTheme.approveColor,
                ),
                const SizedBox(width: 8),
                Text(
                  context.tr('Nothing to review yet'),
                  style: TextStyle(
                    color: colorScheme.onSurface,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Text(
            context.tr('Your content machine is ready to be configured.'),
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w800,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            context.tr(
              'No draft is currently waiting in the review queue. Set your creation rules, generate a first draft, or prepare the upcoming queue.',
            ),
            style: TextStyle(color: colorScheme.onSurfaceVariant, height: 1.5),
          ),
          const SizedBox(height: 18),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              FilledButton.icon(
                onPressed: onPrimaryTap,
                icon: const Icon(Icons.tune_rounded),
                label: Text(context.tr('Review creation settings')),
              ),
              OutlinedButton.icon(
                onPressed: onSecondaryTap,
                icon: const Icon(Icons.auto_awesome_rounded),
                label: Text(context.tr('Create content')),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
    required this.ctaLabel,
    required this.onTap,
    this.trailing,
  });

  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final String ctaLabel;
  final VoidCallback onTap;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return ConstrainedBox(
      constraints: const BoxConstraints(minWidth: 260, maxWidth: 360),
      child: Card(
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.14),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Icon(icon, color: color),
                    ),
                    const Spacer(),
                    if (trailing != null) trailing!,
                  ],
                ),
                const SizedBox(height: 14),
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  subtitle,
                  style: TextStyle(
                    color: colorScheme.onSurfaceVariant,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  ctaLabel,
                  style: TextStyle(color: color, fontWeight: FontWeight.w700),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StatusCard extends StatelessWidget {
  const _StatusCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.helper,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final String helper;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return ConstrainedBox(
      constraints: const BoxConstraints(minWidth: 180, maxWidth: 220),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: colorScheme.surfaceContainerLow,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: colorScheme.outlineVariant.withValues(alpha: 0.45),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color),
            const SizedBox(height: 12),
            Text(
              value,
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: Theme.of(
                context,
              ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              helper,
              style: TextStyle(
                color: colorScheme.onSurfaceVariant,
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InlineCountBadge extends StatelessWidget {
  const _InlineCountBadge({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: colorScheme.onSurfaceVariant,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

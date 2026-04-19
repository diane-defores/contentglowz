import 'package:flutter/material.dart';
import 'package:flutter_card_swiper/flutter_card_swiper.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../data/models/content_item.dart';
import '../../../l10n/app_localizations.dart';
import '../../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_error_view.dart';
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
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.check_circle_outline,
            size: 72,
            color: Color(0xFF00B894),
          ),
          const SizedBox(height: 24),
          Text(
            context.tr('All caught up!'),
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            context.tr('No content waiting for review'),
            style: TextStyle(fontSize: 16, color: Colors.white.withAlpha(120)),
          ),
          const SizedBox(height: 32),
          FilledButton.icon(
            onPressed: () =>
                ref.read(pendingContentProvider.notifier).refresh(),
            icon: const Icon(Icons.refresh),
            label: Text(context.tr('Check for new content')),
          ),
        ],
      ),
    );
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
      _ => ('', Colors.transparent, Icons.circle),
    };

    return Positioned.fill(
      child: IgnorePointer(
        child: Container(
          decoration: BoxDecoration(
            gradient: RadialGradient(
              colors: [color.withAlpha(30), Colors.transparent],
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
      _showSnackBar(msg, failed == 0 ? AppTheme.approveColor : Colors.orange);
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
        ApproveSeverity.info => Colors.blue,
        ApproveSeverity.warning => Colors.orange,
        ApproveSeverity.error => AppTheme.rejectColor,
      };
}

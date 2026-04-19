import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../data/models/content_item.dart';
import '../../../providers/providers.dart';
import '../../theme/app_theme.dart';

class HistoryScreen extends ConsumerWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(contentHistoryProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('History')),
      body: historyAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: $err')),
        data: (items) {
          if (items.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.history,
                      size: 64, color: Colors.white.withAlpha(40)),
                  const SizedBox(height: 16),
                  Text(
                    'No history yet',
                    style: TextStyle(
                      fontSize: 18,
                      color: Colors.white.withAlpha(120),
                    ),
                  ),
                ],
              ),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            itemBuilder: (context, index) => _HistoryTile(item: items[index]),
          );
        },
      ),
    );
  }
}

class _HistoryTile extends StatelessWidget {
  final ContentItem item;

  const _HistoryTile({required this.item});

  @override
  Widget build(BuildContext context) {
    final typeColor = AppTheme.colorForContentType(item.typeLabel);
    final statusColor = _statusColor(item.status);
    final dateFormat = DateFormat('MMM d, HH:mm');

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withAlpha(15)),
      ),
      child: Row(
        children: [
          // Status icon
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: statusColor.withAlpha(30),
              shape: BoxShape.circle,
            ),
            child: Icon(
              _statusIcon(item.status),
              color: statusColor,
              size: 22,
            ),
          ),
          const SizedBox(width: 14),
          // Content info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: typeColor.withAlpha(30),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        item.typeLabel,
                        style:
                            TextStyle(color: typeColor, fontSize: 11),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      dateFormat.format(item.publishedAt ?? item.createdAt),
                      style: TextStyle(
                        color: Colors.white.withAlpha(80),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                if (item.reviewActorDisplay != null) ...[
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(
                        Icons.verified_user_outlined,
                        size: 13,
                        color: Colors.white.withAlpha(90),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          'Reviewed by ${item.reviewActorDisplay}'
                          '${item.reviewActorType == null ? '' : ' (${item.reviewActorType})'}',
                          style: TextStyle(
                            color: Colors.white.withAlpha(110),
                            fontSize: 11,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
          // Status badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: statusColor.withAlpha(20),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              item.status.name,
              style: TextStyle(
                color: statusColor,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _statusColor(ContentStatus status) {
    return switch (status) {
      ContentStatus.published => AppTheme.approveColor,
      ContentStatus.rejected => AppTheme.rejectColor,
      ContentStatus.approved => const Color(0xFFFDAA5E),
      ContentStatus.editing => AppTheme.editColor,
      ContentStatus.pending => Colors.white54,
    };
  }

  IconData _statusIcon(ContentStatus status) {
    return switch (status) {
      ContentStatus.published => Icons.check_circle_rounded,
      ContentStatus.rejected => Icons.cancel_rounded,
      ContentStatus.approved => Icons.schedule_rounded,
      ContentStatus.editing => Icons.edit_rounded,
      ContentStatus.pending => Icons.hourglass_empty_rounded,
    };
  }
}

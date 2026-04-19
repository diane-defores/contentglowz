import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../data/models/content_item.dart';
import '../../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_error_view.dart';

class CalendarScreen extends ConsumerWidget {
  const CalendarScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(contentHistoryProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Schedule')),
      body: historyAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => Center(
          child: AppErrorView(
            scope: 'calendar.load',
            title: 'Failed to load the calendar',
            error: error,
            stackTrace: stackTrace,
            onRetry: () => ref.invalidate(contentHistoryProvider),
          ),
        ),
        data: (items) => _CalendarBody(items: items),
      ),
    );
  }
}

class _CalendarBody extends ConsumerWidget {
  final List<ContentItem> items;
  const _CalendarBody({required this.items});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final approvedItems =
        items.where((i) => i.status == ContentStatus.approved).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Week strip
        _buildWeekStrip(context),
        const SizedBox(height: 20),

        // Approved items awaiting scheduling
        if (approvedItems.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Text(
              'Ready to Schedule',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppTheme.approveColor.withAlpha(180),
                letterSpacing: 1.2,
              ),
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 80,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: approvedItems.length,
              itemBuilder: (context, i) =>
                  _buildScheduleChip(context, ref, approvedItems[i]),
            ),
          ),
          const SizedBox(height: 16),
        ],

        // Today's schedule
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Text(
            'Timeline',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Colors.white.withAlpha(100),
              letterSpacing: 1.2,
            ),
          ),
        ),
        const SizedBox(height: 12),

        Expanded(
          child: items.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.calendar_today,
                          size: 48, color: Colors.white.withAlpha(30)),
                      const SizedBox(height: 12),
                      Text(
                        'Nothing scheduled yet',
                        style: TextStyle(
                            color: Colors.white.withAlpha(80), fontSize: 16),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: items.length,
                  itemBuilder: (context, i) =>
                      _buildScheduleItem(items[i]),
                ),
        ),
      ],
    );
  }

  Widget _buildWeekStrip(BuildContext context) {
    final now = DateTime.now();
    final days =
        List.generate(7, (i) => DateTime(now.year, now.month, now.day + i));
    final dayFormat = DateFormat('EEE d');

    return SizedBox(
      height: 80,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: days.length,
        itemBuilder: (context, i) {
          final day = days[i];
          final isToday = i == 0;
          final dayItems = items.where((item) {
            final d = item.publishedAt ?? item.createdAt;
            return d.year == day.year &&
                d.month == day.month &&
                d.day == day.day;
          }).length;

          return Container(
            width: 64,
            margin: const EdgeInsets.only(right: 8),
            decoration: BoxDecoration(
              color: isToday
                  ? const Color(0xFF6C5CE7).withAlpha(30)
                  : const Color(0xFF1A1A2E),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isToday
                    ? const Color(0xFF6C5CE7)
                    : Colors.white.withAlpha(15),
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  dayFormat.format(day),
                  style: TextStyle(
                    color: isToday
                        ? const Color(0xFF6C5CE7)
                        : Colors.white.withAlpha(100),
                    fontSize: 12,
                    fontWeight: isToday ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
                if (dayItems > 0) ...[
                  const SizedBox(height: 6),
                  Container(
                    width: 20,
                    height: 20,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppTheme.approveColor.withAlpha(30),
                    ),
                    child: Center(
                      child: Text(
                        '$dayItems',
                        style: TextStyle(
                          color: AppTheme.approveColor,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildScheduleChip(
      BuildContext context, WidgetRef ref, ContentItem item) {
    final typeColor = AppTheme.colorForContentType(item.typeLabel);

    return GestureDetector(
      onTap: () => _showSchedulePicker(context, ref, item),
      child: Container(
        width: 200,
        margin: const EdgeInsets.only(right: 10),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppTheme.approveColor.withAlpha(10),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.approveColor.withAlpha(40)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: typeColor.withAlpha(30),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    item.typeLabel,
                    style: TextStyle(
                        color: typeColor,
                        fontSize: 10,
                        fontWeight: FontWeight.w600),
                  ),
                ),
                const Spacer(),
                Icon(Icons.schedule, size: 16, color: AppTheme.approveColor),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              item.title,
              style: const TextStyle(
                  color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            if (item.reviewActorDisplay != null) ...[
              const SizedBox(height: 4),
              Text(
                'Reviewer: ${item.reviewActorDisplay}',
                style: TextStyle(
                  color: Colors.white.withAlpha(115),
                  fontSize: 10,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _showSchedulePicker(
      BuildContext context, WidgetRef ref, ContentItem item) async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: now.add(const Duration(days: 1)),
      firstDate: now,
      lastDate: now.add(const Duration(days: 90)),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.dark(
            primary: Color(0xFF6C5CE7),
            surface: Color(0xFF1A1A2E),
          ),
        ),
        child: child!,
      ),
    );
    if (date == null || !context.mounted) return;

    final time = await showTimePicker(
      context: context,
      initialTime: const TimeOfDay(hour: 9, minute: 0),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.dark(
            primary: Color(0xFF6C5CE7),
            surface: Color(0xFF1A1A2E),
          ),
        ),
        child: child!,
      ),
    );
    if (time == null || !context.mounted) return;

    final scheduledFor =
        DateTime(date.year, date.month, date.day, time.hour, time.minute);

    try {
      final api = ref.read(apiServiceProvider);
      await api.scheduleContent(item.id, scheduledFor);
      ref.invalidate(contentHistoryProvider);

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                'Scheduled "${item.title}" for ${DateFormat('MMM d, HH:mm').format(scheduledFor)}'),
            backgroundColor: AppTheme.approveColor.withAlpha(200),
            behavior: SnackBarBehavior.floating,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Failed to schedule. Check backend connection.'),
            backgroundColor: AppTheme.rejectColor.withAlpha(200),
            behavior: SnackBarBehavior.floating,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    }
  }

  Widget _buildScheduleItem(ContentItem item) {
    final typeColor = AppTheme.colorForContentType(item.typeLabel);
    final time =
        DateFormat('HH:mm').format(item.publishedAt ?? item.createdAt);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          // Time
          SizedBox(
            width: 50,
            child: Text(
              time,
              style: TextStyle(
                color: Colors.white.withAlpha(80),
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          // Line
          Container(
            width: 2,
            height: 60,
            color: typeColor.withAlpha(60),
          ),
          const SizedBox(width: 14),
          // Content
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: typeColor.withAlpha(10),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: typeColor.withAlpha(30)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
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
                          style: TextStyle(
                              color: typeColor,
                              fontSize: 10,
                              fontWeight: FontWeight.w600),
                        ),
                      ),
                      const Spacer(),
                      Text(
                        item.channelLabels,
                        style: TextStyle(
                            color: Colors.white.withAlpha(60), fontSize: 11),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    item.title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

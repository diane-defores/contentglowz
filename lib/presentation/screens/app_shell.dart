import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/providers.dart';

class _NavItem {
  const _NavItem({required this.icon, required this.label, required this.path});
  final IconData icon;
  final String label;
  final String path;
}

class _NavSection {
  const _NavSection({required this.label, required this.items});
  final String label;
  final List<_NavItem> items;
}

const _sections = [
  _NavSection(label: 'Content', items: [
    _NavItem(icon: Icons.dynamic_feed_rounded, label: 'Feed', path: '/feed'),
    _NavItem(icon: Icons.calendar_month_rounded, label: 'Schedule', path: '/calendar'),
    _NavItem(icon: Icons.history_rounded, label: 'History', path: '/history'),
    _NavItem(icon: Icons.build_circle_rounded, label: 'Tools', path: '/content-tools'),
  ]),
  _NavSection(label: 'Create', items: [
    _NavItem(icon: Icons.description_rounded, label: 'Templates', path: '/templates'),
    _NavItem(icon: Icons.email_rounded, label: 'Newsletter', path: '/newsletter'),
    _NavItem(icon: Icons.slow_motion_video_rounded, label: 'Reels', path: '/reels'),
    _NavItem(icon: Icons.link_rounded, label: 'Affiliations', path: '/affiliations'),
  ]),
  _NavSection(label: 'Analyze', items: [
    _NavItem(icon: Icons.analytics_rounded, label: 'Research', path: '/research'),
    _NavItem(icon: Icons.hub_rounded, label: 'SEO', path: '/seo'),
    _NavItem(icon: Icons.insights_rounded, label: 'Analytics', path: '/analytics'),
    _NavItem(icon: Icons.bar_chart_rounded, label: 'Perf', path: '/performance'),
  ]),
  _NavSection(label: 'System', items: [
    _NavItem(icon: Icons.smart_toy_rounded, label: 'Runs', path: '/runs'),
    _NavItem(icon: Icons.timeline_rounded, label: 'Activity', path: '/activity'),
    _NavItem(icon: Icons.workspaces_rounded, label: 'Domains', path: '/work-domains'),
    _NavItem(icon: Icons.monitor_heart_rounded, label: 'Uptime', path: '/uptime'),
    _NavItem(icon: Icons.settings_rounded, label: 'Settings', path: '/settings'),
  ]),
];

// Flat list for index lookup
final _allItems = _sections.expand((s) => s.items).toList();

class AppShell extends ConsumerWidget {
  final Widget child;

  const AppShell({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingCount = ref.watch(pendingCountProvider);
    final currentRoute = GoRouterState.of(context).uri.path;
    final selectedPath = _selectedPath(currentRoute);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: colorScheme.surface,
          border: Border(
            top: BorderSide(
              color: colorScheme.outlineVariant.withValues(alpha: 0.3),
            ),
          ),
        ),
        child: SafeArea(
          top: false,
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Row(
              children: [
                for (var sectionIdx = 0; sectionIdx < _sections.length; sectionIdx++) ...[
                  if (sectionIdx > 0)
                    _SectionDivider(
                      label: _sections[sectionIdx].label,
                      colorScheme: colorScheme,
                    ),
                  for (final item in _sections[sectionIdx].items)
                    _NavTab(
                      icon: item.icon,
                      label: item.label,
                      isSelected: item.path == selectedPath,
                      badgeCount: item.path == '/feed' && pendingCount > 0
                          ? pendingCount
                          : null,
                      colorScheme: colorScheme,
                      onTap: () => context.go(item.path),
                    ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _selectedPath(String route) {
    for (final item in _allItems) {
      if (route.startsWith(item.path)) return item.path;
    }
    return '/feed';
  }
}

class _SectionDivider extends StatelessWidget {
  const _SectionDivider({required this.label, required this.colorScheme});
  final String label;
  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 2),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 1,
            height: 20,
            color: colorScheme.outlineVariant.withValues(alpha: 0.3),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              fontSize: 8,
              fontWeight: FontWeight.w700,
              color: colorScheme.outlineVariant,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _NavTab extends StatelessWidget {
  const _NavTab({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.colorScheme,
    required this.onTap,
    this.badgeCount,
  });

  final IconData icon;
  final String label;
  final bool isSelected;
  final int? badgeCount;
  final ColorScheme colorScheme;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = isSelected ? colorScheme.primary : colorScheme.onSurfaceVariant;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Badge(
              isLabelVisible: badgeCount != null,
              label: badgeCount != null ? Text('$badgeCount') : null,
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                color: color,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

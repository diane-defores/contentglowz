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
    _NavItem(icon: Icons.water_drop_rounded, label: 'Drip', path: '/drip'),
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

final _allItems = _sections.expand((s) => s.items).toList();

/// Breakpoint: above this width we show side rail instead of bottom nav.
const _desktopBreakpoint = 800.0;

class AppShell extends ConsumerWidget {
  final Widget child;

  const AppShell({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingCount = ref.watch(pendingCountProvider);
    final currentRoute = GoRouterState.of(context).uri.path;
    final selectedPath = _selectedPath(currentRoute);
    final colorScheme = Theme.of(context).colorScheme;
    final isWide = MediaQuery.sizeOf(context).width >= _desktopBreakpoint;

    if (isWide) {
      return Scaffold(
        body: Row(
          children: [
            _SideRail(
              selectedPath: selectedPath,
              pendingCount: pendingCount,
              colorScheme: colorScheme,
              onNavigate: (path) => context.go(path),
            ),
            VerticalDivider(width: 1, color: colorScheme.outlineVariant.withValues(alpha: 0.3)),
            Expanded(child: child),
          ],
        ),
      );
    }

    return Scaffold(
      body: child,
      bottomNavigationBar: _BottomNav(
        selectedPath: selectedPath,
        pendingCount: pendingCount,
        colorScheme: colorScheme,
        onNavigate: (path) => context.go(path),
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

// ─── Desktop: Side Rail ──────────────────────────────────────

class _SideRail extends StatelessWidget {
  const _SideRail({
    required this.selectedPath,
    required this.pendingCount,
    required this.colorScheme,
    required this.onNavigate,
  });

  final String selectedPath;
  final int pendingCount;
  final ColorScheme colorScheme;
  final ValueChanged<String> onNavigate;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 220,
      color: colorScheme.surface,
      child: SafeArea(
        child: Column(
          children: [
            // Logo area
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Row(
                children: [
                  Icon(Icons.auto_awesome, color: colorScheme.primary, size: 24),
                  const SizedBox(width: 8),
                  Text(
                    'Content Flows',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: colorScheme.onSurface,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            // Sections
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                children: [
                  for (final section in _sections) ...[
                    Padding(
                      padding: const EdgeInsets.fromLTRB(12, 16, 12, 6),
                      child: Text(
                        section.label.toUpperCase(),
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: colorScheme.outlineVariant,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ),
                    for (final item in section.items)
                      _SideNavItem(
                        icon: item.icon,
                        label: item.label,
                        isSelected: item.path == selectedPath,
                        badgeCount:
                            item.path == '/feed' && pendingCount > 0
                                ? pendingCount
                                : null,
                        colorScheme: colorScheme,
                        onTap: () => onNavigate(item.path),
                      ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SideNavItem extends StatelessWidget {
  const _SideNavItem({
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
    final bgColor = isSelected
        ? colorScheme.primary.withValues(alpha: 0.12)
        : Colors.transparent;

    return Padding(
      padding: const EdgeInsets.only(bottom: 2),
      child: Material(
        color: bgColor,
        borderRadius: BorderRadius.circular(10),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(10),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                Badge(
                  isLabelVisible: badgeCount != null,
                  label: badgeCount != null ? Text('$badgeCount') : null,
                  child: Icon(icon, color: color, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    label,
                    style: TextStyle(
                      fontSize: 13,
                      color: color,
                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Mobile: Bottom Nav ──────────────────────────────────────

/// Primary tabs shown in the bottom bar on mobile.
const _mobileTabPaths = ['/feed', '/calendar', '/history', '/drip'];

class _BottomNav extends StatelessWidget {
  const _BottomNav({
    required this.selectedPath,
    required this.pendingCount,
    required this.colorScheme,
    required this.onNavigate,
  });

  final String selectedPath;
  final int pendingCount;
  final ColorScheme colorScheme;
  final ValueChanged<String> onNavigate;

  @override
  Widget build(BuildContext context) {
    final primaryItems =
        _allItems.where((i) => _mobileTabPaths.contains(i.path)).toList();
    final isMoreSelected = !_mobileTabPaths.contains(selectedPath);

    return Container(
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
        child: Row(
          children: [
            for (final item in primaryItems)
              Expanded(
                child: _NavTab(
                  icon: item.icon,
                  label: item.label,
                  isSelected: item.path == selectedPath,
                  badgeCount: item.path == '/feed' && pendingCount > 0
                      ? pendingCount
                      : null,
                  colorScheme: colorScheme,
                  onTap: () => onNavigate(item.path),
                ),
              ),
            Expanded(
              child: _NavTab(
                icon: Icons.grid_view_rounded,
                label: 'More',
                isSelected: isMoreSelected,
                colorScheme: colorScheme,
                onTap: () => _showMoreSheet(context),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showMoreSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 36,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: colorScheme.outlineVariant.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              for (final section in _sections)
                ...[
                  Padding(
                    padding: const EdgeInsets.fromLTRB(8, 12, 8, 6),
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        section.label.toUpperCase(),
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: colorScheme.outlineVariant,
                          letterSpacing: 1.0,
                        ),
                      ),
                    ),
                  ),
                  Wrap(
                    spacing: 4,
                    runSpacing: 4,
                    children: section.items.map((item) {
                      final isSelected = item.path == selectedPath;
                      final color = isSelected
                          ? colorScheme.primary
                          : colorScheme.onSurfaceVariant;
                      final bgColor = isSelected
                          ? colorScheme.primary.withValues(alpha: 0.12)
                          : Colors.transparent;
                      return Material(
                        color: bgColor,
                        borderRadius: BorderRadius.circular(12),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () {
                            Navigator.pop(ctx);
                            onNavigate(item.path);
                          },
                          child: SizedBox(
                            width: 80,
                            height: 64,
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(item.icon, color: color, size: 22),
                                const SizedBox(height: 4),
                                Text(
                                  item.label,
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: color,
                                    fontWeight: isSelected
                                        ? FontWeight.w600
                                        : FontWeight.w400,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
            ],
          ),
        ),
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
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Badge(
              isLabelVisible: badgeCount != null,
              label: badgeCount != null ? Text('$badgeCount') : null,
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
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

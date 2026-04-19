import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../data/models/app_access_state.dart';
import '../../providers/providers.dart';
import '../widgets/app_error_view.dart';

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

const _degradedSections = [
  _NavSection(label: 'System', items: [
    _NavItem(icon: Icons.monitor_heart_rounded, label: 'Uptime', path: '/uptime'),
    _NavItem(icon: Icons.settings_rounded, label: 'Settings', path: '/settings'),
  ]),
];

final _allDegradedItems = _degradedSections.expand((s) => s.items).toList();

/// Breakpoint: above this width we show side rail instead of bottom nav.
const _desktopBreakpoint = 800.0;

class AppShell extends ConsumerWidget {
  final Widget child;

  const AppShell({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appAccess = ref.watch(appAccessStateProvider).valueOrNull;
    final degradedMode = appAccess?.isDegraded == true;
    final pendingCount = degradedMode ? 0 : ref.watch(pendingCountProvider);
    final currentRoute = GoRouterState.of(context).uri.path;
    final selectedPath = _selectedPath(
      currentRoute,
      degradedMode: degradedMode,
    );
    final colorScheme = Theme.of(context).colorScheme;
    final isWide = MediaQuery.sizeOf(context).width >= _desktopBreakpoint;
    final sections = degradedMode ? _degradedSections : _sections;
    final allItems = degradedMode ? _allDegradedItems : _allItems;

    if (isWide) {
      return Scaffold(
        body: Row(
          children: [
            _SideRail(
              sections: sections,
              selectedPath: selectedPath,
              pendingCount: pendingCount,
              colorScheme: colorScheme,
              onNavigate: (path) => context.go(path),
            ),
            VerticalDivider(width: 1, color: colorScheme.outlineVariant.withValues(alpha: 0.3)),
            Expanded(
              child: _ShellContent(
                degradedMode: degradedMode,
                appAccess: appAccess,
                ref: ref,
                child: child,
              ),
            ),
          ],
        ),
      );
    }

    return Scaffold(
      body: _ShellContent(
        degradedMode: degradedMode,
        appAccess: appAccess,
        ref: ref,
        child: child,
      ),
      bottomNavigationBar: _BottomNav(
        sections: sections,
        items: allItems,
        degradedMode: degradedMode,
        selectedPath: selectedPath,
        pendingCount: pendingCount,
        colorScheme: colorScheme,
        onNavigate: (path) => context.go(path),
      ),
    );
  }

  String _selectedPath(String route, {required bool degradedMode}) {
    final items = degradedMode ? _allDegradedItems : _allItems;
    for (final item in items) {
      if (route.startsWith(item.path)) return item.path;
    }
    return degradedMode ? '/uptime' : '/feed';
  }
}

class _ShellContent extends StatelessWidget {
  const _ShellContent({
    required this.degradedMode,
    required this.appAccess,
    required this.ref,
    required this.child,
  });

  final bool degradedMode;
  final AppAccessState? appAccess;
  final WidgetRef ref;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    if (!degradedMode) {
      return child;
    }

    final colorScheme = Theme.of(context).colorScheme;
    final message = switch (appAccess?.stage) {
      AppAccessStage.apiUnavailable =>
        'FastAPI is unavailable. ContentFlow is running in degraded mode until the backend responds again.',
      AppAccessStage.bootstrapFailed =>
        'Clerk is connected, but workspace bootstrap failed. ContentFlow stays in degraded mode until FastAPI returns a usable bootstrap.',
      _ =>
        'ContentFlow is running in degraded mode while backend access is limited.',
    };

    return Column(
      children: [
        Material(
          color: colorScheme.errorContainer,
          child: SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  Icon(
                    Icons.warning_amber_rounded,
                    color: colorScheme.onErrorContainer,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      message,
                      style: TextStyle(
                        color: colorScheme.onErrorContainer,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  TextButton(
                    onPressed: () => context.go('/uptime'),
                    child: Text(
                      'Open Uptime',
                      style: TextStyle(color: colorScheme.onErrorContainer),
                    ),
                  ),
                  IconButton(
                    tooltip: 'Copy diagnostics',
                    onPressed: () {
                      copyDiagnosticsToClipboard(
                        context,
                        ref,
                        title: 'ContentFlow degraded mode diagnostics',
                        scope: 'app_shell.degraded_mode',
                        currentError: message,
                        contextData: {
                          'accessStage': appAccess?.diagnosticsLabel ?? 'unknown',
                          'backendStatus':
                              appAccess?.backendStatusLabel ?? 'unknown',
                        },
                        successMessage: 'Degraded mode diagnostics copied.',
                      );
                    },
                    icon: Icon(
                      Icons.copy_rounded,
                      color: colorScheme.onErrorContainer,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        Expanded(child: child),
      ],
    );
  }
}

// ─── Desktop: Side Rail ──────────────────────────────────────

class _SideRail extends StatelessWidget {
  const _SideRail({
    required this.sections,
    required this.selectedPath,
    required this.pendingCount,
    required this.colorScheme,
    required this.onNavigate,
  });

  final List<_NavSection> sections;
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
                  for (final section in sections) ...[
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
    required this.sections,
    required this.items,
    required this.degradedMode,
    required this.selectedPath,
    required this.pendingCount,
    required this.colorScheme,
    required this.onNavigate,
  });

  final List<_NavSection> sections;
  final List<_NavItem> items;
  final bool degradedMode;
  final String selectedPath;
  final int pendingCount;
  final ColorScheme colorScheme;
  final ValueChanged<String> onNavigate;

  @override
  Widget build(BuildContext context) {
    final primaryItems = degradedMode
        ? items
        : items.where((i) => _mobileTabPaths.contains(i.path)).toList();
    final isMoreSelected = !_mobileTabPaths.contains(selectedPath);
    final showMoreTab = !degradedMode;

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
            if (showMoreTab)
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
              for (final section in sections)
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

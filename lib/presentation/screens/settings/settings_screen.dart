import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../data/models/app_settings.dart';
import '../../../data/models/content_item.dart';
import '../../../providers/providers.dart';
import '../../theme/app_theme.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  late TextEditingController _apiUrlController;

  @override
  void initState() {
    super.initState();
    _apiUrlController = TextEditingController();
  }

  @override
  void dispose() {
    _apiUrlController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final apiBaseUrl = ref.watch(apiBaseUrlProvider);
    final backendStatus = ref.watch(backendStatusProvider);
    final publishAccounts = ref.watch(publishAccountsProvider);
    final userSettings = ref.watch(currentUserSettingsProvider);

    if (_apiUrlController.text.isEmpty) {
      _apiUrlController.text = apiBaseUrl;
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Backend connection
          _sectionHeader('Backend Connection'),
          const SizedBox(height: 12),
          _buildCard(
            child: Column(
              children: [
                // Status indicator
                Row(
                  children: [
                    backendStatus.when(
                      data: (data) {
                        final isOnline =
                            data['status'] == 'ok' ||
                            data['status'] == 'healthy';
                        return Row(
                          children: [
                            Container(
                              width: 10,
                              height: 10,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: isOnline
                                    ? AppTheme.approveColor
                                    : AppTheme.rejectColor,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              isOnline
                                  ? 'Connected'
                                  : 'Offline (using mock data)',
                              style: TextStyle(
                                color: isOnline
                                    ? AppTheme.approveColor
                                    : AppTheme.rejectColor,
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        );
                      },
                      loading: () => const Row(
                        children: [
                          SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                          SizedBox(width: 8),
                          Text('Checking...'),
                        ],
                      ),
                      error: (_, _) => Row(
                        children: [
                          Container(
                            width: 10,
                            height: 10,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.orange,
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'Error checking status',
                            style: TextStyle(color: Colors.orange),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                // API URL
                TextField(
                  controller: _apiUrlController,
                  decoration: InputDecoration(
                    labelText: 'API URL',
                    hintText: 'http://localhost:8000',
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.check_rounded),
                      onPressed: () {
                        ref
                            .read(apiBaseUrlProvider.notifier)
                            .update(_apiUrlController.text);
                        ref.invalidate(backendStatusProvider);
                        ref.invalidate(pendingContentProvider);
                        ref.invalidate(publishAccountsProvider);
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 28),

          // Content Engine
          _sectionHeader('Content Engine'),
          const SizedBox(height: 12),
          _buildActionTile(
            icon: Icons.auto_stories,
            title: 'Weekly Ritual',
            subtitle: 'Feed your creator voice & narrative',
            color: const Color(0xFF6C5CE7),
            onTap: () => context.push('/ritual'),
          ),
          const SizedBox(height: 8),
          _buildActionTile(
            icon: Icons.people_outline,
            title: 'Personas',
            subtitle: 'Manage customer personas',
            color: const Color(0xFF0984E3),
            onTap: () => context.push('/personas'),
          ),
          const SizedBox(height: 8),
          _buildActionTile(
            icon: Icons.lightbulb_outline,
            title: 'Content Angles',
            subtitle: 'Generate & pick content angles',
            color: const Color(0xFFFDAA5E),
            onTap: () => context.push('/angles'),
          ),
          const SizedBox(height: 8),
          _buildActionTile(
            icon: Icons.tune,
            title: 'Onboarding',
            subtitle: 'Change project & content type settings',
            color: const Color(0xFF00B894),
            onTap: () => context.push('/onboarding?intent=entry'),
          ),

          const SizedBox(height: 28),

          // Idea Pool
          _sectionHeader('Idea Pool'),
          const SizedBox(height: 12),
          _buildIdeaPoolCard(userSettings),

          const SizedBox(height: 28),

          // Content frequency
          _sectionHeader('Content Frequency'),
          const SizedBox(height: 12),
          _buildFrequencyCard(userSettings),

          const SizedBox(height: 28),

          // Publishing channels
          _sectionHeader('Publishing Channels'),
          const SizedBox(height: 12),
          ..._buildChannelTiles(publishAccounts),

          const SizedBox(height: 28),

          // Notifications
          _sectionHeader('Notifications'),
          const SizedBox(height: 12),
          _buildNotificationsCard(userSettings),

          const SizedBox(height: 28),

          // About
          _sectionHeader('About'),
          const SizedBox(height: 12),
          _buildCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'ContentFlowz',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Content Approval Pipeline v0.1.0',
                  style: TextStyle(color: Colors.white.withAlpha(120)),
                ),
                const SizedBox(height: 12),
                Text(
                  'AI generates content, you swipe to publish.',
                  style: TextStyle(
                    color: Colors.white.withAlpha(160),
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _sectionHeader(String title) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: Colors.white.withAlpha(100),
        letterSpacing: 1.2,
      ),
    );
  }

  Widget _buildNotificationsCard(AsyncValue<AppSettings?> userSettings) {
    return _buildCard(
      child: userSettings.when(
        data: (settings) => SwitchListTile(
          title: const Text(
            'Push notifications',
            style: TextStyle(color: Colors.white),
          ),
          subtitle: Text(
            settings == null
                ? 'Sign in to sync notification preferences'
                : 'Get notified when new content is ready',
            style: TextStyle(color: Colors.white.withAlpha(100)),
          ),
          value: settings?.notificationsEnabled ?? false,
          onChanged: settings == null
              ? null
              : (val) {
                  ref
                      .read(currentUserSettingsProvider.notifier)
                      .toggleNotifications(val);
                },
          activeTrackColor: AppTheme.approveColor,
          contentPadding: EdgeInsets.zero,
        ),
        loading: () => const ListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(
            'Loading notification preferences',
            style: TextStyle(color: Colors.white),
          ),
          trailing: SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
        error: (error, _) => ListTile(
          contentPadding: EdgeInsets.zero,
          title: const Text(
            'Notification preferences unavailable',
            style: TextStyle(color: Colors.white),
          ),
          subtitle: Text(
            '$error',
            style: TextStyle(color: Colors.white.withAlpha(100)),
          ),
        ),
      ),
    );
  }

  Widget _buildIdeaPoolCard(AsyncValue<AppSettings?> userSettings) {
    return _buildCard(
      child: userSettings.when(
        data: (settings) {
          final enabled = settings?.ideaPoolEnabled ?? false;
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SwitchListTile(
                title: const Text(
                  'Curate ideas before generation',
                  style: TextStyle(color: Colors.white),
                ),
                subtitle: Text(
                  enabled
                      ? 'Content generation waits for your review'
                      : 'Content is generated automatically',
                  style: TextStyle(color: Colors.white.withAlpha(100)),
                ),
                value: enabled,
                onChanged: settings == null
                    ? null
                    : (val) {
                        ref
                            .read(currentUserSettingsProvider.notifier)
                            .toggleIdeaPool(val);
                      },
                activeTrackColor: const Color(0xFFFDAA5E),
                contentPadding: EdgeInsets.zero,
              ),
              if (enabled) ...[
                const SizedBox(height: 12),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFDAA5E).withAlpha(15),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: const Color(0xFFFDAA5E).withAlpha(40),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.lightbulb_outline,
                        color: Color(0xFFFDAA5E),
                        size: 18,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Ideas from newsletters, SEO, competitors and social listening will be held for your review before articles are generated.',
                          style: TextStyle(
                            color: Colors.white.withAlpha(160),
                            fontSize: 12,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () => context.push('/idea-pool'),
                    icon: const Icon(Icons.lightbulb_outline, size: 18),
                    label: const Text('View Idea Pool'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFFFDAA5E),
                      side: BorderSide(
                        color: const Color(0xFFFDAA5E).withAlpha(60),
                      ),
                    ),
                  ),
                ),
              ],
            ],
          );
        },
        loading: () => const ListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(
            'Loading Idea Pool settings',
            style: TextStyle(color: Colors.white),
          ),
          trailing: SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
        error: (_, _) => Text(
          'Sign in to configure Idea Pool',
          style: TextStyle(color: Colors.white.withAlpha(100)),
        ),
      ),
    );
  }

  Widget _buildFrequencyCard(AsyncValue<AppSettings?> userSettings) {
    return _buildCard(
      child: userSettings.when(
        data: (settings) {
          final freq = settings?.contentFrequency ?? {};
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'How much content should the AI generate?',
                style: TextStyle(color: Colors.white.withAlpha(140), fontSize: 13),
              ),
              const SizedBox(height: 16),
              _frequencyRow(
                icon: Icons.article_outlined,
                label: 'Blog articles',
                value: freq['blog_posts_per_month'] as int? ?? 0,
                unit: '/month',
                max: 30,
                color: const Color(0xFF6C5CE7),
                onChanged: (v) => _updateFrequency('blog_posts_per_month', v),
              ),
              const SizedBox(height: 12),
              _frequencyRow(
                icon: Icons.email_outlined,
                label: 'Newsletters',
                value: freq['newsletters_per_week'] as int? ?? 0,
                unit: '/week',
                max: 7,
                color: const Color(0xFFFDAA5E),
                onChanged: (v) => _updateFrequency('newsletters_per_week', v),
              ),
              const SizedBox(height: 12),
              _frequencyRow(
                icon: Icons.bolt_outlined,
                label: 'Shorts',
                value: freq['shorts_per_day'] as int? ?? 0,
                unit: '/day',
                max: 10,
                color: const Color(0xFFFF6B6B),
                onChanged: (v) => _updateFrequency('shorts_per_day', v),
              ),
              const SizedBox(height: 12),
              _frequencyRow(
                icon: Icons.chat_bubble_outline,
                label: 'Social posts',
                value: freq['social_posts_per_day'] as int? ?? 0,
                unit: '/day',
                max: 10,
                color: const Color(0xFF0984E3),
                onChanged: (v) => _updateFrequency('social_posts_per_day', v),
              ),
            ],
          );
        },
        loading: () => const Center(
          child: Padding(
            padding: EdgeInsets.all(20),
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
        error: (_, _) => Text(
          'Sign in to configure content frequency',
          style: TextStyle(color: Colors.white.withAlpha(100)),
        ),
      ),
    );
  }

  Widget _frequencyRow({
    required IconData icon,
    required String label,
    required int value,
    required String unit,
    required int max,
    required Color color,
    required ValueChanged<int> onChanged,
  }) {
    return LayoutBuilder(builder: (context, constraints) {
      final compact = constraints.maxWidth < 360;
      final slider = SliderTheme(
        data: SliderThemeData(
          activeTrackColor: color,
          inactiveTrackColor: color.withAlpha(30),
          thumbColor: color,
          overlayColor: color.withAlpha(30),
          trackHeight: 4,
        ),
        child: Slider(
          value: value.toDouble(),
          min: 0,
          max: max.toDouble(),
          divisions: max,
          onChanged: (v) => onChanged(v.round()),
        ),
      );
      final valueText = Text(
        value == 0 ? 'Off' : '$value$unit',
        textAlign: TextAlign.right,
        style: TextStyle(
          color: value == 0 ? Colors.white.withAlpha(60) : color,
          fontSize: 13,
          fontWeight: FontWeight.w600,
        ),
      );

      if (compact) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 20, color: color),
                const SizedBox(width: 8),
                Text(label, style: const TextStyle(color: Colors.white, fontSize: 14)),
                const Spacer(),
                valueText,
              ],
            ),
            slider,
          ],
        );
      }

      return Row(
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(width: 10),
          SizedBox(
            width: 100,
            child: Text(label, style: const TextStyle(color: Colors.white, fontSize: 14)),
          ),
          Expanded(child: slider),
          SizedBox(width: 55, child: valueText),
        ],
      );
    });
  }

  Future<void> _updateFrequency(String key, int value) async {
    try {
      final api = ref.read(apiServiceProvider);
      await api.updateSettings({
        'robotSettings': {
          'contentFrequency': {key: value},
        },
      });
      ref.invalidate(currentUserSettingsProvider);
    } catch (_) {
      // Silently fail — settings might not be persisted if not authenticated
    }
  }

  Widget _buildCard({required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withAlpha(15)),
      ),
      child: child,
    );
  }

  Widget _buildActionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withAlpha(15)),
      ),
      child: ListTile(
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: color.withAlpha(25),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: color, size: 22),
        ),
        title: Text(title, style: const TextStyle(color: Colors.white)),
        subtitle: Text(
          subtitle,
          style: TextStyle(color: Colors.white.withAlpha(80), fontSize: 12),
        ),
        trailing: Icon(Icons.chevron_right, color: Colors.white.withAlpha(40)),
        onTap: onTap,
      ),
    );
  }

  List<Widget> _buildChannelTiles(
    AsyncValue<List<PublishAccount>> accountsAsync,
  ) {
    final channels = [
      ('WordPress', PublishingChannel.wordpress, Icons.language),
      ('Twitter / X', PublishingChannel.twitter, Icons.alternate_email),
      ('LinkedIn', PublishingChannel.linkedin, Icons.work_outline),
      ('Instagram', PublishingChannel.instagram, Icons.camera_alt_outlined),
      ('Ghost', PublishingChannel.ghost, Icons.edit_note),
      ('YouTube', PublishingChannel.youtube, Icons.play_circle_outline),
      ('TikTok', PublishingChannel.tiktok, Icons.music_note),
    ];

    return channels.map((ch) {
      final (name, channel, icon) = ch;
      final platform = channelToPlatform(channel);
      final account = accountsAsync.valueOrNull == null || platform == null
          ? null
          : _accountForPlatform(accountsAsync.valueOrNull!, platform);
      final connected = account != null;

      return Container(
        margin: const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
          color: const Color(0xFF1A1A2E),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withAlpha(15)),
        ),
        child: ListTile(
          leading: Icon(icon, color: Colors.white.withAlpha(180)),
          title: Text(name, style: const TextStyle(color: Colors.white)),
          subtitle: Text(
            _channelSubtitle(
              accountsAsync: accountsAsync,
              platform: platform,
              connected: connected,
              account: account,
            ),
            style: TextStyle(color: Colors.white.withAlpha(80), fontSize: 12),
          ),
          trailing: _buildChannelTrailing(
            name: name,
            platform: platform,
            connected: connected,
            isLoading: accountsAsync.isLoading,
          ),
        ),
      );
    }).toList();
  }

  String _channelSubtitle({
    required AsyncValue<List<PublishAccount>> accountsAsync,
    required String? platform,
    required bool connected,
    required PublishAccount? account,
  }) {
    if (accountsAsync.isLoading) {
      return 'Loading connected accounts...';
    }
    if (accountsAsync.hasError) {
      return 'Could not fetch connected accounts';
    }
    if (platform == null) {
      return 'Not wired to LATE publish flow yet';
    }
    if (connected && account != null) {
      return '${account.displayName} @${account.username}';
    }
    return 'No connected account found';
  }

  Widget _buildChannelTrailing({
    required String name,
    required String? platform,
    required bool connected,
    required bool isLoading,
  }) {
    if (isLoading) {
      return const SizedBox(
        width: 18,
        height: 18,
        child: CircularProgressIndicator(strokeWidth: 2),
      );
    }

    if (platform == null) {
      return Text(
        'Not wired',
        style: TextStyle(color: Colors.orange.withAlpha(180), fontSize: 12),
      );
    }

    if (connected) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppTheme.approveColor.withAlpha(30),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              'Connected',
              style: TextStyle(color: AppTheme.approveColor, fontSize: 12),
            ),
          ),
          const SizedBox(width: 4),
          IconButton(
            icon: Icon(Icons.link_off, size: 18, color: Colors.white.withAlpha(80)),
            tooltip: 'Disconnect',
            onPressed: () => _disconnectChannel(name, platform!),
            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
            padding: EdgeInsets.zero,
          ),
        ],
      );
    }

    return OutlinedButton(
      onPressed: () => _connectChannel(name, platform),
      style: OutlinedButton.styleFrom(
        foregroundColor: Colors.white60,
        side: BorderSide(color: Colors.white.withAlpha(40)),
        padding: const EdgeInsets.symmetric(horizontal: 14),
        minimumSize: const Size(0, 34),
      ),
      child: const Text('Connect', style: TextStyle(fontSize: 12)),
    );
  }

  Future<void> _connectChannel(String channelName, String? platform) async {
    if (platform == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('$channelName is not supported for direct connection yet'),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
      return;
    }

    final api = ref.read(apiServiceProvider);
    final connectUrl = await api.getConnectUrl(platform);

    if (!mounted) return;

    if (connectUrl == null || connectUrl.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Could not get connect URL for $channelName'),
          backgroundColor: AppTheme.rejectColor.withAlpha(200),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
      return;
    }

    // Open OAuth URL in browser
    final uri = Uri.parse(connectUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);

      // Show dialog to refresh after connecting
      if (!mounted) return;
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: const Color(0xFF1A1A2E),
          title: Text('Connecting $channelName'),
          content: Text(
            'A browser window has opened for you to authorize $channelName.\n\nOnce done, tap "Refresh" to see your connected account.',
            style: TextStyle(color: Colors.white.withAlpha(180)),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () {
                Navigator.pop(ctx);
                ref.invalidate(publishAccountsProvider);
              },
              child: const Text('Refresh'),
            ),
          ],
        ),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Could not open browser for $channelName authorization'),
          backgroundColor: AppTheme.rejectColor.withAlpha(200),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    }
  }

  Future<void> _disconnectChannel(String channelName, String platform) async {
    final accounts = ref.read(publishAccountsProvider).valueOrNull ?? [];
    final account = _accountForPlatform(accounts, platform);
    if (account == null) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A2E),
        title: Text('Disconnect $channelName?'),
        content: Text(
          'This will remove the connection to ${account.displayName}.',
          style: TextStyle(color: Colors.white.withAlpha(180)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(
              backgroundColor: AppTheme.rejectColor,
            ),
            child: const Text('Disconnect'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    final api = ref.read(apiServiceProvider);
    final success = await api.disconnectAccount(account.id);

    if (mounted) {
      if (success) {
        ref.invalidate(publishAccountsProvider);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Disconnected $channelName'),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to disconnect $channelName'),
            backgroundColor: AppTheme.rejectColor.withAlpha(200),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    }
  }

  PublishAccount? _accountForPlatform(
    List<PublishAccount> accounts,
    String platform,
  ) {
    for (final account in accounts) {
      if (account.platform == platform && account.isActive) {
        return account;
      }
    }
    for (final account in accounts) {
      if (account.platform == platform) {
        return account;
      }
    }
    return null;
  }
}

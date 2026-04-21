import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/app_language.dart';
import '../../../core/app_theme_preference.dart';
import '../../../core/in_app_tour/in_app_tour_controller.dart';
import '../../../data/models/app_settings.dart';
import '../../../data/models/content_item.dart';
import '../../../l10n/app_localizations.dart';
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
    final appAccess = ref.watch(appAccessStateProvider).valueOrNull;
    final authSession = ref.watch(authSessionProvider);
    final backendStatus = ref.watch(backendStatusProvider);
    final githubIntegration = ref.watch(githubIntegrationStatusProvider);
    final publishAccountsState = ref.watch(publishAccountsStateProvider);
    final publishAccounts = ref.watch(publishAccountsProvider);
    final languagePreference = ref.watch(appLanguagePreferenceProvider);
    final themePreference = ref.watch(appThemePreferenceProvider);
    final userSettings = ref.watch(currentUserSettingsProvider);
    final isFeedbackAdmin = ref.watch(isFeedbackAdminProvider);
    final tour = ref.watch(inAppTourProvider);

    if (_apiUrlController.text.isEmpty) {
      _apiUrlController.text = apiBaseUrl;
    }

    return Scaffold(
      appBar: AppBar(title: Text(context.tr('Settings'))),
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
                                  ? context.tr('Connected')
                                  : context.tr('Offline (using mock data)'),
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
                      loading: () => Row(
                        children: [
                          SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                          SizedBox(width: 8),
                          Text(context.tr('Checking...')),
                        ],
                      ),
                      error: (_, _) => Row(
                        children: [
                          Container(
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: AppTheme.warningColor,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            context.tr('Error checking status'),
                            style: TextStyle(color: AppTheme.warningColor),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                if (appAccess?.isDegraded == true) ...[
                  const SizedBox(height: 12),
                  Text(
                    context.tr(
                      'Degraded mode is active. The app stays available, cached data may be stale, and queued actions will replay when FastAPI recovers.',
                    ),
                    style: TextStyle(
                      color: AppTheme.warningColor.withAlpha(220),
                      fontSize: 12,
                      height: 1.4,
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                // API URL
                TextField(
                  controller: _apiUrlController,
                  decoration: InputDecoration(
                    labelText: context.tr('API URL'),
                    hintText: 'http://localhost:8000',
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.check_rounded),
                      onPressed: () {
                        ref
                            .read(apiBaseUrlProvider.notifier)
                            .update(_apiUrlController.text);
                        ref.invalidate(backendStatusProvider);
                        ref.invalidate(appAccessStateProvider);
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

          // GitHub integration
          _sectionHeader('GitHub integration'),
          const SizedBox(height: 12),
          _buildGithubIntegrationCard(githubIntegration),

          const SizedBox(height: 28),

          _sectionHeader('Language'),
          const SizedBox(height: 12),
          _buildLanguageCard(languagePreference),

          const SizedBox(height: 28),

          _sectionHeader('Appearance'),
          const SizedBox(height: 12),
          _buildAppearanceCard(themePreference),

          const SizedBox(height: 28),

          // Content Engine
          _sectionHeader('Content Engine'),
          const SizedBox(height: 12),
          _buildActionTile(
            icon: Icons.auto_stories,
            title: 'Weekly Ritual',
            subtitle: 'Feed your creator voice & narrative',
            color: AppTheme.colorForContentType('Article'),
            onTap: () => context.push('/ritual'),
          ),
          const SizedBox(height: 8),
          _buildActionTile(
            icon: Icons.people_outline,
            title: 'Personas',
            subtitle: 'Manage customer personas',
            color: AppTheme.editColor,
            onTap: () => context.push('/personas'),
          ),
          const SizedBox(height: 8),
          _buildActionTile(
            icon: Icons.lightbulb_outline,
            title: 'Content Angles',
            subtitle: 'Generate & pick content angles',
            color: AppTheme.warningColor,
            onTap: () => context.push('/angles'),
          ),
          const SizedBox(height: 8),
          _buildActionTile(
            icon: Icons.tune,
            title: 'Onboarding',
            subtitle: 'Change project & content type settings',
            color: AppTheme.approveColor,
            onTap: () => context.push('/onboarding?intent=entry'),
          ),
          const SizedBox(height: 8),
          _buildActionTile(
            icon: Icons.folder_copy_outlined,
            title: 'Projects',
            subtitle: 'Switch the active project or manage your workspace list',
            color: AppTheme.infoColor,
            onTap: () => context.push('/projects'),
          ),
          const SizedBox(height: 8),
          _buildTourTile(tour),

          const SizedBox(height: 28),

          // Idea Pool
          _sectionHeader('Idea Pool'),
          const SizedBox(height: 12),
          _buildIdeaPoolCard(
            userSettings,
            isAuthenticated: authSession.isAuthenticated,
          ),

          const SizedBox(height: 28),

          // Content frequency
          _sectionHeader('Content Frequency'),
          const SizedBox(height: 12),
          _buildFrequencyCard(
            userSettings,
            isAuthenticated: authSession.isAuthenticated,
          ),

          const SizedBox(height: 28),

          // Publishing channels
          _sectionHeader('Publishing Channels'),
          const SizedBox(height: 12),
          if (publishAccountsState.valueOrNull?.isUnavailable == true) ...[
            _buildPublishAccountsNotice(
              context.tr(
                'Publish account connections are unavailable until the backend publish integration is configured.',
              ),
              detail: publishAccountsState.valueOrNull?.message,
            ),
            const SizedBox(height: 12),
          ],
          if (publishAccountsState.valueOrNull?.hasError == true) ...[
            _buildPublishAccountsNotice(
              context.tr(
                'Connected accounts could not be loaded right now. Publishing stays available only for already-resolved flows.',
              ),
              detail: publishAccountsState.valueOrNull?.message,
              tone: AppTheme.warningColor,
            ),
            const SizedBox(height: 12),
          ],
          ..._buildChannelTiles(
            accountsAsync: publishAccounts,
            publishAccountsState: publishAccountsState,
          ),

          const SizedBox(height: 28),

          // Notifications
          _sectionHeader('Notifications'),
          const SizedBox(height: 12),
          _buildNotificationsCard(
            userSettings,
            isAuthenticated: authSession.isAuthenticated,
          ),

          const SizedBox(height: 28),

          _sectionHeader('Feedback'),
          const SizedBox(height: 12),
          _buildActionTile(
            icon: Icons.forum_outlined,
            title: 'Send Feedback',
            subtitle: 'Share text or audio product feedback',
            color: AppTheme.colorForContentType('Article'),
            onTap: () => context.push('/feedback'),
          ),
          if (isFeedbackAdmin) ...[
            const SizedBox(height: 8),
            _buildActionTile(
              icon: Icons.admin_panel_settings_outlined,
              title: 'Feedback Admin',
              subtitle: 'Review incoming user feedback',
              color: AppTheme.approveColor,
              onTap: () => context.push('/feedback-admin'),
            ),
          ],

          const SizedBox(height: 28),

          // About
          _sectionHeader('About'),
          const SizedBox(height: 12),
          _buildCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'ContentFlow',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  context.tr('Content Approval Pipeline v0.1.0'),
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  context.tr('AI generates content, you swipe to publish.'),
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
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
    final colorScheme = Theme.of(context).colorScheme;
    return Text(
      context.tr(title),
      style: TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: colorScheme.onSurfaceVariant,
        letterSpacing: 1.2,
      ),
    );
  }

  Widget _buildGithubIntegrationCard(AsyncValue<GithubIntegrationState> state) {
    final theme = Theme.of(context);

    return _buildCard(
      child: state.when(
        data: (value) {
          final statusText = value.connected
              ? context.tr('GitHub is connected ({username})', {
                  'username': value.username ?? context.tr('unknown'),
                })
              : context.tr('GitHub is not connected.');

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                statusText,
                style: TextStyle(
                  color: theme.colorScheme.onSurfaceVariant,
                  height: 1.4,
                ),
              ),
              if (value.scope != null && value.scope!.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(
                  context.tr('Granted scopes: {scope}', {'scope': value.scope!}),
                  style: TextStyle(
                    color: theme.colorScheme.onSurfaceVariant,
                    fontSize: 12,
                  ),
                ),
              ],
              const SizedBox(height: 12),
              value.connected
                  ? OutlinedButton.icon(
                      icon: const Icon(Icons.link_off, size: 18),
                      label: Text(context.tr('Disconnect GitHub')),
                      onPressed: _disconnectGithub,
                    )
                  : FilledButton(
                      onPressed: _connectGithub,
                      style: FilledButton.styleFrom(
                        backgroundColor: AppTheme.approveColor,
                      ),
                      child: Text(context.tr('Connect GitHub')),
                    ),
            ],
          );
        },
        loading: () => Text(
          context.tr('Checking GitHub integration...'),
          style: TextStyle(
            color: theme.colorScheme.onSurfaceVariant,
            height: 1.4,
          ),
        ),
        error: (_, _) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              context.tr('Unable to load GitHub integration state.'),
              style: TextStyle(
                color: theme.colorScheme.onSurfaceVariant,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 8),
            FilledButton(
              onPressed: _connectGithub,
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.approveColor,
              ),
              child: Text(context.tr('Try reconnecting')),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLanguageCard(String languagePreference) {
    final selected = normalizeAppLanguagePreference(languagePreference);
    final colorScheme = Theme.of(context).colorScheme;

    return _buildCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            context.tr(
              'Choose how ContentFlow chooses its interface language.',
            ),
            style: TextStyle(
              color: colorScheme.onSurfaceVariant,
              fontSize: 13,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: selected,
            decoration: InputDecoration(labelText: context.tr('App language')),
            items: [
              DropdownMenuItem(
                value: appLanguageSystem,
                child: Text(context.tr('Follow system language')),
              ),
              DropdownMenuItem(
                value: appLanguageEnglish,
                child: Text(context.tr('English')),
              ),
              DropdownMenuItem(
                value: appLanguageFrench,
                child: Text(context.tr('French')),
              ),
            ],
            onChanged: (value) {
              if (value == null) {
                return;
              }
              ref
                  .read(currentUserSettingsProvider.notifier)
                  .updateLanguage(value);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildAppearanceCard(String themePreference) {
    final selected = normalizeAppThemePreference(themePreference);
    final colorScheme = Theme.of(context).colorScheme;

    return _buildCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            context.tr(
              'Choose whether ContentFlow stays bright, stays dark, or follows your device appearance automatically.',
            ),
            style: TextStyle(
              color: colorScheme.onSurfaceVariant,
              fontSize: 13,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            key: const Key('theme-mode-dropdown'),
            initialValue: selected,
            decoration: InputDecoration(labelText: context.tr('Theme')),
            items: [
              DropdownMenuItem(
                value: appThemeSystem,
                child: Text(context.tr('Follow system appearance')),
              ),
              DropdownMenuItem(
                value: appThemeLight,
                child: Text(context.tr('Light')),
              ),
              DropdownMenuItem(
                value: appThemeDark,
                child: Text(context.tr('Dark')),
              ),
            ],
            onChanged: (value) {
              if (value == null) {
                return;
              }
              ref.read(currentUserSettingsProvider.notifier).updateTheme(value);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationsCard(
    AsyncValue<AppSettings?> userSettings, {
    required bool isAuthenticated,
  }) {
    final theme = Theme.of(context);
    final unavailableMessage = isAuthenticated
        ? context.tr('Notification preferences are temporarily unavailable')
        : context.tr('Sign in to sync notification preferences');
    return _buildCard(
      child: userSettings.when(
        data: (settings) => SwitchListTile(
          title: Text(
            context.tr('Push notifications'),
            style: TextStyle(color: theme.colorScheme.onSurface),
          ),
          subtitle: Text(
            settings == null
                ? context.tr('Sign in to sync notification preferences')
                : context.tr('Get notified when new content is ready'),
            style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
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
        loading: () => ListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(
            context.tr('Loading notification preferences'),
            style: TextStyle(color: theme.colorScheme.onSurface),
          ),
          trailing: SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
        error: (error, _) => ListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(
            context.tr('Notification preferences unavailable'),
            style: TextStyle(color: theme.colorScheme.onSurface),
          ),
          subtitle: Text(
            unavailableMessage,
            style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
          ),
        ),
      ),
    );
  }

  Widget _buildIdeaPoolCard(
    AsyncValue<AppSettings?> userSettings, {
    required bool isAuthenticated,
  }) {
    final theme = Theme.of(context);
    final unavailableMessage = isAuthenticated
        ? context.tr('Idea Pool settings are temporarily unavailable')
        : context.tr('Sign in to configure Idea Pool');
    return _buildCard(
      child: userSettings.when(
        data: (settings) {
          final enabled = settings?.ideaPoolEnabled ?? false;
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SwitchListTile(
                title: Text(
                  context.tr('Curate ideas before generation'),
                  style: TextStyle(color: theme.colorScheme.onSurface),
                ),
                subtitle: Text(
                  enabled
                      ? context.tr('Content generation waits for your review')
                      : context.tr('Content is generated automatically'),
                  style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
                ),
                value: enabled,
                onChanged: settings == null
                    ? null
                    : (val) {
                        ref
                            .read(currentUserSettingsProvider.notifier)
                            .toggleIdeaPool(val);
                      },
                activeTrackColor: AppTheme.warningColor,
                contentPadding: EdgeInsets.zero,
              ),
              if (enabled) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.warningColor.withAlpha(15),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: AppTheme.warningColor.withAlpha(40),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.lightbulb_outline,
                        color: AppTheme.warningColor,
                        size: 18,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          context.tr(
                            'Ideas from newsletters, SEO, competitors and social listening will be held for your review before articles are generated.',
                          ),
                          style: TextStyle(
                            color: theme.colorScheme.onSurfaceVariant,
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
                    label: Text(context.tr('View Idea Pool')),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.warningColor,
                      side: BorderSide(
                        color: AppTheme.warningColor.withAlpha(60),
                      ),
                    ),
                  ),
                ),
              ],
            ],
          );
        },
        loading: () => ListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(
            context.tr('Loading Idea Pool settings'),
            style: TextStyle(color: theme.colorScheme.onSurface),
          ),
          trailing: SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
        error: (_, _) => Text(
          unavailableMessage,
          style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
        ),
      ),
    );
  }

  Widget _buildFrequencyCard(
    AsyncValue<AppSettings?> userSettings, {
    required bool isAuthenticated,
  }) {
    final theme = Theme.of(context);
    final unavailableMessage = isAuthenticated
        ? context.tr('Content frequency settings are temporarily unavailable')
        : context.tr('Sign in to configure content frequency');
    return _buildCard(
      child: userSettings.when(
        data: (settings) {
          final freq = settings?.contentFrequency ?? {};
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                context.tr('How much content should the AI generate?'),
                style: TextStyle(
                  color: theme.colorScheme.onSurfaceVariant,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 16),
              _frequencyRow(
                icon: Icons.article_outlined,
                label: 'Blog articles',
                value: freq['blog_posts_per_month'] as int? ?? 0,
                unit: '/month',
                max: 30,
                color: AppTheme.colorForContentType('Article'),
                onChanged: (v) => _updateFrequency('blog_posts_per_month', v),
              ),
              const SizedBox(height: 12),
              _frequencyRow(
                icon: Icons.email_outlined,
                label: 'Newsletters',
                value: freq['newsletters_per_week'] as int? ?? 0,
                unit: '/week',
                max: 7,
                color: AppTheme.warningColor,
                onChanged: (v) => _updateFrequency('newsletters_per_week', v),
              ),
              const SizedBox(height: 12),
              _frequencyRow(
                icon: Icons.bolt_outlined,
                label: 'Shorts',
                value: freq['shorts_per_day'] as int? ?? 0,
                unit: '/day',
                max: 10,
                color: AppTheme.colorForContentType('Short'),
                onChanged: (v) => _updateFrequency('shorts_per_day', v),
              ),
              const SizedBox(height: 12),
              _frequencyRow(
                icon: Icons.chat_bubble_outline,
                label: 'Social posts',
                value: freq['social_posts_per_day'] as int? ?? 0,
                unit: '/day',
                max: 10,
                color: AppTheme.editColor,
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
          unavailableMessage,
          style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
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
    return LayoutBuilder(
      builder: (context, constraints) {
        final theme = Theme.of(context);
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
          value == 0 ? context.tr('Off') : '$value${context.tr(unit)}',
          textAlign: TextAlign.right,
          style: TextStyle(
            color: value == 0 ? theme.colorScheme.onSurfaceVariant : color,
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
                  Text(
                    context.tr(label),
                    style: TextStyle(
                      color: theme.colorScheme.onSurface,
                      fontSize: 14,
                    ),
                  ),
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
              child: Text(
                context.tr(label),
                style: TextStyle(
                  color: theme.colorScheme.onSurface,
                  fontSize: 14,
                ),
              ),
            ),
            Expanded(child: slider),
            SizedBox(width: 55, child: valueText),
          ],
        );
      },
    );
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
    final palette = AppTheme.paletteOf(context);
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: palette.elevatedSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: palette.borderSubtle),
      ),
      child: child,
    );
  }

  Widget _buildTourTile(InAppTourState tour) {
    final String title;
    final String subtitle;
    final VoidCallback onTap;
    final controller = ref.read(inAppTourProvider.notifier);

    if (tour.completed) {
      title = context.tr('Guided app tour');
      subtitle = context.tr('Restart the guided tour from the beginning');
      onTap = () => controller.start(context);
    } else if (tour.stepIndex > 0) {
      title = context.tr('Resume the guided tour');
      subtitle = context.tr('Step {current}/{total} — {title}', {
        'current': '${tour.stepIndex + 1}',
        'total': '${tour.totalSteps}',
        'title': context.tr(tour.currentStep.title),
      });
      onTap = () => controller.resume(context);
    } else {
      title = context.tr('Guided app tour');
      subtitle = context.tr('Discover the screens step by step');
      onTap = () => controller.start(context);
    }

    final theme = Theme.of(context);
    final palette = AppTheme.paletteOf(context);
    return Container(
      decoration: BoxDecoration(
        color: palette.elevatedSurface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: palette.borderSubtle),
      ),
      child: ListTile(
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: AppTheme.approveColor.withAlpha(25),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(
            Icons.tour_rounded,
            color: AppTheme.approveColor,
            size: 22,
          ),
        ),
        title: Text(
          title,
          style: TextStyle(color: theme.colorScheme.onSurface),
        ),
        subtitle: Text(
          subtitle,
          style: TextStyle(
            color: theme.colorScheme.onSurfaceVariant,
            fontSize: 12,
          ),
        ),
        trailing: Icon(
          Icons.chevron_right,
          color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
        ),
        onTap: onTap,
      ),
    );
  }

  Widget _buildActionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    final theme = Theme.of(context);
    final palette = AppTheme.paletteOf(context);
    return Container(
      decoration: BoxDecoration(
        color: palette.elevatedSurface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: palette.borderSubtle),
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
        title: Text(
          context.tr(title),
          style: TextStyle(color: theme.colorScheme.onSurface),
        ),
        subtitle: Text(
          context.tr(subtitle),
          style: TextStyle(
            color: theme.colorScheme.onSurfaceVariant,
            fontSize: 12,
          ),
        ),
        trailing: Icon(
          Icons.chevron_right,
          color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
        ),
        onTap: onTap,
      ),
    );
  }

  Widget _buildPublishAccountsNotice(
    String message, {
    String? detail,
    Color? tone,
  }) {
    final theme = Theme.of(context);
    final resolvedTone = tone ?? AppTheme.rejectColor;
    return _buildCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            message,
            style: TextStyle(color: resolvedTone, fontSize: 13, height: 1.4),
          ),
          if (detail != null && detail.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              detail,
              style: TextStyle(
                color: theme.colorScheme.onSurfaceVariant,
                fontSize: 12,
              ),
            ),
          ],
        ],
      ),
    );
  }

  List<Widget> _buildChannelTiles({
    required AsyncValue<List<PublishAccount>> accountsAsync,
    required AsyncValue<PublishAccountsState> publishAccountsState,
  }) {
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
          color: AppTheme.paletteOf(context).elevatedSurface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.paletteOf(context).borderSubtle),
        ),
        child: ListTile(
          leading: Icon(
            icon,
            color: Theme.of(
              context,
            ).colorScheme.onSurface.withValues(alpha: 0.9),
          ),
          title: Text(
            name,
            style: TextStyle(color: Theme.of(context).colorScheme.onSurface),
          ),
          subtitle: Text(
            _channelSubtitle(
              accountsAsync: accountsAsync,
              publishAccountsState: publishAccountsState,
              platform: platform,
              connected: connected,
              account: account,
            ),
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontSize: 12,
            ),
          ),
          trailing: _buildChannelTrailing(
            name: name,
            platform: platform,
            connected: connected,
            isLoading: accountsAsync.isLoading,
            publishAccountsState: publishAccountsState,
          ),
        ),
      );
    }).toList();
  }

  String _channelSubtitle({
    required AsyncValue<List<PublishAccount>> accountsAsync,
    required AsyncValue<PublishAccountsState> publishAccountsState,
    required String? platform,
    required bool connected,
    required PublishAccount? account,
  }) {
    if (accountsAsync.isLoading) {
      return context.tr('Loading connected accounts...');
    }
    if (publishAccountsState.valueOrNull?.isUnavailable == true) {
      return context.tr('Publish connections unavailable');
    }
    if (publishAccountsState.valueOrNull?.hasError == true ||
        accountsAsync.hasError) {
      return context.tr('Could not fetch connected accounts');
    }
    if (platform == null) {
      return context.tr('Not wired to LATE publish flow yet');
    }
    if (connected && account != null) {
      return '${account.displayName} @${account.username}';
    }
    return context.tr('No connected account found');
  }

  Widget _buildChannelTrailing({
    required String name,
    required String? platform,
    required bool connected,
    required bool isLoading,
    required AsyncValue<PublishAccountsState> publishAccountsState,
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
        context.tr('Not wired'),
        style: TextStyle(
          color: AppTheme.warningColor.withAlpha(180),
          fontSize: 12,
        ),
      );
    }

    if (publishAccountsState.valueOrNull?.isUnavailable == true) {
      return Text(
        context.tr('Unavailable'),
        style: TextStyle(
          color: AppTheme.warningColor.withAlpha(180),
          fontSize: 12,
        ),
      );
    }

    if (publishAccountsState.valueOrNull?.hasError == true) {
      return Text(
        context.tr('Unavailable'),
        style: TextStyle(
          color: AppTheme.warningColor.withAlpha(180),
          fontSize: 12,
        ),
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
              context.tr('Connected'),
              style: TextStyle(color: AppTheme.approveColor, fontSize: 12),
            ),
          ),
          const SizedBox(width: 4),
          IconButton(
            icon: Icon(
              Icons.link_off,
              size: 18,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            tooltip: context.tr('Disconnect'),
            onPressed: () => _disconnectChannel(name, platform),
            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
            padding: EdgeInsets.zero,
          ),
        ],
      );
    }

    return OutlinedButton(
      onPressed: () => _connectChannel(name, platform),
      style: OutlinedButton.styleFrom(
        foregroundColor: Theme.of(context).colorScheme.onSurfaceVariant,
        side: BorderSide(
          color: Theme.of(
            context,
          ).colorScheme.outlineVariant.withValues(alpha: 0.9),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 14),
        minimumSize: const Size(0, 34),
      ),
      child: Text(context.tr('Connect'), style: const TextStyle(fontSize: 12)),
    );
  }

  Future<void> _connectGithub() async {
    final api = ref.read(apiServiceProvider);
    final connectUrl = await api.getGithubConnectUrl();

    if (connectUrl == null || connectUrl.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.tr(
              'GitHub OAuth is unavailable. Check backend configuration.',
            ),
          ),
          backgroundColor: AppTheme.rejectColor.withAlpha(200),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      );
      return;
    }

    final uri = Uri.parse(connectUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!mounted) return;
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text(context.tr('GitHub connection')),
          content: Text(
            context.tr(
              'A browser opened for authorization. Once you finish, return here and tap Refresh.',
            ),
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text(context.tr('Close')),
            ),
            FilledButton(
              onPressed: () {
                Navigator.pop(ctx);
                ref.invalidate(githubIntegrationStatusProvider);
              },
              child: Text(context.tr('Refresh')),
            ),
          ],
        ),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.tr('Could not open browser for GitHub authorization'),
          ),
          backgroundColor: AppTheme.rejectColor.withAlpha(200),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      );
    }
  }

  Future<void> _disconnectGithub() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(context.tr('Disconnect GitHub?')),
        content: Text(
          context.tr(
            'This removes your GitHub connection and hides private repository data from the picker.',
          ),
          style: TextStyle(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(context.tr('Cancel')),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(
              backgroundColor: AppTheme.rejectColor,
            ),
            child: Text(context.tr('Disconnect')),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) {
      return;
    }

    final api = ref.read(apiServiceProvider);
    final success = await api.disconnectGithubIntegration();
    if (!mounted) return;

    if (success) {
      ref.invalidate(githubIntegrationStatusProvider);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.tr('GitHub disconnected.'))),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.tr('Failed to disconnect GitHub.')),
          backgroundColor: AppTheme.rejectColor.withAlpha(200),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      );
    }
  }

  Future<void> _connectChannel(String channelName, String? platform) async {
    if (platform == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.tr(
              '{channelName} is not supported for direct connection yet',
              {'channelName': channelName},
            ),
          ),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
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
          content: Text(
            context.tr('Could not get connect URL for {channelName}', {
              'channelName': channelName,
            }),
          ),
          backgroundColor: AppTheme.rejectColor.withAlpha(200),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
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
          title: Text(
            context.tr('Connecting {channelName}', {
              'channelName': channelName,
            }),
          ),
          content: Text(
            context.tr(
              'A browser window has opened for you to authorize {channelName}.\n\nOnce done, tap "Refresh" to see your connected account.',
              {'channelName': channelName},
            ),
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text(context.tr('Cancel')),
            ),
            FilledButton(
              onPressed: () {
                Navigator.pop(ctx);
                ref.invalidate(publishAccountsProvider);
              },
              child: Text(context.tr('Refresh')),
            ),
          ],
        ),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.tr(
              'Could not open browser for {channelName} authorization',
              {'channelName': channelName},
            ),
          ),
          backgroundColor: AppTheme.rejectColor.withAlpha(200),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
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
        title: Text(
          context.tr('Disconnect {channelName}?', {'channelName': channelName}),
        ),
        content: Text(
          context.tr('This will remove the connection to {displayName}.', {
            'displayName': account.displayName,
          }),
          style: TextStyle(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(context.tr('Cancel')),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(
              backgroundColor: AppTheme.rejectColor,
            ),
            child: Text(context.tr('Disconnect')),
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
            content: Text(
              context.tr('Disconnected {channelName}', {
                'channelName': channelName,
              }),
            ),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              context.tr('Failed to disconnect {channelName}', {
                'channelName': channelName,
              }),
            ),
            backgroundColor: AppTheme.rejectColor.withAlpha(200),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
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

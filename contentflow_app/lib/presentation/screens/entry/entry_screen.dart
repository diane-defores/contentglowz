import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/app_config.dart';
import '../../../data/models/app_access_state.dart';
import '../../../data/models/auth_session.dart';
import '../../../l10n/app_localizations.dart';
import '../../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_error_view.dart';

class EntryScreen extends ConsumerStatefulWidget {
  const EntryScreen({super.key});

  @override
  ConsumerState<EntryScreen> createState() => _EntryScreenState();
}

class _EntryScreenState extends ConsumerState<EntryScreen> {
  Future<void> _openWebsiteSignIn() async {
    final url = kIsWeb
        ? Uri.parse('${Uri.base.origin}/sign-in')
        : Uri.parse('${AppConfig.appWebUrl}/sign-in');
    await launchUrl(url);
  }

  Widget? _buildEntryErrorDiagnostics(
    AuthSession authSession,
    AppAccessState? accessState,
  ) {
    final message = accessState?.message;
    if (message == null || message.trim().isEmpty) {
      return null;
    }

    return AppErrorView(
      scope: 'entry.${accessState?.diagnosticsLabel ?? 'unknown'}',
      title: 'Copy this error',
      message: message,
      compact: true,
      showIcon: false,
      copyLabel: 'Copy diagnostics',
      helperText:
          'Copy this report and send it back so the failing auth/bootstrap state can be inspected.',
      contextData: {
        'accessStage': accessState?.diagnosticsLabel ?? 'unknown',
        'statusCode': accessState?.statusCode?.toString() ?? 'none',
        'backendStatus': accessState?.backendStatusLabel ?? 'unknown',
        'sessionState': authSession.status.name,
        'sessionEmail': authSession.email ?? 'none',
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final authSession = ref.watch(authSessionProvider);
    final appAccessAsync = ref.watch(appAccessStateProvider);
    final palette = AppTheme.paletteOf(context);
    final stateCard = _buildStateCard(
      context,
      ref,
      authSession,
      appAccessAsync,
    );

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: palette.heroGradient,
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: AppSpacing.sm,
            ),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1160),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildHero(context, ref, stateCard),
                    SizedBox(height: AppSpacing.md),
                    _buildProofStrip(),
                    SizedBox(height: AppSpacing.md),
                    _buildHowItWorks(),
                    SizedBox(height: AppSpacing.md),
                    _buildFeatureGrid(),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHero(BuildContext context, WidgetRef ref, Widget stateCard) {
    final theme = Theme.of(context);
    return LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxWidth < 900;
        final left = Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _pill(icon: Icons.workspaces_outline, label: 'ContentFlow app'),
            const SizedBox(height: 14),
            Builder(
              builder: (context) {
                final sw = MediaQuery.sizeOf(context).width;
                final heroSize = sw < 400
                    ? 22.0
                    : sw < 600
                    ? 28.0
                    : 38.0;
                return Text(
                  context.tr('Welcome back to your content workspace.'),
                  style: TextStyle(
                    color: theme.colorScheme.onSurface,
                    fontSize: heroSize,
                    fontWeight: FontWeight.w800,
                    height: 1.12,
                  ),
                );
              },
            ),
            const SizedBox(height: 10),
            Text(
              context.tr(
                'Use this page to restore your session, open your workspace, finish onboarding, or recover cleanly when the backend is unavailable.',
              ),
              style: TextStyle(
                color: theme.colorScheme.onSurfaceVariant,
                fontSize: 15,
                height: 1.45,
              ),
            ),
            const SizedBox(height: 14),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: const [
                _MetricChip(value: 'Auth', label: 'session status first'),
                _MetricChip(value: 'API', label: 'backend readiness visible'),
                _MetricChip(
                  value: 'Workspace',
                  label: 'dashboard or onboarding route',
                ),
              ],
            ),
          ],
        );

        if (compact) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [stateCard, const SizedBox(height: 16), left],
          );
        }

        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(flex: 5, child: left),
            const SizedBox(width: 24),
            Expanded(flex: 6, child: stateCard),
          ],
        );
      },
    );
  }

  Widget _buildProofStrip() {
    final palette = AppTheme.paletteOf(context);
    const items = [
      'Session restore',
      'Google sign-in',
      'Dashboard access',
      'Onboarding recovery',
      'API diagnostics',
    ];

    return Container(
      padding: EdgeInsets.all(AppSpacing.sm),
      decoration: BoxDecoration(
        color: palette.surface.withValues(alpha: 0.72),
        borderRadius: BorderRadius.circular(AppRadii.xl),
        border: Border.all(color: palette.borderSubtle),
      ),
      child: Wrap(
        spacing: AppSpacing.xs,
        runSpacing: AppSpacing.xs,
        children: items
            .map(
              (item) =>
                  _pill(icon: Icons.check_circle_outline_rounded, label: item),
            )
            .toList(),
      ),
    );
  }

  Widget _buildHowItWorks() {
    final theme = Theme.of(context);
    final palette = AppTheme.paletteOf(context);
    const steps = [
      (
        '1. Restore or sign in',
        'ContentFlow checks Clerk first, then opens the right account path without burying auth below marketing content.',
      ),
      (
        '2. Resolve workspace state',
        'The app decides whether you should enter the dashboard, finish onboarding, retry the API, or refresh your session.',
      ),
      (
        '3. Continue work',
        'Once the session and backend are ready, you can return directly to your content pipeline.',
      ),
    ];

    return Container(
      padding: EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        color: palette.elevatedSurface,
        borderRadius: BorderRadius.circular(AppRadii.card),
        border: Border.all(color: palette.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            context.tr('What happens on this page'),
            style: TextStyle(
              color: theme.colorScheme.onSurface,
              fontSize: 20,
              fontWeight: FontWeight.w700,
            ),
          ),
          SizedBox(height: AppSpacing.xs),
          Text(
            context.tr(
              'This is an app entry page for existing users. It keeps account, workspace, and recovery actions at the top.',
            ),
            style: TextStyle(
              color: theme.colorScheme.onSurfaceVariant,
              fontSize: 14,
              height: 1.45,
            ),
          ),
          SizedBox(height: AppSpacing.lg),
          LayoutBuilder(
            builder: (context, constraints) {
              final cardWidth = constraints.maxWidth < 700
                  ? constraints.maxWidth
                  : 320.0;
              return Wrap(
                spacing: AppSpacing.md,
                runSpacing: AppSpacing.md,
                children: steps
                    .map(
                      (step) => SizedBox(
                        width: cardWidth,
                        child: _infoCard(
                          title: step.$1,
                          description: step.$2,
                          icon: Icons.arrow_outward_rounded,
                          accent: AppTheme.editColor,
                        ),
                      ),
                    )
                    .toList(),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureGrid() {
    final items = [
      (
        'Account-first entry',
        'The visible state card tells users whether they are signed out, restoring, active, blocked, or ready.',
        Icons.verified_user_outlined,
        AppTheme.editColor,
      ),
      (
        'Backend-aware recovery',
        'API and bootstrap failures expose retry, status, reconnect, and diagnostics actions without hiding them lower on the page.',
        Icons.health_and_safety_outlined,
        AppTheme.warningColor,
      ),
      (
        'Workspace continuation',
        'Recognized users can go straight to the dashboard or continue onboarding from the first viewport.',
        Icons.dashboard_customize_outlined,
        AppTheme.approveColor,
      ),
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        final cardWidth = constraints.maxWidth < 750
            ? constraints.maxWidth
            : 350.0;
        return Wrap(
          spacing: AppSpacing.md,
          runSpacing: AppSpacing.md,
          children: items
              .map(
                (item) => SizedBox(
                  width: cardWidth,
                  child: _infoCard(
                    title: item.$1,
                    description: item.$2,
                    icon: item.$3,
                    accent: item.$4,
                  ),
                ),
              )
              .toList(),
        );
      },
    );
  }

  Widget _buildStateCard(
    BuildContext context,
    WidgetRef ref,
    AuthSession authSession,
    AsyncValue<AppAccessState> appAccessAsync,
  ) {
    final accessState = appAccessAsync.value;
    final stage = accessState?.stage;

    if (appAccessAsync.isLoading || stage == AppAccessStage.restoringSession) {
      return _card(
        eyebrow: 'Restoring session',
        title: 'Checking Clerk session',
        description:
            'The app is restoring your Clerk session and deciding whether to open auth, onboarding, or your workspace.',
        icon: Icons.sync_rounded,
        accent: AppTheme.editColor,
        primaryLabel: 'Please wait',
        onPrimary: null,
        secondaryLabel: 'Open Demo Workspace',
        onSecondary: () {
          ref.read(authSessionProvider.notifier).signInDemo();
          context.go('/onboarding?intent=entry');
        },
      );
    }

    if (stage == AppAccessStage.checkingBackend ||
        stage == AppAccessStage.checkingWorkspace) {
      return _card(
        eyebrow: 'Checking session',
        title: stage == AppAccessStage.checkingBackend
            ? 'Checking backend availability'
            : 'Loading your workspace',
        description: stage == AppAccessStage.checkingBackend
            ? 'Your Clerk session is active. The app is confirming that FastAPI is reachable before asking for workspace state.'
            : 'The app is validating your session and loading your workspace from FastAPI.',
        icon: Icons.sync_rounded,
        accent: AppTheme.editColor,
        primaryLabel: 'Please wait',
        onPrimary: null,
        secondaryLabel: 'Sign out',
        onSecondary: () => ref.read(authSessionProvider.notifier).signOut(),
      );
    }

    if (stage == AppAccessStage.apiUnavailable ||
        stage == AppAccessStage.bootstrapFailed ||
        stage == AppAccessStage.bootstrapUnauthorized) {
      final isUnauthorized = stage == AppAccessStage.bootstrapUnauthorized;
      final title = isUnauthorized
          ? 'Reconnect your account'
          : 'FastAPI is unavailable';
      final description = isUnauthorized
          ? 'Your Clerk session reached the app, but FastAPI rejected the bootstrap request. Sign in again to refresh the bearer token.'
          : 'Your Clerk session is active, but ContentFlow cannot load product state from FastAPI right now. Use the degraded mode tools to inspect backend status, retry, or wait for the API to recover.';

      return _card(
        eyebrow: stage == AppAccessStage.apiUnavailable
            ? 'API down'
            : 'Session error',
        title: title,
        description: description,
        icon: Icons.warning_amber_rounded,
        accent: AppTheme.warningColor,
        primaryLabel: isUnauthorized
            ? (kIsWeb ? 'Continue with Google' : 'Sign In Again')
            : 'Open System Status',
        onPrimary: () {
          if (isUnauthorized) {
            ref.read(authSessionProvider.notifier).signOut();
            if (kIsWeb) {
              _openWebsiteSignIn();
            } else {
              context.go('/auth');
            }
            return;
          }
          context.go('/uptime');
        },
        secondaryLabel: isUnauthorized ? 'Open Demo Workspace' : 'Retry API',
        onSecondary: () {
          if (isUnauthorized) {
            ref.read(authSessionProvider.notifier).signInDemo();
            context.go(
              authSession.onboardingComplete
                  ? '/feed'
                  : '/onboarding?intent=entry',
            );
            return;
          }
          ref.read(appAccessStateProvider.notifier).refresh();
        },
        caption: 'Backend detail: ${accessState?.message ?? 'unknown'}',
        extra: _buildEntryErrorDiagnostics(authSession, accessState),
      );
    }

    if (stage == AppAccessStage.ready) {
      return _card(
        eyebrow: 'Session active',
        title: 'Welcome back to ContentFlow',
        description:
            'Your account is already recognized. Jump back into the content pipeline instead of going through onboarding again.',
        icon: Icons.verified_user_rounded,
        accent: AppTheme.approveColor,
        primaryLabel: 'Open Dashboard',
        onPrimary: () => context.go('/feed'),
        secondaryLabel: 'Sign out',
        onSecondary: () => ref.read(authSessionProvider.notifier).signOut(),
        extra: _buildCopyFlowDiagnostics(
          context,
          ref,
          authSession,
          accessState,
        ),
      );
    }

    if (stage == AppAccessStage.needsOnboarding ||
        stage == AppAccessStage.demo) {
      return _card(
        eyebrow: 'Setup required',
        title: 'Finish onboarding before entering the app',
        description:
            'Your session exists, but the workspace setup is still incomplete. Continue onboarding to configure project, content types, and publishing flow.',
        icon: Icons.rocket_launch_rounded,
        accent: AppTheme.editColor,
        primaryLabel: 'Continue Onboarding',
        onPrimary: () => context.go('/onboarding?intent=entry'),
        secondaryLabel: 'Sign out',
        onSecondary: () => ref.read(authSessionProvider.notifier).signOut(),
        extra: _buildCopyFlowDiagnostics(
          context,
          ref,
          authSession,
          accessState,
        ),
      );
    }

    return _card(
      eyebrow: 'Logged out',
      title: 'Sign in to access your workspace',
      description: kIsWeb
          ? 'You are not signed in yet. Continue with Google on the dedicated app-domain Clerk page. Workspace creation and onboarding are only available after authentication.'
          : 'You are not signed in yet. The Flutter beta auth path has been archived, so use the dedicated web sign-in flow instead.',
      icon: Icons.lock_outline_rounded,
      accent: AppTheme.warningColor,
      primaryLabel: kIsWeb ? 'Continue with Google' : 'Sign In',
      onPrimary: kIsWeb ? _openWebsiteSignIn : () => context.go('/auth'),
      secondaryLabel: 'Open Demo Workspace',
      onSecondary: () {
        ref.read(authSessionProvider.notifier).signInDemo();
        context.go(
          authSession.onboardingComplete ? '/feed' : '/onboarding?intent=entry',
        );
      },
      caption: kIsWeb
          ? 'The stable path is now ClerkJS on `app.contentflow.winflowz.com/sign-in`, with a standard OAuth callback on `/sso-callback`.'
          : 'The demo uses one fixed public repository and pre-generated content so every visitor sees the same stable workspace. The old Flutter beta auth path now lives only in the legacy branch.',
      extra: _buildCopyFlowDiagnostics(context, ref, authSession, accessState),
    );
  }

  Widget _buildCopyFlowDiagnostics(
    BuildContext context,
    WidgetRef ref,
    AuthSession authSession,
    AppAccessState? accessState,
  ) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Align(
        alignment: Alignment.centerLeft,
        child: OutlinedButton.icon(
          onPressed: () {
            copyDiagnosticsToClipboard(
              context,
              ref,
              title: 'ContentFlow entry diagnostics',
              scope: 'entry.copy_flow_diagnostics',
              currentError: accessState?.message,
              contextData: {
                'sessionState': authSession.status.name,
                'sessionEmail': authSession.email ?? 'none',
                'accessStage': accessState?.diagnosticsLabel ?? 'loading',
                'backendStatus': accessState?.backendStatusLabel ?? 'unknown',
                'backendGitSha':
                    accessState?.backendHealth?['git_sha']?.toString() ??
                    'unknown',
                'bootstrapStatus':
                    accessState?.bootstrapStatusLabel ?? 'not_started',
                'workspaceStatus':
                    accessState?.bootstrap?.workspaceStatus ?? 'none',
                'workspaceExists':
                    accessState?.bootstrap?.user.workspaceExists ?? false,
                'projectsCount':
                    accessState?.bootstrap?.projectsCount ?? 'none',
                'defaultProjectId':
                    accessState?.bootstrap?.defaultProjectId ?? 'none',
              },
              successMessage: 'Entry diagnostics copied to clipboard.',
            );
          },
          style: OutlinedButton.styleFrom(
            foregroundColor: theme.colorScheme.onSurfaceVariant,
            side: BorderSide(
              color: theme.colorScheme.outlineVariant.withValues(alpha: 0.9),
            ),
          ),
          icon: const Icon(Icons.copy_all_rounded, size: 18),
          label: Text(context.tr('Copy access diagnostics')),
        ),
      ),
    );
  }

  Widget _card({
    required String eyebrow,
    required String title,
    required String description,
    required IconData icon,
    required Color accent,
    required String primaryLabel,
    required VoidCallback? onPrimary,
    required String secondaryLabel,
    required VoidCallback onSecondary,
    String? caption,
    Widget? extra,
  }) {
    final theme = Theme.of(context);
    final palette = AppTheme.paletteOf(context);
    final compact = MediaQuery.sizeOf(context).width < 600;
    return Container(
      padding: EdgeInsets.all(compact ? AppSpacing.lg : 28),
      decoration: BoxDecoration(
        color: palette.elevatedSurface,
        borderRadius: BorderRadius.circular(compact ? AppRadii.xl : AppRadii.card),
        border: Border.all(color: palette.borderSubtle),
        boxShadow: [
          BoxShadow(
            color: accent.withAlpha(22),
            blurRadius: 36,
            offset: const Offset(0, 18),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  context.tr(eyebrow).toUpperCase(),
                  style: TextStyle(
                    color: accent,
                    fontSize: AppText.sm,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.4,
                  ),
                ),
              ),
              Container(
                width: compact ? 44 : 56,
                height: compact ? 44 : 56,
                decoration: BoxDecoration(
                  color: accent.withAlpha(30),
                  borderRadius: BorderRadius.circular(compact ? AppRadii.lg : AppRadii.xl),
                ),
                child: Icon(icon, color: accent, size: compact ? 24 : 28),
              ),
            ],
          ),
          SizedBox(height: compact ? AppSpacing.md : AppSpacing.lg),
          Text(
            context.tr(title),
            style: TextStyle(
              color: theme.colorScheme.onSurface,
              fontSize: compact ? 23 : 28,
              fontWeight: FontWeight.bold,
              height: 1.15,
            ),
          ),
          SizedBox(height: compact ? AppSpacing.md : AppSpacing.xl),
          Text(
            context.tr(description),
            style: TextStyle(
              color: theme.colorScheme.onSurfaceVariant,
              fontSize: 15,
              height: 1.5,
            ),
          ),
          SizedBox(height: compact ? AppSpacing.md : AppSpacing.lg),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: onPrimary,
              style: FilledButton.styleFrom(
                backgroundColor: accent,
                padding: EdgeInsets.symmetric(vertical: compact ? 15 : 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppRadii.lg),
                ),
              ),
              child: Text(context.tr(primaryLabel)),
            ),
          ),
          SizedBox(height: AppSpacing.xs),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: onSecondary,
              style: OutlinedButton.styleFrom(
                foregroundColor: theme.colorScheme.onSurfaceVariant,
                side: BorderSide(
                  color: theme.colorScheme.outlineVariant.withValues(
                    alpha: 0.9,
                  ),
                ),
                padding: EdgeInsets.symmetric(vertical: compact ? 13 : 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppRadii.lg),
                ),
              ),
              child: Text(context.tr(secondaryLabel)),
            ),
          ),
          if (caption != null) ...[
            SizedBox(height: AppSpacing.xs),
            Text(
              context.tr(caption),
              style: TextStyle(
                color: theme.colorScheme.onSurfaceVariant.withValues(
                  alpha: 0.8,
                ),
                fontSize: 12,
                height: 1.5,
              ),
            ),
          ],
          if (extra case final extraWidget?) ...[extraWidget],
        ],
      ),
    );
  }

  Widget _pill({required IconData icon, required String label}) {
    final theme = Theme.of(context);
    final palette = AppTheme.paletteOf(context);
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: palette.surface.withValues(alpha: 0.75),
        borderRadius: BorderRadius.circular(AppRadii.pill),
        border: Border.all(color: palette.borderSubtle),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: theme.colorScheme.onSurfaceVariant, size: 16),
          SizedBox(width: AppSpacing.xs),
          Flexible(
            child: Text(
              context.tr(label),
              style: TextStyle(
                color: theme.colorScheme.onSurface,
                fontSize: AppText.sm,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoCard({
    required String title,
    required String description,
    required IconData icon,
    required Color accent,
  }) {
    final theme = Theme.of(context);
    final palette = AppTheme.paletteOf(context);
    return Container(
      padding: EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: palette.elevatedSurface,
        borderRadius: BorderRadius.circular(AppRadii.xl),
        border: Border.all(color: palette.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  context.tr(title),
                  style: TextStyle(
                    color: theme.colorScheme.onSurface,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              SizedBox(width: AppSpacing.xs),
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: accent.withAlpha(26),
                  borderRadius: BorderRadius.circular(AppRadii.lg),
                ),
                child: Icon(icon, color: accent),
              ),
            ],
          ),
          SizedBox(height: AppSpacing.xs),
          Text(
            context.tr(description),
            style: TextStyle(
              color: theme.colorScheme.onSurfaceVariant,
              fontSize: AppText.base - 2,
              height: 1.55,
            ),
          ),
        ],
      ),
    );
  }
}

class _MetricChip extends StatelessWidget {
  const _MetricChip({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final palette = AppTheme.paletteOf(context);
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: palette.surface.withValues(alpha: 0.72),
        borderRadius: BorderRadius.circular(AppRadii.xl),
        border: Border.all(color: palette.borderSubtle),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            value,
            style: TextStyle(
              color: theme.colorScheme.onSurface,
              fontSize: AppText.lg,
              fontWeight: FontWeight.w800,
            ),
          ),
          SizedBox(width: AppSpacing.xs),
          Text(
            context.tr(label),
            style: TextStyle(
              color: theme.colorScheme.onSurfaceVariant,
              fontSize: AppText.sm,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

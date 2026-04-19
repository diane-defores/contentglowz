import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/app_config.dart';
import '../../../data/services/api_service.dart';
import '../../../data/models/auth_session.dart';
import '../../../providers/providers.dart';
import '../../theme/app_theme.dart';

class EntryScreen extends ConsumerStatefulWidget {
  const EntryScreen({super.key});

  @override
  ConsumerState<EntryScreen> createState() => _EntryScreenState();
}

class _EntryScreenState extends ConsumerState<EntryScreen> {
  static const String _diagnosticsVersion = 'entry-diagnostics-v6-2026-04-18';

  Future<void> _openWebsiteSignIn() async {
    final url = kIsWeb
        ? Uri.parse('${Uri.base.origin}/sign-in')
        : Uri.parse('${AppConfig.appWebUrl}/sign-in');
    await launchUrl(url);
  }

  Future<void> _openWebsiteLaunch() async {
    final url = kIsWeb
        ? Uri.parse('${Uri.base.origin}/#/entry')
        : Uri.parse('${AppConfig.appWebUrl}/#/entry');
    await launchUrl(url);
  }

  String _buildModeLabel() {
    if (kReleaseMode) return 'release';
    if (kProfileMode) return 'profile';
    return 'debug';
  }

  String _maskToken(String? value) {
    if (value == null || value.isEmpty) return 'none';
    if (value.length <= 14) return value;
    return '${value.substring(0, 8)}...${value.substring(value.length - 4)}';
  }

  String _hostForUrl(String value) {
    final uri = Uri.tryParse(value);
    if (uri == null || uri.host.isEmpty) {
      return 'invalid';
    }
    return uri.host;
  }

  String _hostMatchLabel(String value) {
    if (!kIsWeb) {
      return 'not-web';
    }
    final host = _hostForUrl(value);
    if (host == 'invalid') {
      return 'invalid';
    }
    return host == Uri.base.host ? 'yes' : 'no (expected $host)';
  }

  List<String> _entryDiagnosticsLines(AuthSession authSession) {
    return [
      'ContentFlow entry diagnostics',
      'Version: $_diagnosticsVersion',
      'Build commit: ${AppConfig.buildCommitSha}',
      'Build environment: ${AppConfig.buildEnvironment}',
      'Build timestamp: ${AppConfig.buildTimestamp}',
      'Build mode: ${_buildModeLabel()}',
      'Current URL: ${kIsWeb ? Uri.base.toString() : 'not-web'}',
      'Current origin: ${kIsWeb ? Uri.base.origin : 'not-web'}',
      'Current host: ${kIsWeb ? Uri.base.host : 'not-web'}',
      'Current path: ${kIsWeb ? Uri.base.path : 'not-web'}',
      'API_BASE_URL: ${AppConfig.apiBaseUrl}',
      'APP_SITE_URL: ${AppConfig.siteUrl}',
      'APP_SITE_URL host match: ${_hostMatchLabel(AppConfig.siteUrl)}',
      'APP_SITE_URL loops to app host: ${AppConfig.siteUrlPointsToAppHost ? 'yes' : 'no'}',
      'Effective website URL: ${AppConfig.effectiveSiteUrl}',
      'Effective website URL host match: ${_hostMatchLabel(AppConfig.effectiveSiteUrl)}',
      'APP_WEB_URL: ${AppConfig.appWebUrl}',
      'APP_WEB_URL host match: ${_hostMatchLabel(AppConfig.appWebUrl)}',
      'Session state: ${authSession.status.name}',
      'Session email: ${authSession.email ?? 'none'}',
      'Bearer token: ${_maskToken(authSession.bearerToken)}',
      'Onboarding complete: ${authSession.onboardingComplete ? 'yes' : 'no'}',
      'Primary web sign-in route: ${AppConfig.appWebUrl}/sign-in',
      'Primary web callback route: ${AppConfig.appWebUrl}/sso-callback',
    ];
  }

  ApiException? _extractApiException(Object? error) {
    if (error is ApiException) {
      return error;
    }
    return null;
  }

  String _bootstrapErrorSummary(Object? error) {
    final apiError = _extractApiException(error);
    if (apiError != null) {
      final parts = <String>[
        if (apiError.statusCode != null) 'status ${apiError.statusCode}',
        if (apiError.path != null && apiError.path!.isNotEmpty) apiError.path!,
        apiError.message,
      ];
      return parts.join(' • ');
    }
    return error?.toString() ?? 'unknown';
  }

  Future<void> _copyEntryDiagnostics(AuthSession authSession) async {
    await Clipboard.setData(
      ClipboardData(text: _entryDiagnosticsLines(authSession).join('\n')),
    );
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Entry diagnostics copied to clipboard.')),
    );
  }

  Widget _buildWebRuntimeDiagnostics(AuthSession authSession) {
    final lines = _entryDiagnosticsLines(authSession);
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(8),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withAlpha(16)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Entry Diagnostics',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              TextButton(
                onPressed: () => _copyEntryDiagnostics(authSession),
                child: const Text('Copy'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          SelectableText(
            lines.join('\n'),
            style: TextStyle(
              color: Colors.white.withAlpha(150),
              fontSize: 12,
              height: 1.45,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authSession = ref.watch(authSessionProvider);
    final bootstrap = ref.watch(appBootstrapProvider);
    final stateCard = _buildStateCard(context, ref, authSession, bootstrap);

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF0D1321), Color(0xFF111827), Color(0xFF1A1A2E)],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1160),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildHero(context, ref, stateCard),
                    const SizedBox(height: 24),
                    _buildProofStrip(),
                    const SizedBox(height: 24),
                    _buildPainVsFlow(),
                    const SizedBox(height: 24),
                    _buildHowItWorks(),
                    const SizedBox(height: 24),
                    _buildFeatureGrid(),
                    const SizedBox(height: 24),
                    _buildFaqSection(),
                    const SizedBox(height: 32),
                    _buildBottomCta(context, ref),
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
    return LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxWidth < 900;
        final left = Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _pill(
              icon: Icons.auto_awesome_rounded,
              label: 'AI content ops for founders, creators, and lean teams',
            ),
            const SizedBox(height: 20),
            Builder(
              builder: (context) {
                final sw = MediaQuery.sizeOf(context).width;
                final heroSize = sw < 400
                    ? 28.0
                    : sw < 600
                    ? 36.0
                    : 48.0;
                return Text(
                  'Turn one repo into a weekly content machine.',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: heroSize,
                    fontWeight: FontWeight.w800,
                    height: 1.05,
                  ),
                );
              },
            ),
            const SizedBox(height: 16),
            Text(
              'ContentFlow analyzes your product, generates angles and drafts, then lets you approve, edit, schedule, and publish from one workflow instead of juggling prompts, docs, and social tools.',
              style: TextStyle(
                color: Colors.white.withAlpha(170),
                fontSize: 17,
                height: 1.6,
              ),
            ),
            const SizedBox(height: 24),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                FilledButton.icon(
                  onPressed: () {
                    ref.read(authSessionProvider.notifier).signInDemo();
                    context.go('/onboarding?intent=entry');
                  },
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.approveColor,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 18,
                    ),
                  ),
                  icon: const Icon(Icons.play_arrow_rounded),
                  label: const Text('Open Interactive Demo'),
                ),
                OutlinedButton.icon(
                  onPressed: kIsWeb
                      ? _openWebsiteSignIn
                      : () => context.go('/auth'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: BorderSide(color: Colors.white.withAlpha(40)),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 18,
                    ),
                  ),
                  icon: const Icon(Icons.lock_open_rounded),
                  label: Text(kIsWeb ? 'Continue with Google' : 'Sign In'),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: const [
                _MetricChip(
                  value: '1',
                  label: 'workflow from angle to publish',
                ),
                _MetricChip(
                  value: '3',
                  label: 'setup steps before first workspace',
                ),
                _MetricChip(
                  value: '7',
                  label: 'publishing channels already modeled',
                ),
              ],
            ),
          ],
        );

        if (compact) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [left, const SizedBox(height: 24), stateCard],
          );
        }

        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(flex: 6, child: left),
            const SizedBox(width: 24),
            Expanded(flex: 5, child: stateCard),
          ],
        );
      },
    );
  }

  Widget _buildProofStrip() {
    const items = [
      'Repo-aware onboarding instead of blank-prompt setup',
      'Narrative ritual plus personas before generation',
      'Swipe approval flow tied to real publish actions',
      'Demo workspace available without sales call',
    ];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(8),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withAlpha(16)),
      ),
      child: Wrap(
        spacing: 12,
        runSpacing: 12,
        children: items
            .map(
              (item) =>
                  _pill(icon: Icons.check_circle_outline_rounded, label: item),
            )
            .toList(),
      ),
    );
  }

  Widget _buildPainVsFlow() {
    return LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxWidth < 900;
        final withoutCard = _comparisonCard(
          title: 'Without ContentFlow',
          accent: AppTheme.rejectColor,
          items: const [
            'You explain your product from scratch in every prompt.',
            'Ideas, drafts, and publishing live in separate tools.',
            'The team loses momentum between generation and approval.',
            'Publishing still depends on manual copy-paste.',
          ],
        );
        final withCard = _comparisonCard(
          title: 'With ContentFlow',
          accent: AppTheme.approveColor,
          items: const [
            'Your workspace starts from a real repo and a real content plan.',
            'Rituals and personas sharpen the angle before generation.',
            'Drafts are reviewed with one approval workflow.',
            'Publishing, scheduling, and channel readiness stay visible.',
          ],
        );

        if (compact) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [withoutCard, const SizedBox(height: 20), withCard],
          );
        }
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: withoutCard),
            const SizedBox(width: 20),
            Expanded(child: withCard),
          ],
        );
      },
    );
  }

  Widget _buildHowItWorks() {
    const steps = [
      (
        '1. Connect the product context',
        'Start with your repo, project name, and content mix so the app works from actual context.',
      ),
      (
        '2. Shape the narrative',
        'Capture rituals, personas, and angles before asking the model for drafts.',
      ),
      (
        '3. Review and publish',
        'Approve, edit, schedule, and publish content from one queue instead of bouncing across tools.',
      ),
    ];

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF121A2B),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withAlpha(18)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'How the workflow actually works',
            style: TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'The promise is not "AI writes for you". The promise is a tighter system from source material to published output.',
            style: TextStyle(
              color: Colors.white.withAlpha(150),
              fontSize: 15,
              height: 1.6,
            ),
          ),
          const SizedBox(height: 20),
          LayoutBuilder(
            builder: (context, constraints) {
              final cardWidth = constraints.maxWidth < 700
                  ? constraints.maxWidth
                  : 320.0;
              return Wrap(
                spacing: 16,
                runSpacing: 16,
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
        'Onboarding that creates a plan',
        'Project, repo, formats, and cadence are captured before generation starts.',
        Icons.rocket_launch_outlined,
        AppTheme.approveColor,
      ),
      (
        'Angles from persona context',
        'The app uses ritual and persona inputs to propose more relevant content directions.',
        Icons.psychology_alt_outlined,
        AppTheme.editColor,
      ),
      (
        'Approval-first feed',
        'Operators can swipe through content decisions quickly instead of managing a cluttered queue.',
        Icons.swipe_outlined,
        Colors.orange,
      ),
      (
        'Publishing visibility',
        'Channel connections, scheduling state, and publish results stay attached to the workflow.',
        Icons.publish_outlined,
        AppTheme.approveColor,
      ),
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        final cardWidth = constraints.maxWidth < 750
            ? constraints.maxWidth
            : 350.0;
        return Wrap(
          spacing: 16,
          runSpacing: 16,
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

  Widget _buildFaqSection() {
    final items = [
      (
        'Why not just use ChatGPT?',
        'Because the hard part is not getting text. The hard part is preserving product context, deciding what to say next, and moving approved drafts into publishing without friction.',
      ),
      (
        'What makes the demo useful?',
        'The demo is a stable public workspace, so visitors can inspect the workflow end-to-end before creating their own workspace.',
      ),
      (
        'Is this only for social posts?',
        'No. The product already models blog posts, newsletters, social posts, video scripts, and short-form video content.',
      ),
    ];

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(8),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withAlpha(16)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Common objections',
            style: TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 16),
          ...items.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: _faqItem(question: item.$1, answer: item.$2),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomCta(BuildContext context, WidgetRef ref) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF121A2B),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withAlpha(16)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'See the workflow before you commit',
            style: TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Start with the stable demo workspace to inspect the flow, then create your own workspace when you are ready to connect a real product.',
            style: TextStyle(
              color: Colors.white.withAlpha(150),
              fontSize: 15,
              height: 1.6,
            ),
          ),
          const SizedBox(height: 20),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              FilledButton(
                onPressed: () {
                  ref.read(authSessionProvider.notifier).signInDemo();
                  context.go('/onboarding?intent=entry');
                },
                style: FilledButton.styleFrom(
                  backgroundColor: AppTheme.approveColor,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 18,
                  ),
                ),
                child: const Text('Open Demo Workspace'),
              ),
              OutlinedButton(
                onPressed: kIsWeb
                    ? _openWebsiteSignIn
                    : () => context.go('/auth'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white,
                  side: BorderSide(color: Colors.white.withAlpha(35)),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 18,
                  ),
                ),
                child: Text(kIsWeb ? 'Continue with Google' : 'Sign In'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStateCard(
    BuildContext context,
    WidgetRef ref,
    AuthSession authSession,
    AsyncValue<dynamic> bootstrap,
  ) {
    if (authSession.isLoading) {
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

    if (authSession.status == AuthStatus.authenticated && bootstrap.isLoading) {
      return _card(
        eyebrow: 'Checking session',
        title: 'Loading your workspace',
        description:
            'The app is validating your session and loading your workspace from FastAPI.',
        icon: Icons.sync_rounded,
        accent: AppTheme.editColor,
        primaryLabel: 'Please wait',
        onPrimary: null,
        secondaryLabel: 'Sign out',
        onSecondary: () => ref.read(authSessionProvider.notifier).signOut(),
        extra: kIsWeb ? _buildWebRuntimeDiagnostics(authSession) : null,
      );
    }

    if (authSession.status == AuthStatus.authenticated && bootstrap.hasError) {
      final apiError = _extractApiException(bootstrap.error);
      final isUnauthorized = apiError?.isUnauthorized == true;
      final title = isUnauthorized
          ? 'Reconnect your account'
          : 'Continue to workspace setup';
      final description = isUnauthorized
          ? 'Your Clerk session reached the app, but FastAPI rejected the bootstrap request. Sign in again to refresh the bearer token.'
          : 'Your Clerk session is active, but FastAPI did not return a usable workspace bootstrap. Continue to onboarding to create or recover the workspace instead of being blocked on entry.';

      return _card(
        eyebrow: 'Session error',
        title: title,
        description: description,
        icon: Icons.warning_amber_rounded,
        accent: Colors.orange,
        primaryLabel: isUnauthorized
            ? (kIsWeb ? 'Continue with Google' : 'Sign In Again')
            : 'Continue Onboarding',
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
          context.go('/onboarding?intent=entry');
        },
        secondaryLabel: isUnauthorized ? 'Open Demo Workspace' : 'Sign out',
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
          ref.read(authSessionProvider.notifier).signOut();
        },
        caption: 'Bootstrap error: ${_bootstrapErrorSummary(bootstrap.error)}',
        extra: kIsWeb ? _buildWebRuntimeDiagnostics(authSession) : null,
      );
    }

    final bootstrapData = bootstrap.valueOrNull;
    final onboardingDone = authSession.isAuthenticated
        ? (bootstrapData?.shouldOnboard == false)
        : authSession.onboardingComplete;

    if (authSession.isSignedIn && onboardingDone) {
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
      );
    }

    if (authSession.isSignedIn && !onboardingDone) {
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
      );
    }

    return _card(
      eyebrow: 'Logged out',
      title: 'Create or reconnect your workspace',
      description: kIsWeb
          ? 'You are not signed in yet. Continue with Google on the dedicated app-domain Clerk page, then Clerk will return you straight to this app.'
          : 'You are not signed in yet. The Flutter beta auth path has been archived, so use the dedicated web sign-in flow instead.',
      icon: Icons.lock_outline_rounded,
      accent: Colors.orange,
      primaryLabel: kIsWeb ? 'Continue with Google' : 'Sign In',
      onPrimary: kIsWeb ? _openWebsiteSignIn : () => context.go('/auth'),
      secondaryLabel: kIsWeb ? 'Open App Entry' : 'Open Demo Workspace',
      onSecondary: kIsWeb
          ? _openWebsiteLaunch
          : () {
              ref.read(authSessionProvider.notifier).signInDemo();
              context.go(
            authSession.onboardingComplete
                ? '/feed'
                : '/onboarding?intent=entry',
              );
            },
      caption: kIsWeb
          ? 'The stable path is now ClerkJS on `app.contentflow.winflowz.com/sign-in`, with a standard OAuth callback on `/sso-callback`.'
          : 'The demo uses one fixed public repository and pre-generated content so every visitor sees the same stable workspace. The old Flutter beta auth path now lives only in the legacy branch.',
      extra: kIsWeb ? _buildWebRuntimeDiagnostics(authSession) : null,
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
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: const Color(0xFF121A2B),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withAlpha(20)),
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
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: accent.withAlpha(30),
              borderRadius: BorderRadius.circular(18),
            ),
            child: Icon(icon, color: accent, size: 28),
          ),
          const SizedBox(height: 20),
          Text(
            eyebrow.toUpperCase(),
            style: TextStyle(
              color: accent,
              fontSize: 12,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.4,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 28,
              fontWeight: FontWeight.bold,
              height: 1.15,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            description,
            style: TextStyle(
              color: Colors.white.withAlpha(150),
              fontSize: 15,
              height: 1.5,
            ),
          ),
          if (caption != null) ...[
            const SizedBox(height: 12),
            Text(
              caption,
              style: TextStyle(
                color: Colors.white.withAlpha(110),
                fontSize: 12,
                height: 1.5,
              ),
            ),
          ],
          if (extra case final extraWidget?) ...[extraWidget],
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: onPrimary,
              style: FilledButton.styleFrom(
                backgroundColor: accent,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: Text(primaryLabel),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: onSecondary,
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.white70,
                side: BorderSide(color: Colors.white.withAlpha(35)),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: Text(secondaryLabel),
            ),
          ),
        ],
      ),
    );
  }

  Widget _pill({required IconData icon, required String label}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(10),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white.withAlpha(18)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white70, size: 16),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              label,
              style: TextStyle(
                color: Colors.white.withAlpha(190),
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _comparisonCard({
    required String title,
    required Color accent,
    required List<String> items,
  }) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF121A2B),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: accent.withAlpha(90)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 16),
          ...items.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.circle, color: accent, size: 10),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      item,
                      style: TextStyle(
                        color: Colors.white.withAlpha(155),
                        fontSize: 15,
                        height: 1.5,
                      ),
                    ),
                  ),
                ],
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
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF121A2B),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withAlpha(16)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: accent.withAlpha(26),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: accent),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            description,
            style: TextStyle(
              color: Colors.white.withAlpha(145),
              fontSize: 14,
              height: 1.55,
            ),
          ),
        ],
      ),
    );
  }

  Widget _faqItem({required String question, required String answer}) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFF121A2B),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white.withAlpha(16)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            question,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 17,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            answer,
            style: TextStyle(
              color: Colors.white.withAlpha(145),
              fontSize: 14,
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
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(8),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white.withAlpha(16)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(width: 10),
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withAlpha(150),
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

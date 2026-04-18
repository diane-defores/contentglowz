import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/app_config.dart';
import '../../../data/models/auth_session.dart';
import '../../../providers/providers.dart';
import '../../theme/app_theme.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  late final TextEditingController _emailController;
  late final TextEditingController _passwordController;
  bool _isSubmitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController();
    _passwordController = TextEditingController();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final hasClerkKey = AppConfig.clerkPublishableKey.isNotEmpty;
    final authSession = ref.watch(authSessionProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Authentication')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: const Color(0xFF121A2B),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: Colors.white.withAlpha(20)),
              ),
              child: hasClerkKey
                  ? _buildForm(authSession)
                  : _buildConfigMissing(authSession),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildConfigMissing(AuthSession authSession) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        const Text(
          'Clerk is not configured',
          style: TextStyle(
            color: Colors.white,
            fontSize: 28,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'Set `CLERK_PUBLISHABLE_KEY` with `--dart-define` to enable the production ClerkJS sign-in flow on the app domain.',
          style: TextStyle(
            color: Colors.white.withAlpha(150),
            fontSize: 15,
            height: 1.5,
          ),
        ),
        const SizedBox(height: 20),
        _buildRuntimeDiagnostics(
          hasClerkKey: false,
          authSession: authSession,
          error: _error,
        ),
      ],
    );
  }

  Widget _buildForm(AuthSession authSession) {
    if (kIsWeb) {
      return _buildWebRedirectState(authSession);
    }

    return _buildNativeCustomState(authSession);
  }

  Widget _buildNativeCustomState(AuthSession authSession) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        const Text(
          'Use the web sign-in flow',
          style: TextStyle(
            color: Colors.white,
            fontSize: 28,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'The Clerk Flutter beta SDK has been removed from the production path. For now, sign in through the dedicated web Google flow instead of the old embedded Flutter flow.',
          style: TextStyle(
            color: Colors.white.withAlpha(150),
            fontSize: 15,
            height: 1.5,
          ),
        ),
        const SizedBox(height: 16),
        _buildRuntimeDiagnostics(
          hasClerkKey: true,
          authSession: authSession,
          error: _error,
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: _isSubmitting ? null : _openAppWebSignIn,
            child: const Text('Continue with Google'),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: _isSubmitting ? null : _openAppWebEntry,
            child: const Text('Open App Entry'),
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'Once Clerk ships a stable Flutter SDK, the archived beta branch can be revisited. Until then, production auth stays on the official ClerkJS web path.',
          style: TextStyle(
            color: Colors.white.withAlpha(120),
            fontSize: 12,
            height: 1.4,
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: TextButton(
            onPressed: _isSubmitting ? null : _clearLocalSession,
            child: const Text('Clear Local Clerk Session'),
          ),
        ),
      ],
    );
  }

  Widget _buildWebRedirectState(AuthSession authSession) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        const Text(
          'Sign in with Google',
          style: TextStyle(
            color: Colors.white,
            fontSize: 28,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'ContentFlow web authentication now uses the official Clerk JavaScript SDK directly on the app domain. The old site handoff and the Flutter beta SDK are no longer the primary path.',
          style: TextStyle(
            color: Colors.white.withAlpha(150),
            fontSize: 15,
            height: 1.5,
          ),
        ),
        const SizedBox(height: 16),
        _buildRuntimeDiagnostics(
          hasClerkKey: true,
          authSession: authSession,
          error: null,
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: _openAppWebSignIn,
            child: const Text('Continue with Google'),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: TextButton(
            onPressed: _openAppWebEntry,
            child: const Text('Already signed in? Open App'),
          ),
        ),
      ],
    );
  }

  Widget _buildRuntimeDiagnostics({
    required bool hasClerkKey,
    required AuthSession authSession,
    required String? error,
  }) {
    final keyPreview = hasClerkKey ? _maskPublishableKey() : 'missing';
    final currentUrl = kIsWeb ? Uri.base.toString() : 'not-web';
    final currentHost = kIsWeb ? Uri.base.host : 'not-web';
    final currentPath = kIsWeb ? Uri.base.path : 'not-web';
    final primaryAuthMode = kIsWeb
        ? 'clerkjs google oauth'
        : 'web ClerkJS auth only';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(8),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withAlpha(14)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Runtime diagnostics',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              TextButton.icon(
                onPressed: () => _copyDiagnostics(
                  hasClerkKey: hasClerkKey,
                  authSession: authSession,
                  error: error,
                ),
                icon: const Icon(Icons.copy_rounded, size: 16),
                label: const Text('Copy'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Build commit: ${AppConfig.buildCommitSha}',
            style: TextStyle(color: Colors.white.withAlpha(150), fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(
            'Build environment: ${AppConfig.buildEnvironment}',
            style: TextStyle(color: Colors.white.withAlpha(150), fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(
            'Build timestamp: ${AppConfig.buildTimestamp}',
            style: TextStyle(color: Colors.white.withAlpha(150), fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(
            'Build mode: ${_buildModeLabel()}',
            style: TextStyle(color: Colors.white.withAlpha(150), fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(
            'Primary auth mode: $primaryAuthMode',
            style: TextStyle(color: Colors.white.withAlpha(150), fontSize: 12),
          ),
          const SizedBox(height: 4),
          const Text(
            'Embedded Clerk UI primary path: disabled',
            style: TextStyle(color: Colors.orange, fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(
            'API_BASE_URL: ${AppConfig.apiBaseUrl}',
            style: TextStyle(color: Colors.white.withAlpha(150), fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(
            'APP_SITE_URL: ${AppConfig.siteUrl}',
            style: TextStyle(color: Colors.white.withAlpha(150), fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(
            'APP_SITE_URL host match: ${_hostMatchLabel(AppConfig.siteUrl)}',
            style: TextStyle(color: Colors.white.withAlpha(120), fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(
            'APP_SITE_URL loops to app host: ${AppConfig.siteUrlPointsToAppHost ? 'yes' : 'no'}',
            style: TextStyle(
              color: AppConfig.siteUrlPointsToAppHost
                  ? Colors.orange.withAlpha(220)
                  : Colors.white.withAlpha(120),
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Effective website URL: ${AppConfig.effectiveSiteUrl}',
            style: TextStyle(color: Colors.white.withAlpha(150), fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(
            'Effective website URL host match: ${_hostMatchLabel(AppConfig.effectiveSiteUrl)}',
            style: TextStyle(color: Colors.white.withAlpha(120), fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(
            'APP_WEB_URL: ${AppConfig.appWebUrl}',
            style: TextStyle(color: Colors.white.withAlpha(150), fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(
            'APP_WEB_URL host match: ${_hostMatchLabel(AppConfig.appWebUrl)}',
            style: TextStyle(color: Colors.white.withAlpha(120), fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(
            'CLERK_PUBLISHABLE_KEY: ${hasClerkKey ? 'configured' : 'missing'}',
            style: TextStyle(
              color: hasClerkKey ? AppTheme.approveColor : Colors.orange,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Key preview: $keyPreview',
            style: TextStyle(color: Colors.white.withAlpha(120), fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(
            'Session state: ${authSession.status.name}',
            style: TextStyle(color: Colors.white.withAlpha(120), fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(
            'Bearer token: ${_maskToken(authSession.bearerToken)}',
            style: TextStyle(color: Colors.white.withAlpha(120), fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(
            'Current URL: $currentUrl',
            style: TextStyle(color: Colors.white.withAlpha(120), fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(
            'Current host: $currentHost',
            style: TextStyle(color: Colors.white.withAlpha(120), fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(
            'Current path: $currentPath',
            style: TextStyle(color: Colors.white.withAlpha(120), fontSize: 12),
          ),
          if (authSession.email != null) ...[
            const SizedBox(height: 4),
            Text(
              'Session email: ${authSession.email}',
              style: TextStyle(
                color: Colors.white.withAlpha(120),
                fontSize: 12,
              ),
            ),
          ],
          if (error != null && error.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              'Last auth error:',
              style: TextStyle(
                color: Colors.orange.withAlpha(220),
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              error,
              style: TextStyle(
                color: Colors.white.withAlpha(130),
                fontSize: 12,
                height: 1.4,
              ),
            ),
          ],
          const SizedBox(height: 8),
          Text(
            'Configured only means the key is present. It does not prove that frontend Clerk and backend JWT validation use the same Clerk project.',
            style: TextStyle(
              color: Colors.white.withAlpha(120),
              fontSize: 12,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  String _maskPublishableKey() {
    final key = AppConfig.clerkPublishableKey;
    if (key.isEmpty) return 'missing';
    if (key.length <= 18) return key;
    return '${key.substring(0, 10)}...${key.substring(key.length - 5)} (len=${key.length})';
  }

  String _maskToken(String? value) {
    if (value == null || value.isEmpty) return 'none';
    if (value.length <= 14) return value;
    return '${value.substring(0, 8)}...${value.substring(value.length - 4)}';
  }

  String _buildModeLabel() {
    if (kReleaseMode) return 'release';
    if (kProfileMode) return 'profile';
    return 'debug';
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

  Future<void> _copyDiagnostics({
    required bool hasClerkKey,
    required AuthSession authSession,
    required String? error,
  }) async {
    final primaryAuthMode = kIsWeb
        ? 'clerkjs google oauth'
        : 'web ClerkJS auth only';
    final lines = [
      'ContentFlow auth diagnostics',
      'Build commit: ${AppConfig.buildCommitSha}',
      'Build environment: ${AppConfig.buildEnvironment}',
      'Build timestamp: ${AppConfig.buildTimestamp}',
      'Build mode: ${_buildModeLabel()}',
      'Primary auth mode: $primaryAuthMode',
      'Embedded Clerk UI primary path: disabled',
      'API_BASE_URL: ${AppConfig.apiBaseUrl}',
      'APP_SITE_URL: ${AppConfig.siteUrl}',
      'APP_SITE_URL host match: ${_hostMatchLabel(AppConfig.siteUrl)}',
      'APP_SITE_URL loops to app host: ${AppConfig.siteUrlPointsToAppHost ? 'yes' : 'no'}',
      'Effective website URL: ${AppConfig.effectiveSiteUrl}',
      'Effective website URL host match: ${_hostMatchLabel(AppConfig.effectiveSiteUrl)}',
      'APP_WEB_URL: ${AppConfig.appWebUrl}',
      'APP_WEB_URL host match: ${_hostMatchLabel(AppConfig.appWebUrl)}',
      'CLERK_PUBLISHABLE_KEY: ${hasClerkKey ? 'configured' : 'missing'}',
      'Key preview: ${hasClerkKey ? _maskPublishableKey() : 'missing'}',
      'Session state: ${authSession.status.name}',
      'Session email: ${authSession.email ?? 'none'}',
      'Bearer token: ${_maskToken(authSession.bearerToken)}',
      'Current URL: ${kIsWeb ? Uri.base.toString() : 'not-web'}',
      'Current host: ${kIsWeb ? Uri.base.host : 'not-web'}',
      'Current path: ${kIsWeb ? Uri.base.path : 'not-web'}',
      'Last auth error: ${error == null || error.isEmpty ? 'none' : error}',
    ];

    await Clipboard.setData(ClipboardData(text: lines.join('\n')));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Diagnostics copied to clipboard.')),
    );
  }

  Future<void> _clearLocalSession() async {
    setState(() {
      _error = null;
      _isSubmitting = true;
    });

    try {
      await ref.read(authSessionProvider.notifier).clearLocalSession();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Local Clerk session cleared. Try signing in again.'),
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  String _friendlyAuthError(Object error) {
    final raw = error.toString().replaceFirst('Exception: ', '').trim();
    final lower = raw.toLowerCase();

    if (lower.contains('invalid base64') || lower.contains('base64')) {
      return 'The Clerk token returned to the app is malformed. This usually means a frontend/backend Clerk mismatch or a corrupted local session. Clear the local session and verify that the app key and backend Clerk issuer belong to the same Clerk project.';
    }

    if (lower.contains('invalid clerk token') ||
        lower.contains('failed to validate clerk token') ||
        lower.contains('missing bearer token') ||
        lower.contains('issuer')) {
      return 'Clerk authentication reached the backend, but the backend rejected the token. Check that `CLERK_PUBLISHABLE_KEY` in the app and `CLERK_JWT_ISSUER` or `CLERK_JWKS_URL` in FastAPI point to the same Clerk project.';
    }

    if (lower.contains('oauth') && lower.contains('google')) {
      return 'Google sign-in is handled on the dedicated ClerkJS route. Continue on the app sign-in page instead of relying on the old embedded Flutter path.';
    }

    if (lower.contains('not configured')) {
      return 'Clerk is missing from runtime config. Rebuild the app with a valid `CLERK_PUBLISHABLE_KEY`.';
    }

    return raw;
  }

  Future<void> _submitCustomSignIn() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      setState(() {
        _error = 'Enter both email and password to sign in.';
      });
      return;
    }

    setState(() {
      _isSubmitting = true;
      _error = null;
    });

    try {
      await ref
          .read(authSessionProvider.notifier)
          .signInWithPassword(email: email, password: password);
      if (!mounted) return;
      context.go('/entry');
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = _friendlyAuthError(error);
      });
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  Future<void> _openWebsiteSignIn() async {
    await _openAppWebSignIn();
  }

  Future<void> _openAppWebSignIn() async {
    final url = kIsWeb
        ? Uri.parse('${Uri.base.origin}/sign-in')
        : Uri.parse('${AppConfig.appWebUrl}/sign-in');
    await launchUrl(url, mode: LaunchMode.platformDefault);
  }

  Future<void> _openAppWebEntry() async {
    final url = kIsWeb
        ? Uri.parse('${Uri.base.origin}/#/entry')
        : Uri.parse('${AppConfig.appWebUrl}/#/entry');
    await launchUrl(url, mode: LaunchMode.platformDefault);
  }
}

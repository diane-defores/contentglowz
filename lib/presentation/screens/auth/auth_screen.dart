import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/app_config.dart';
import '../../../core/app_diagnostics.dart';
import '../../../data/models/auth_session.dart';
import '../../../providers/providers.dart';
import '../../widgets/app_error_view.dart';

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
          error: _error ?? 'Clerk is missing from runtime config.',
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
        if (_error != null && _error!.isNotEmpty) ...[
          _buildRuntimeDiagnostics(
            hasClerkKey: true,
            authSession: authSession,
            error: _error,
          ),
          const SizedBox(height: 24),
        ],
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
    return AppErrorView(
      scope: hasClerkKey ? 'auth.runtime' : 'auth.config_missing',
      title: hasClerkKey ? 'Authentication error' : 'Clerk is not configured',
      message: error,
      compact: true,
      showIcon: !hasClerkKey || (error != null && error.isNotEmpty),
      copyLabel: 'Copy diagnostics',
      helperText: hasClerkKey
          ? 'Copy this report and send it back with the error message above.'
          : 'Rebuild the app with a valid CLERK_PUBLISHABLE_KEY to enable the Clerk web flow.',
      contextData: {
        'hasClerkKey': hasClerkKey,
        'sessionState': authSession.status.name,
        'sessionEmail': authSession.email ?? 'none',
        'appWebUrl': AppConfig.appWebUrl,
        'siteUrl': AppConfig.siteUrl,
        'apiBaseUrl': AppConfig.apiBaseUrl,
        'currentPath': kIsWeb ? Uri.base.path : 'not-web',
      },
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
    } catch (error, stackTrace) {
      ref.read(appDiagnosticsProvider).error(
        scope: 'auth.inline_sign_in',
        message: 'Inline sign-in failed.',
        error: error,
        stackTrace: stackTrace,
        context: {'email': email},
      );
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

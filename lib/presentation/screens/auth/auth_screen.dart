import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

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
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isSignUp = false;
  bool _isSubmitting = false;
  String? _error;

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
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
                  ? _buildForm(context, authSession)
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
          'Set `CLERK_PUBLISHABLE_KEY` with `--dart-define` to enable real sign in and sign up.',
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

  Widget _buildForm(BuildContext context, AuthSession authSession) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          _isSignUp ? 'Create your account' : 'Sign in to your workspace',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 28,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          _isSignUp
              ? 'Create a Clerk account and reconnect it to your existing workspace.'
              : 'Use your Clerk credentials to recover your account and workspace data.',
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
        if (_isSignUp) ...[
          TextField(
            controller: _firstNameController,
            decoration: const InputDecoration(labelText: 'First name'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _lastNameController,
            decoration: const InputDecoration(labelText: 'Last name'),
          ),
          const SizedBox(height: 12),
        ],
        TextField(
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(labelText: 'Email'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _passwordController,
          obscureText: true,
          decoration: const InputDecoration(labelText: 'Password'),
        ),
        if (_error != null) ...[
          const SizedBox(height: 16),
          Text(_error!, style: const TextStyle(color: Colors.redAccent)),
        ],
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: _isSubmitting ? null : _submit,
            style: FilledButton.styleFrom(
              backgroundColor: AppTheme.approveColor,
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            child: Text(
              _isSubmitting
                  ? 'Please wait...'
                  : (_isSignUp ? 'Create Account' : 'Sign In'),
            ),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: _isSubmitting
                ? null
                : () => setState(() {
                    _isSignUp = !_isSignUp;
                    _error = null;
                  }),
            child: Text(
              _isSignUp
                  ? 'Already have an account? Sign in'
                  : 'Need an account? Sign up',
            ),
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

  Widget _buildRuntimeDiagnostics({
    required bool hasClerkKey,
    required AuthSession authSession,
    required String? error,
  }) {
    final keyPreview = hasClerkKey ? _maskPublishableKey() : 'missing';

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
            'API_BASE_URL: ${AppConfig.apiBaseUrl}',
            style: TextStyle(
              color: Colors.white.withAlpha(150),
              fontSize: 12,
            ),
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
            style: TextStyle(
              color: Colors.white.withAlpha(120),
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Session state: ${authSession.status.name}',
            style: TextStyle(
              color: Colors.white.withAlpha(120),
              fontSize: 12,
            ),
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
          const SizedBox(height: 8),
          Text(
            'For browser debugging, open /entry?eruda=1 once to enable the Eruda console.',
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
    if (key.length <= 12) return key;
    return '${key.substring(0, 7)}...${key.substring(key.length - 4)}';
  }

  Future<void> _copyDiagnostics({
    required bool hasClerkKey,
    required AuthSession authSession,
    required String? error,
  }) async {
    final lines = [
      'ContentFlowz auth diagnostics',
      'API_BASE_URL: ${AppConfig.apiBaseUrl}',
      'CLERK_PUBLISHABLE_KEY: ${hasClerkKey ? 'configured' : 'missing'}',
      'Key preview: ${hasClerkKey ? _maskPublishableKey() : 'missing'}',
      'Session state: ${authSession.status.name}',
      'Session email: ${authSession.email ?? 'none'}',
      'Last auth error: ${error == null || error.isEmpty ? 'none' : error}',
      'Eruda enabled from: /entry?eruda=1',
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
      return 'The Clerk token returned to the app is malformed. This usually means a frontend/backend Clerk mismatch or a corrupted local session, not a wrong password. Clear the local session and verify that the app key and backend Clerk issuer belong to the same Clerk project.';
    }

    if (lower.contains('invalid clerk token') ||
        lower.contains('failed to validate clerk token') ||
        lower.contains('missing bearer token') ||
        lower.contains('issuer')) {
      return 'Clerk authentication reached the backend, but the backend rejected the token. Check that `CLERK_PUBLISHABLE_KEY` in the app and `CLERK_JWT_ISSUER` or `CLERK_JWKS_URL` in FastAPI point to the same Clerk project.';
    }

    if (lower.contains('password') &&
        (lower.contains('invalid') || lower.contains('incorrect'))) {
      return 'The email/password pair looks invalid. If you do not remember the password, reset it in Clerk instead of checking the app database.';
    }

    if (lower.contains('extra verification step')) {
      return 'Sign-up reached Clerk, but the app does not handle Clerk verification yet. Use sign-in with an existing account or add the Clerk verification flow.';
    }

    if (lower.contains('not configured')) {
      return 'Clerk is missing from runtime config. Rebuild the app with a valid `CLERK_PUBLISHABLE_KEY`.';
    }

    return raw;
  }

  Future<void> _submit() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    if (email.isEmpty || password.isEmpty) {
      setState(() {
        _error = 'Email and password are required.';
      });
      return;
    }

    setState(() {
      _isSubmitting = true;
      _error = null;
    });

    try {
      final auth = ref.read(authSessionProvider.notifier);
      if (_isSignUp) {
        await auth.signUpWithPassword(
          email: email,
          password: password,
          firstName: _firstNameController.text.trim().isEmpty
              ? null
              : _firstNameController.text.trim(),
          lastName: _lastNameController.text.trim().isEmpty
              ? null
              : _lastNameController.text.trim(),
        );
      } else {
        await auth.signInWithPassword(email: email, password: password);
      }

      if (!mounted) return;
      context.go('/entry');
    } catch (error) {
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
}

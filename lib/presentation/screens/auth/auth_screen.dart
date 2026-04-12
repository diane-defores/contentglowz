import 'dart:async';

import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/app_config.dart';
import '../../../data/models/auth_session.dart';
import '../../../data/services/clerk_auth_service.dart';
import '../../../main.dart';
import '../../../providers/providers.dart';
import '../../theme/app_theme.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  late final ClerkAuthConfig _clerkConfig;
  bool _isSubmitting = false;
  String? _error;
  String? _lastSyncedSessionId;

  @override
  void initState() {
    super.initState();
    _clerkConfig = ClerkAuthConfig(
      publishableKey: AppConfig.clerkPublishableKey,
      persistor: SharedPreferencesPersistor(ref.read(sharedPrefsProvider)),
    );
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
    return ClerkAuth(
      config: _clerkConfig,
      child: ClerkErrorListener(
        handler: (context, error) async {
          setState(() {
            _error = _friendlyAuthError(error);
          });
        },
        child: ClerkAuthBuilder(
          signedInBuilder: (context, authState) {
            unawaited(_syncFromClerkIfNeeded(authState));
            return _buildSyncingState(authSession);
          },
          signedOutBuilder: (context, authState) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Sign in to your workspace',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Use Clerk to sign in with your password manager, Google, or any provider enabled in your Clerk dashboard.',
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
                Theme(
                  data: Theme.of(context).copyWith(
                    extensions: [Theme.of(context).clerkThemeExtension],
                  ),
                  child: const ClerkAuthentication(),
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
          },
        ),
      ),
    );
  }

  Widget _buildSyncingState(AuthSession authSession) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        const Text(
          'Finalizing session',
          style: TextStyle(
            color: Colors.white,
            fontSize: 28,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'Clerk accepted your sign-in. The app is now syncing the bearer token and workspace session.',
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
        const Center(child: CircularProgressIndicator()),
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
            'If Google does not appear, enable the Google social connection in the same Clerk instance as this publishable key.',
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
      'ContentFlow auth diagnostics',
      'API_BASE_URL: ${AppConfig.apiBaseUrl}',
      'CLERK_PUBLISHABLE_KEY: ${hasClerkKey ? 'configured' : 'missing'}',
      'Key preview: ${hasClerkKey ? _maskPublishableKey() : 'missing'}',
      'Session state: ${authSession.status.name}',
      'Session email: ${authSession.email ?? 'none'}',
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
      _lastSyncedSessionId = null;
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
      return 'Google sign-in did not complete. Verify that Google is enabled in Clerk for this exact publishable key and that the Clerk instance allows the callback used by the app.';
    }

    if (lower.contains('not configured')) {
      return 'Clerk is missing from runtime config. Rebuild the app with a valid `CLERK_PUBLISHABLE_KEY`.';
    }

    return raw;
  }

  Future<void> _syncFromClerkIfNeeded(ClerkAuthState authState) async {
    final sessionId = authState.session?.id;
    if (sessionId == null ||
        sessionId == _lastSyncedSessionId ||
        _isSubmitting) {
      return;
    }

    setState(() {
      _isSubmitting = true;
      _error = null;
    });

    try {
      await ref.read(authSessionProvider.notifier).syncFromClerkSession();
      _lastSyncedSessionId = sessionId;
      if (!mounted) return;
      context.go('/entry');
    } catch (error) {
      if (mounted) {
        setState(() {
          _error = _friendlyAuthError(error);
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }
}

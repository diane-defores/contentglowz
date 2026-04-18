import 'dart:html' as html;
import 'dart:js_util' as js_util;

import 'package:shared_preferences/shared_preferences.dart';

class ClerkAuthResult {
  final String bearerToken;
  final String userId;
  final String? email;

  const ClerkAuthResult({
    required this.bearerToken,
    required this.userId,
    this.email,
  });
}

class ClerkAuthService {
  ClerkAuthService({
    required this.publishableKey,
    required this.sharedPreferences,
  });

  final String publishableKey;
  final SharedPreferences sharedPreferences;

  Future<ClerkAuthResult> signInWithPassword({
    required String email,
    required String password,
  }) async {
    throw StateError(
      'Password auth through the Flutter beta SDK has been removed from web production. '
      'Use the dedicated ClerkJS sign-in route instead.',
    );
  }

  Future<ClerkAuthResult> signUpWithPassword({
    required String email,
    required String password,
    String? firstName,
    String? lastName,
  }) async {
    throw StateError(
      'Sign-up through the Flutter beta SDK has been removed from web production. '
      'Use the dedicated ClerkJS sign-in route instead.',
    );
  }

  Future<void> signOut() async {
    final bridge = await _loadBridge();
    await _promiseToFuture(js_util.callMethod<Object?>(bridge, 'signOut', []));
  }

  Future<ClerkAuthResult?> restoreSession() async {
    final bridge = await _loadBridge();
    final signedIn = await _promiseToFuture<bool>(
      js_util.callMethod<Object?>(bridge, 'isSignedIn', []),
    );
    if (!signedIn) {
      return null;
    }

    final token = await getFreshToken();
    if (token == null || token.isEmpty) {
      return null;
    }

    final user = await _promiseToFuture<Object?>(
      js_util.callMethod<Object?>(bridge, 'getUser', []),
    );
    final userMap = _mapFromJs(user);
    final userId = userMap['id']?.toString() ?? '';
    if (userId.isEmpty) {
      throw StateError('ClerkJS did not return a user id.');
    }

    return ClerkAuthResult(
      bearerToken: token,
      userId: userId,
      email: userMap['primaryEmailAddress']?.toString(),
    );
  }

  Future<String?> getFreshToken({bool skipCache = false}) async {
    final bridge = await _loadBridge();
    final token = await _promiseToFuture<Object?>(
      js_util.callMethod<Object?>(
        bridge,
        'getToken',
        [js_util.jsify({'skipCache': skipCache})],
      ),
    );
    final value = token?.toString();
    if (value == null || value.isEmpty || value == 'null') {
      return null;
    }
    return value;
  }

  void terminate() {}

  Future<Object> _loadBridge() async {
    final bridge = js_util.getProperty<Object?>(html.window, 'contentflowClerkBridge');
    if (bridge == null) {
      throw StateError(
        'ClerkJS bridge is missing from the web runtime. '
        'Make sure clerk-runtime.js is bundled into build/web.',
      );
    }

    await _promiseToFuture(js_util.callMethod<Object?>(bridge, 'load', []));
    return bridge;
  }

  Future<T> _promiseToFuture<T>(Object? promise) {
    if (promise == null) {
      return Future<T>.error(
        StateError('ClerkJS bridge returned no value.'),
      );
    }
    return js_util.promiseToFuture<T>(promise);
  }

  Map<String, dynamic> _mapFromJs(Object? value) {
    if (value == null) {
      return const <String, dynamic>{};
    }

    final dartValue = js_util.dartify(value);
    if (dartValue is Map) {
      return Map<String, dynamic>.from(dartValue);
    }
    return const <String, dynamic>{};
  }
}

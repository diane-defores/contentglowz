import 'package:clerk_auth/clerk_auth.dart';
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
  Auth? _auth;

  Future<Auth> _client() async {
    final existing = _auth;
    if (existing != null) {
      return existing;
    }

    final auth = Auth(
      config: AuthConfig(
        publishableKey: publishableKey,
        persistor: SharedPreferencesPersistor(sharedPreferences),
      ),
    );
    await auth.initialize();
    _auth = auth;
    return auth;
  }

  Future<ClerkAuthResult> signInWithPassword({
    required String email,
    required String password,
  }) async {
    final auth = await _client();
    await auth.attemptSignIn(
      strategy: Strategy.password,
      identifier: email,
      password: password,
    );

    if (!auth.isSignedIn) {
      throw StateError('Clerk did not create an active session.');
    }

    return _resultFromAuth(auth);
  }

  Future<ClerkAuthResult> signUpWithPassword({
    required String email,
    required String password,
    String? firstName,
    String? lastName,
  }) async {
    final auth = await _client();
    await auth.attemptSignUp(
      strategy: Strategy.password,
      emailAddress: email,
      password: password,
      passwordConfirmation: password,
      firstName: firstName,
      lastName: lastName,
      legalAccepted: true,
    );

    if (!auth.isSignedIn) {
      throw StateError(
        'Clerk sign-up requires an extra verification step that is not completed yet in the app.',
      );
    }

    return _resultFromAuth(auth);
  }

  Future<void> signOut() async {
    final auth = _auth;
    if (auth == null) {
      return;
    }
    await auth.signOut();
  }

  Future<ClerkAuthResult?> restoreSession() async {
    final auth = await _client();
    if (!auth.isSignedIn) {
      return null;
    }

    return _resultFromAuth(auth);
  }

  void terminate() {
    _auth?.terminate();
    _auth = null;
  }

  Future<ClerkAuthResult> _resultFromAuth(Auth auth) async {
    final sessionToken = await auth.sessionToken();
    final tokenJson = sessionToken.toJson();
    final bearerToken =
        (tokenJson['jwt'] ??
                tokenJson['token'] ??
                tokenJson['session_token'] ??
                tokenJson['value'])
            ?.toString();

    if (bearerToken == null || bearerToken.isEmpty) {
      throw StateError('Unable to extract Clerk session token.');
    }

    final user = auth.user;
    final userJson = user?.toJson() ?? const <String, dynamic>{};
    final userId = (userJson['id'] ?? auth.session?.user.id ?? '').toString();
    final email = _extractPrimaryEmail(userJson);

    if (userId.isEmpty) {
      throw StateError('Unable to extract Clerk user id.');
    }

    return ClerkAuthResult(
      bearerToken: bearerToken,
      userId: userId,
      email: email,
    );
  }

  String? _extractPrimaryEmail(Map<String, dynamic> userJson) {
    final primaryEmailId = userJson['primaryEmailAddressId'];
    final emails = userJson['emailAddresses'];
    if (emails is! List) {
      return null;
    }

    for (final entry in emails) {
      if (entry is! Map<String, dynamic>) {
        continue;
      }
      if (entry['id'] == primaryEmailId) {
        return entry['emailAddress']?.toString();
      }
    }

    for (final entry in emails) {
      if (entry is Map<String, dynamic>) {
        final email = entry['emailAddress']?.toString();
        if (email != null && email.isNotEmpty) {
          return email;
        }
      }
    }

    return null;
  }
}

class SharedPreferencesPersistor implements Persistor {
  const SharedPreferencesPersistor(this.sharedPreferences);

  final SharedPreferences sharedPreferences;

  @override
  Future<void> initialize() async {}

  @override
  void terminate() {}

  @override
  Future<T?> read<T>(String key) async {
    final value = sharedPreferences.get(key);
    return value is T ? value : null;
  }

  @override
  Future<void> write<T>(String key, T value) async {
    switch (value) {
      case String stringValue:
        await sharedPreferences.setString(key, stringValue);
      case bool boolValue:
        await sharedPreferences.setBool(key, boolValue);
      case int intValue:
        await sharedPreferences.setInt(key, intValue);
      case double doubleValue:
        await sharedPreferences.setDouble(key, doubleValue);
      case List<String> stringList:
        await sharedPreferences.setStringList(key, stringList);
      default:
        await sharedPreferences.setString(key, value.toString());
    }
  }

  @override
  Future<void> delete(String key) async {
    await sharedPreferences.remove(key);
  }
}

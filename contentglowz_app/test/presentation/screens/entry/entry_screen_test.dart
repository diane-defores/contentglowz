import 'package:contentglowz_app/core/app_diagnostics.dart';
import 'package:contentglowz_app/core/shared_preferences_provider.dart';
import 'package:contentglowz_app/l10n/app_localizations.dart';
import 'package:contentglowz_app/presentation/screens/entry/entry_screen.dart';
import 'package:contentglowz_app/providers/providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('signed-out Android entry exposes interactive demo onboarding', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({});
    final sharedPreferences = await SharedPreferences.getInstance();

    final router = GoRouter(
      initialLocation: '/entry',
      routes: [
        GoRoute(
          path: '/entry',
          builder: (context, state) => const EntryScreen(),
        ),
        GoRoute(
          path: '/onboarding',
          builder: (context, state) => Text(
            'onboarding intent=${state.uri.queryParameters['intent'] ?? ''}',
          ),
        ),
      ],
    );
    addTearDown(router.dispose);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appDiagnosticsProvider.overrideWithValue(AppDiagnostics()),
          sharedPrefsProvider.overrideWithValue(sharedPreferences),
          clerkPublishableKeyProvider.overrideWithValue(''),
        ],
        child: MaterialApp.router(
          locale: const Locale('en'),
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          routerConfig: router,
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Open Interactive Demo'), findsOneWidget);

    await tester.tap(find.text('Open Interactive Demo'));
    await tester.pumpAndSettle();

    expect(find.text('onboarding intent=entry'), findsOneWidget);
    expect(sharedPreferences.getBool('demo_mode_enabled'), isTrue);
    expect(sharedPreferences.getBool('demo_onboarding_complete'), isFalse);
  });
}

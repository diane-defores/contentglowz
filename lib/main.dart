import 'dart:async';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/app_language.dart';
import 'core/app_diagnostics.dart';
import 'core/shared_preferences_provider.dart';
import 'l10n/app_localizations.dart';
import 'providers/providers.dart';
import 'router.dart';
import 'presentation/theme/app_theme.dart';
import 'presentation/widgets/in_app_tour_overlay.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  final diagnostics = AppDiagnostics();

  FlutterError.onError = (details) {
    diagnostics.error(
      scope: 'flutter.framework',
      message: details.exceptionAsString(),
      error: details.exception,
      stackTrace: details.stack,
      context: {
        'library': details.library,
        'context': details.context?.toDescription(),
      },
    );
    FlutterError.presentError(details);
  };

  PlatformDispatcher.instance.onError = (error, stackTrace) {
    diagnostics.error(
      scope: 'flutter.platform_dispatcher',
      message: 'Unhandled platform error.',
      error: error,
      stackTrace: stackTrace,
    );
    return true;
  };

  runZonedGuarded(
    () {
      runApp(
        ProviderScope(
          observers: [AppDiagnosticsObserver(diagnostics)],
          overrides: [
            sharedPrefsProvider.overrideWithValue(prefs),
            appDiagnosticsProvider.overrideWithValue(diagnostics),
          ],
          child: const ContentFlowApp(),
        ),
      );
    },
    (error, stackTrace) {
      diagnostics.error(
        scope: 'dart.zone',
        message: 'Unhandled zone error.',
        error: error,
        stackTrace: stackTrace,
      );
    },
  );
}

class ContentFlowApp extends ConsumerWidget {
  const ContentFlowApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = createAppRouter(ref);
    final localePreference = normalizeAppLanguagePreference(
      ref.watch(appLanguagePreferenceProvider),
    );

    return MaterialApp.router(
      onGenerateTitle: (context) => context.tr('ContentFlow'),
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      routerConfig: router,
      locale: appLocaleFromPreference(localePreference),
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      localeListResolutionCallback: (locales, supportedLocales) =>
          resolveSupportedAppLocale(locales),
      builder: (context, child) {
        return Stack(
          children: [
            ?child,
            const Positioned.fill(child: InAppTourOverlay()),
          ],
        );
      },
    );
  }
}

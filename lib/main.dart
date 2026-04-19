import 'dart:async';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/app_diagnostics.dart';
import 'router.dart';
import 'presentation/theme/app_theme.dart';

/// Provider for SharedPreferences instance
final sharedPrefsProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError('Must be overridden in main');
});

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

    return MaterialApp.router(
      title: 'ContentFlow',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      routerConfig: router,
    );
  }
}

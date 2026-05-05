import 'dart:async';

import 'package:contentflow_app/data/models/capture_asset.dart';
import 'package:contentflow_app/data/services/capture_local_store.dart';
import 'package:contentflow_app/data/services/device_capture_service.dart';
import 'package:contentflow_app/l10n/app_localizations.dart';
import 'package:contentflow_app/presentation/screens/capture/capture_screen.dart';
import 'package:contentflow_app/providers/providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('CaptureScreen shows unsupported state off Android', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final service = _FakeCaptureService(
      support: const CaptureSupport(
        isSupported: false,
        platformLabel: 'ios',
        reason: 'Android device capture is not available on this platform yet.',
      ),
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [activeProjectIdProvider.overrideWithValue(null)],
        child: MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: CaptureScreen(
            captureService: service,
            localStore: CaptureLocalStore(prefs),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Android capture only'), findsOneWidget);
    expect(
      find.textContaining('not available on this platform'),
      findsOneWidget,
    );
    expect(find.text('Screenshot'), findsNothing);
  });

  testWidgets('CaptureScreen shows Android controls without upload action', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final service = _FakeCaptureService(
      support: const CaptureSupport(
        isSupported: true,
        platformLabel: 'android',
      ),
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [activeProjectIdProvider.overrideWithValue(null)],
        child: MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: CaptureScreen(
            captureService: service,
            localStore: CaptureLocalStore(prefs),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Screenshot'), findsOneWidget);
    expect(find.text('Record'), findsOneWidget);
    expect(find.text('Mic'), findsOneWidget);
    expect(find.textContaining('Upload'), findsNothing);
  });

  testWidgets('CaptureScreen keeps recoverable native notices visible', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final events = StreamController<CaptureNativeEvent>();
    final service = _FakeCaptureService(
      support: const CaptureSupport(
        isSupported: true,
        platformLabel: 'android',
      ),
      events: events.stream,
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [activeProjectIdProvider.overrideWithValue(null)],
        child: MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: CaptureScreen(
            captureService: service,
            localStore: CaptureLocalStore(prefs),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    events.add(
      const CaptureNativeEvent(
        type: CaptureEventType.notice,
        message:
            'Microphone permission was denied. Recording will continue video-only.',
        recoverable: true,
      ),
    );
    await tester.pump();
    events.add(
      const CaptureNativeEvent(
        type: CaptureEventType.recording,
        durationMs: 0,
        maxDurationMs: 300000,
        microphoneEnabled: false,
      ),
    );
    await tester.pump();

    expect(
      find.textContaining('Microphone permission was denied'),
      findsOneWidget,
    );

    await events.close();
  });
}

class _FakeCaptureService implements DeviceCaptureClient {
  _FakeCaptureService({
    required this.support,
    Stream<CaptureNativeEvent>? events,
  }) : _events = events ?? const Stream<CaptureNativeEvent>.empty();

  final CaptureSupport support;
  final Stream<CaptureNativeEvent> _events;

  @override
  Stream<CaptureNativeEvent> get events => _events;

  @override
  Future<CaptureSupport> checkSupport() async => support;

  @override
  Future<bool> deleteAsset(CaptureAsset asset) async => true;

  @override
  Future<void> shareAsset(CaptureAsset asset) async {}

  @override
  Future<void> startRecording({required bool includeMicrophone}) async {}

  @override
  Future<void> stopRecording() async {}

  @override
  Future<CaptureAsset> takeScreenshot() {
    throw UnimplementedError();
  }
}

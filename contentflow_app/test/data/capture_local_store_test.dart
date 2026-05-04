import 'package:contentflow_app/data/models/capture_asset.dart';
import 'package:contentflow_app/data/services/capture_local_store.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('CaptureLocalStore persists recent capture metadata only', () async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final store = CaptureLocalStore(prefs);
    final asset = CaptureAsset(
      id: 'capture-1',
      kind: CaptureKind.screenshot,
      path: '/app/files/capture.png',
      mimeType: 'image/png',
      createdAt: DateTime.utc(2026, 5, 4),
      width: 1080,
      height: 1920,
      byteSize: 4096,
      microphoneEnabled: false,
      captureScopeLabel: 'system-selected',
    );

    await store.addAsset(asset);
    final loaded = store.loadRecentAssets();

    expect(loaded, hasLength(1));
    expect(loaded.single.id, 'capture-1');
    expect(loaded.single.path, '/app/files/capture.png');

    await store.removeAsset('capture-1');
    expect(store.loadRecentAssets(), isEmpty);
  });
}

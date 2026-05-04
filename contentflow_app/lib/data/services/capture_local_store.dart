import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/capture_asset.dart';

class CaptureLocalStore {
  CaptureLocalStore(this._prefs);

  final SharedPreferences _prefs;

  static const _recentCapturesKey = 'capture_recent_assets_v1';
  static const recentLimit = 20;

  List<CaptureAsset> loadRecentAssets() {
    final raw = _prefs.getString(_recentCapturesKey);
    if (raw == null || raw.isEmpty) {
      return const <CaptureAsset>[];
    }

    try {
      final decoded = jsonDecode(raw);
      if (decoded is! List) {
        return const <CaptureAsset>[];
      }
      return decoded
          .whereType<Map>()
          .map((item) => CaptureAsset.fromJson(Map<String, dynamic>.from(item)))
          .where((asset) => asset.path.isNotEmpty)
          .toList(growable: false);
    } catch (_) {
      return const <CaptureAsset>[];
    }
  }

  Future<List<CaptureAsset>> addAsset(CaptureAsset asset) async {
    final current = loadRecentAssets().where((item) => item.id != asset.id);
    final next = [asset, ...current].take(recentLimit).toList(growable: false);
    await _save(next);
    return next;
  }

  Future<List<CaptureAsset>> removeAsset(String id) async {
    final next = loadRecentAssets()
        .where((asset) => asset.id != id)
        .toList(growable: false);
    await _save(next);
    return next;
  }

  Future<void> clear() async {
    await _prefs.remove(_recentCapturesKey);
  }

  Future<void> _save(List<CaptureAsset> assets) async {
    await _prefs.setString(
      _recentCapturesKey,
      jsonEncode(assets.map((asset) => asset.toJson()).toList()),
    );
  }
}

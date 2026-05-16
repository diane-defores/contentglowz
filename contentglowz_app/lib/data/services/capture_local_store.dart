import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/capture_asset.dart';
import '../models/capture_content_link.dart';

class CaptureLocalStore {
  CaptureLocalStore(this._prefs);

  final SharedPreferences _prefs;

  static const _recentCapturesKey = 'capture_recent_assets_v1';
  static const _captureContentLinksKey = 'capture_content_links_v1';
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
    await removeLinksForAsset(id);
    return next;
  }

  List<CaptureContentLink> loadContentLinks() {
    final raw = _prefs.getString(_captureContentLinksKey);
    if (raw == null || raw.isEmpty) {
      return const <CaptureContentLink>[];
    }

    try {
      final decoded = jsonDecode(raw);
      if (decoded is! List) {
        return const <CaptureContentLink>[];
      }
      return decoded
          .whereType<Map>()
          .map(
            (item) =>
                CaptureContentLink.fromJson(Map<String, dynamic>.from(item)),
          )
          .where((link) => link.assetId.isNotEmpty && link.contentId.isNotEmpty)
          .toList(growable: false);
    } catch (_) {
      return const <CaptureContentLink>[];
    }
  }

  Future<List<CaptureContentLink>> linkAssetToContent(
    CaptureContentLink link,
  ) async {
    final current = loadContentLinks().where(
      (item) =>
          item.assetId != link.assetId || item.contentId != link.contentId,
    );
    final next = [link, ...current].toList(growable: false);
    await _saveLinks(next);
    return next;
  }

  Future<List<CaptureContentLink>> removeLinksForAsset(String assetId) async {
    final next = loadContentLinks()
        .where((link) => link.assetId != assetId)
        .toList(growable: false);
    await _saveLinks(next);
    return next;
  }

  Future<void> clear() async {
    await _prefs.remove(_recentCapturesKey);
    await _prefs.remove(_captureContentLinksKey);
  }

  Future<void> _save(List<CaptureAsset> assets) async {
    await _prefs.setString(
      _recentCapturesKey,
      jsonEncode(assets.map((asset) => asset.toJson()).toList()),
    );
  }

  Future<void> _saveLinks(List<CaptureContentLink> links) async {
    await _prefs.setString(
      _captureContentLinksKey,
      jsonEncode(links.map((link) => link.toJson()).toList()),
    );
  }
}

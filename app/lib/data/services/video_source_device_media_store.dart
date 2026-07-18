import 'package:shared_preferences/shared_preferences.dart';

import 'android_media_library.dart';

/// Local-only association between a confirmed server source and its Android
/// MediaStore URI. Neither the URI nor this mapping is sent to the backend.
class VideoSourceDeviceMediaStore {
  VideoSourceDeviceMediaStore({
    required SharedPreferences preferences,
    required AndroidMediaLibrary mediaLibrary,
  }) : _preferences = preferences,
       _mediaLibrary = mediaLibrary;

  static const _keyPrefix = 'video_source_device_media_uri.';

  final SharedPreferences _preferences;
  final AndroidMediaLibrary _mediaLibrary;

  bool get isAndroidMediaLibraryAvailable => _mediaLibrary.isAvailable;

  Future<Set<String>> sourceIdsWithMappings(Iterable<String> sourceIds) async {
    return {
      for (final sourceId in sourceIds)
        if ((_preferences.getString('$_keyPrefix$sourceId') ?? '').isNotEmpty)
          sourceId,
    };
  }

  Future<void> save({required String sourceId, required String contentUri}) {
    return _preferences.setString('$_keyPrefix$sourceId', contentUri);
  }

  Future<void> remove(String sourceId) {
    return _preferences.remove('$_keyPrefix$sourceId');
  }

  Future<bool> deleteFromDevice(String sourceId) async {
    final contentUri = _preferences.getString('$_keyPrefix$sourceId');
    if (contentUri == null || contentUri.isEmpty) return false;
    final deleted = await _mediaLibrary.deleteFromDevice(contentUri);
    if (deleted) await remove(sourceId);
    return deleted;
  }
}

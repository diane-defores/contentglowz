import 'capture_asset_preview_stub.dart'
    if (dart.library.io) 'capture_asset_preview_io.dart';

import '../../../data/models/capture_asset.dart';

CaptureAssetPreview buildCaptureAssetPreview(CaptureAsset asset) {
  return CaptureAssetPreview(asset: asset);
}

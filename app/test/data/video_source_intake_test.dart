import 'package:app/data/models/video_source_intake.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('parses a mixed project-scoped source folder', () {
    final folder = VideoSourceFolder.fromJson({
      'id': 'folder-1',
      'projectId': 'project-1',
      'contentId': 'content-1',
      'revision': 4,
      'status': 'ready',
      'readyRevision': 4,
      'enqueueStatus': 'not_requested',
      'sources': [
        {
          'id': 'source-image',
          'folderId': 'folder-1',
          'sourceType': 'binary_image',
          'status': 'ready',
          'displayName': 'cover.webp',
          'assetId': 'asset-1',
          'safeMetadata': {
            'mimeType': 'image/webp',
            'sizeBytes': 2048,
            'width': 1080,
            'height': 1920,
          },
        },
        {
          'id': 'source-text',
          'folderId': 'folder-1',
          'sourceType': 'pasted_text',
          'status': 'ready',
          'displayName': 'Brief',
          'safeMetadata': {'characterCount': 320, 'snippet': 'Un aperçu'},
        },
      ],
    });

    expect(folder.projectId, 'project-1');
    expect(folder.readyRevision, 4);
    expect(folder.sources, hasLength(2));
    expect(folder.sources.first.type, VideoSourceType.binaryImage);
    expect(folder.sources.last.assetId, isNull);
    expect(folder.canFinalize, isTrue);
  });

  test('rejects provider configuration in opaque upload instructions', () {
    expect(
      () => VideoSourceUploadInstruction.fromJson({
        'clientFileId': 'file-1',
        'transport': 'presigned_put',
        'uploadUrl': 'https://upload.invalid/opaque',
        'bucket': 'must-not-reach-flutter',
      }),
      throwsFormatException,
    );
    expect(
      () => VideoSourceUploadInstruction.fromJson({
        'clientFileId': 'file-1',
        'transport': 'proxy',
        'uploadPath': '/opaque/upload',
        'bunny_storage_key': 'secret',
      }),
      throwsFormatException,
    );
  });

  test(
    'multipart plans omit authority until a checksum-bound part is signed',
    () {
      final plan = VideoSourceUploadPart.fromJson({
        'partNumber': 1,
        'sizeBytes': 8388608,
      });
      expect(plan.uploadUrl, isNull);
      expect(plan.headers, isEmpty);

      final signed = VideoSourceUploadPart.fromJson({
        'partNumber': 1,
        'sizeBytes': 8388608,
        'uploadUrl': 'https://upload.invalid/opaque',
        'headers': {'x-amz-checksum-sha256': 'opaque-checksum'},
      });
      expect(signed.uploadUrl, startsWith('https://'));
      expect(signed.headers, contains('x-amz-checksum-sha256'));

      expect(
        () => VideoSourceUploadPart.fromJson({
          'partNumber': 1,
          'sizeBytes': 8388608,
          'uploadUrl': 'https://upload.invalid/opaque',
          'bucket': 'must-not-reach-flutter',
        }),
        throwsFormatException,
      );
    },
  );

  test('generate payload is ids-only and contains no storage authority', () {
    final payload = VideoSourceGenerateCommand(
      folderId: 'folder-1',
      revision: 7,
      idempotencyKey: 'generate-folder-1-r7',
    ).toJson();

    expect(payload, {
      'folderId': 'folder-1',
      'revision': 7,
      'idempotencyKey': 'generate-folder-1-r7',
    });
    expect(payload.keys, isNot(contains('provider')));
    expect(payload.keys, isNot(contains('bucket')));
    expect(payload.keys, isNot(contains('objectKey')));
  });
}

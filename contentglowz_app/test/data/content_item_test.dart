import 'dart:async';
import 'dart:io' as io;

import 'package:contentglowz_app/data/models/content_item.dart';
import 'package:contentglowz_app/data/services/api_service.dart';
import 'package:contentglowz_app/data/services/offline_storage_service.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  group('ContentItem.fromJson', () {
    test('keeps content_preview out of authoritative body', () {
      final item = ContentItem.fromJson({
        'id': 'content-1',
        'title': 'Preview-only content',
        'content_type': 'article',
        'status': 'pending_review',
        'content_preview': 'Preview text only',
        'source_robot': 'article',
        'created_at': '2026-05-02T09:00:00Z',
      });

      expect(item.body, isEmpty);
      expect(item.summary, 'Preview text only');
    });

    test('uses body when a real body is present', () {
      final item = ContentItem.fromJson({
        'id': 'content-2',
        'title': 'Full content',
        'content_type': 'article',
        'status': 'pending_review',
        'content_preview': 'Preview text only',
        'body': 'Full body text',
        'source_robot': 'article',
        'created_at': '2026-05-02T09:00:00Z',
      });

      expect(item.body, 'Full body text');
      expect(item.summary, 'Preview text only');
    });
  });

  group('ApiService content body cache', () {
    test('serves cached full body only when the endpoint is unreachable', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final cacheStore = OfflineCacheStore(prefs);
      await cacheStore.write('user-1', 'content.body.content-1', {
        'body': 'Cached full body',
      });

      final api = ApiService(
        baseUrl: 'http://127.0.0.1:9',
        cacheStore: cacheStore,
        offlineScope: 'user-1',
      );

      expect(await api.fetchContentBody('content-1'), 'Cached full body');
    });

    test('does not serve cached full body after a 403 response', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final cacheStore = OfflineCacheStore(prefs);
      await cacheStore.write('user-1', 'content.body.content-1', {
        'body': 'Cached full body',
      });

      final server = await io.HttpServer.bind(
        io.InternetAddress.loopbackIPv4,
        0,
      );
      addTearDown(() async => server.close(force: true));
      unawaited(
        server.forEach((request) {
          request.response.statusCode = io.HttpStatus.forbidden;
          request.response.headers.contentType = io.ContentType.json;
          request.response.write('{"detail":"Forbidden"}');
          request.response.close();
        }),
      );

      final api = ApiService(
        baseUrl: 'http://${server.address.host}:${server.port}',
        cacheStore: cacheStore,
        offlineScope: 'user-1',
      );

      expect(
        () => api.fetchContentBody('content-1'),
        throwsA(
          isA<ApiException>()
              .having((error) => error.type, 'type', ApiErrorType.unauthorized)
              .having((error) => error.statusCode, 'statusCode', 403),
        ),
      );
    });

    test('does not serve cached full body after a 404 response', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final cacheStore = OfflineCacheStore(prefs);
      await cacheStore.write('user-1', 'content.body.content-1', {
        'body': 'Cached full body',
      });

      final server = await io.HttpServer.bind(
        io.InternetAddress.loopbackIPv4,
        0,
      );
      addTearDown(() async => server.close(force: true));
      unawaited(
        server.forEach((request) {
          request.response.statusCode = io.HttpStatus.notFound;
          request.response.headers.contentType = io.ContentType.json;
          request.response.write('{"detail":"No content body found"}');
          request.response.close();
        }),
      );

      final api = ApiService(
        baseUrl: 'http://${server.address.host}:${server.port}',
        cacheStore: cacheStore,
        offlineScope: 'user-1',
      );

      expect(
        () => api.fetchContentBody('content-1'),
        throwsA(
          isA<ApiException>()
              .having((error) => error.type, 'type', ApiErrorType.server)
              .having((error) => error.statusCode, 'statusCode', 404),
        ),
      );
    });
  });
}

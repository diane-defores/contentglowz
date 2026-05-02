import 'package:contentflow_app/data/models/app_access_state.dart';
import 'package:contentflow_app/data/models/app_settings.dart';
import 'package:contentflow_app/data/models/content_item.dart';
import 'package:contentflow_app/data/services/api_service.dart';
import 'package:contentflow_app/providers/providers.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test(
    'direct approve publishes the fetched full body, not the preview body',
    () async {
      final api = _FakeApiService(body: 'Full body from endpoint');
      final container = _container(
        api,
        items: [_contentItem(body: 'Preview text only')],
      );
      addTearDown(container.dispose);
      await container.read(pendingContentProvider.future);

      final result = await container
          .read(pendingContentProvider.notifier)
          .approve('content-1');

      expect(result.approved, isTrue);
      expect(result.published, isTrue);
      expect(api.approveCalls, 1);
      expect(api.bodyFetchAllowStaleCache, isFalse);
      expect(api.publishedContent, 'Full body from endpoint');
    },
  );

  test(
    'direct approve restores pending state when full body is unavailable',
    () async {
      final api = _FakeApiService(
        bodyError: const ApiException(
          ApiErrorType.server,
          'No content body found',
          statusCode: 404,
        ),
      );
      final item = _contentItem(body: 'Preview text only');
      final container = _container(api, items: [item]);
      addTearDown(container.dispose);
      await container.read(pendingContentProvider.future);

      final result = await container
          .read(pendingContentProvider.notifier)
          .approve('content-1');

      expect(result.approved, isFalse);
      expect(result.published, isFalse);
      expect(api.approveCalls, 0);
      expect(api.publishCalls, 0);
      expect(
        container.read(pendingContentProvider).value!.map((entry) => entry.id),
        contains('content-1'),
      );
    },
  );
}

ProviderContainer _container(
  _FakeApiService api, {
  required List<ContentItem> items,
}) {
  return ProviderContainer(
    overrides: [
      apiServiceProvider.overrideWithValue(api),
      appAccessStateProvider.overrideWith(() => _TestAccessNotifier()),
      activeProjectProvider.overrideWith((ref) => null),
      publishAccountsStateProvider.overrideWith(
        (ref) async => const PublishAccountsState(
          accounts: [
            PublishAccount(
              id: 'account-1',
              projectId: 'project-1',
              provider: 'late',
              platform: 'twitter',
              providerAccountId: 'late-account-1',
              username: 'creator',
              displayName: 'Creator',
              isDefault: true,
            ),
          ],
        ),
      ),
      contentHistoryProvider.overrideWith((ref) async => const <ContentItem>[]),
      pendingContentProvider.overrideWith(
        () => _TestPendingContentNotifier(items),
      ),
    ],
  );
}

ContentItem _contentItem({required String body}) {
  return ContentItem(
    id: 'content-1',
    title: 'Draft title',
    body: body,
    summary: 'Preview text only',
    type: ContentType.blogPost,
    status: ContentStatus.pending,
    channels: const [PublishingChannel.twitter],
    createdAt: DateTime(2026, 5, 2),
  );
}

class _TestPendingContentNotifier extends PendingContentNotifier {
  _TestPendingContentNotifier(this.items);

  final List<ContentItem> items;

  @override
  Future<List<ContentItem>> build() async => items;
}

class _TestAccessNotifier extends AppAccessNotifier {
  @override
  Future<AppAccessState> build() async =>
      const AppAccessState(stage: AppAccessStage.ready);
}

class _FakeApiService extends ApiService {
  _FakeApiService({this.body, this.bodyError}) : super(baseUrl: 'http://test');

  final String? body;
  final ApiException? bodyError;

  int approveCalls = 0;
  int publishCalls = 0;
  bool? bodyFetchAllowStaleCache;
  String? publishedContent;

  @override
  Future<String?> fetchContentBody(
    String id, {
    bool allowStaleCache = true,
  }) async {
    bodyFetchAllowStaleCache = allowStaleCache;
    final error = bodyError;
    if (error != null) {
      throw error;
    }
    return body;
  }

  @override
  Future<void> approveContent(String id) async {
    approveCalls++;
  }

  @override
  Future<Map<String, dynamic>> publishContent({
    required String content,
    required List<Map<String, String>> platforms,
    required String contentRecordId,
    String? title,
    List<String> mediaUrls = const [],
    List<String> tags = const [],
    bool publishNow = true,
  }) async {
    publishCalls++;
    publishedContent = content;
    return {'success': true};
  }
}

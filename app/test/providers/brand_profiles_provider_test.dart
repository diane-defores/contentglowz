import 'package:contentglowz_app/data/models/app_access_state.dart';
import 'package:contentglowz_app/data/models/brand_profile.dart';
import 'package:contentglowz_app/data/services/api_service.dart';
import 'package:contentglowz_app/providers/providers.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('loads brand profiles for the active project', () async {
    final api = _FakeBrandProfileApiService();
    final container = ProviderContainer(
      overrides: [
        apiServiceProvider.overrideWithValue(api),
        activeProjectIdProvider.overrideWithValue('project-1'),
        appAccessStateProvider.overrideWith(_FakeReadyAccessNotifier.new),
      ],
    );
    addTearDown(container.dispose);

    await container.read(appAccessStateProvider.future);
    final state = await container.read(brandProfilesStateProvider.future);

    expect(state.items.single.name, 'Primary');
    expect(api.requestedProjectIds, ['project-1']);
  });
}

class _FakeReadyAccessNotifier extends AppAccessNotifier {
  @override
  Future<AppAccessState> build() async {
    return AppAccessState(stage: AppAccessStage.ready);
  }
}

class _FakeBrandProfileApiService extends ApiService {
  _FakeBrandProfileApiService() : super(baseUrl: 'http://test');

  final List<String> requestedProjectIds = [];

  @override
  Future<List<BrandProfile>> fetchBrandProfiles({
    required String projectId,
  }) async {
    requestedProjectIds.add(projectId);
    return [
      BrandProfile(
        id: 'brand-1',
        userId: 'user-1',
        projectId: projectId,
        name: 'Primary',
        revision: 1,
        createdAt: DateTime.utc(2026, 7, 8, 12),
        updatedAt: DateTime.utc(2026, 7, 8, 12),
      ),
    ];
  }
}

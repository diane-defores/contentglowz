import 'package:dio/dio.dart';

import '../demo/demo_seed.dart';
import '../models/affiliate_link.dart';
import '../models/app_bootstrap.dart';
import '../models/app_settings.dart';
import '../models/content_item.dart';
import '../models/creator_profile.dart';
import '../models/persona.dart';
import '../models/project.dart';
import '../models/ritual.dart';

enum ApiErrorType { unauthorized, offline, server, invalidResponse, unknown }

class ApiException implements Exception {
  const ApiException(this.type, this.message);

  final ApiErrorType type;
  final String message;

  bool get isUnauthorized => type == ApiErrorType.unauthorized;
  bool get isOffline => type == ApiErrorType.offline;

  @override
  String toString() => message;
}

class ApiService {
  ApiService({
    required String baseUrl,
    String? authToken,
    this.allowDemoData = false,
    this.onUnauthorized,
  }) {
    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 60),
        headers: {
          'Content-Type': 'application/json',
          if (authToken != null && authToken.isNotEmpty)
            'Authorization': 'Bearer $authToken',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onError: (error, handler) {
          if (error.response?.statusCode == 401) {
            onUnauthorized?.call();
          }
          handler.next(error);
        },
      ),
    );
  }

  late final Dio _dio;
  final bool allowDemoData;
  final void Function()? onUnauthorized;

  void updateBaseUrl(String baseUrl) {
    _dio.options.baseUrl = baseUrl;
  }

  void updateAuthToken(String? authToken) {
    if (authToken == null || authToken.isEmpty) {
      _dio.options.headers.remove('Authorization');
      return;
    }
    _dio.options.headers['Authorization'] = 'Bearer $authToken';
  }

  Future<Map<String, dynamic>> healthCheck() async {
    try {
      final response = await _dio.get('/health');
      return _asMap(response.data, fallback: const {'status': 'offline'});
    } on DioException {
      return {'status': 'offline'};
    }
  }

  Future<List<Project>> fetchProjects() async {
    try {
      final response = await _dio.get('/api/projects');
      final data = response.data;
      final items = data is List ? data : (_asMap(data)['projects'] ?? []);
      if (items is! List) {
        throw const ApiException(
          ApiErrorType.invalidResponse,
          'Invalid projects response from FastAPI.',
        );
      }
      return items
          .map((json) => Project.fromJson(json as Map<String, dynamic>))
          .toList();
    } on DioException catch (error) {
      if (allowDemoData) {
        return _mockProjects();
      }
      throw _mapDioException(error);
    }
  }

  Future<void> onboardProject(String githubUrl, String name) async {
    try {
      await _dio.post(
        '/api/projects/onboard',
        data: {
          'github_url': githubUrl,
          'name': name,
        },
      );
    } on DioException catch (error) {
      throw _mapDioException(error);
    }
  }

  Future<AppBootstrap> fetchBootstrap() async {
    try {
      final response = await _dio.get('/api/bootstrap');
      return AppBootstrap.fromJson(_asMap(response.data));
    } on DioException catch (error) {
      throw _mapDioException(error);
    }
  }

  Future<AppSettings> fetchSettings() async {
    try {
      final response = await _dio.get('/api/settings');
      return AppSettings.fromJson(_asMap(response.data));
    } on DioException catch (error) {
      throw _mapDioException(error);
    }
  }

  Future<AppSettings> updateSettings(Map<String, dynamic> updates) async {
    try {
      final response = await _dio.patch('/api/settings', data: updates);
      return AppSettings.fromJson(_asMap(response.data));
    } on DioException catch (error) {
      throw _mapDioException(error);
    }
  }

  Future<CreatorProfile?> fetchCreatorProfile() async {
    try {
      final response = await _dio.get('/api/creator-profile');
      if (response.data == null) {
        return null;
      }
      final data = _asMap(response.data, fallback: const {});
      return data.isEmpty ? null : CreatorProfile.fromJson(data);
    } on DioException catch (error) {
      throw _mapDioException(error);
    }
  }

  Future<CreatorProfile> saveCreatorProfile({
    String? projectId,
    String? displayName,
    Map<String, dynamic>? voice,
    Map<String, dynamic>? positioning,
    List<String>? values,
    String? currentChapterId,
  }) async {
    try {
      final response = await _dio.put(
        '/api/creator-profile',
        data: {
          if (projectId != null) 'projectId': projectId,
          if (displayName != null) 'displayName': displayName,
          if (voice != null) 'voice': voice,
          if (positioning != null) 'positioning': positioning,
          if (values != null) 'values': values,
          if (currentChapterId != null) 'currentChapterId': currentChapterId,
        },
      );
      return CreatorProfile.fromJson(_asMap(response.data));
    } on DioException catch (error) {
      throw _mapDioException(error);
    }
  }

  Future<List<ContentItem>> fetchPendingContent() async {
    try {
      final response = await _dio.get(
        '/api/status/content',
        queryParameters: {'status': 'pending_review'},
      );
      return _parseContentList(response.data);
    } on DioException catch (error) {
      if (allowDemoData) {
        return _mockContent();
      }
      throw _mapDioException(error);
    }
  }

  Future<List<ContentItem>> fetchContentHistory() async {
    try {
      final response = await _dio.get(
        '/api/status/content',
        queryParameters: {'status': 'published,rejected,approved'},
      );
      return _parseContentList(response.data);
    } on DioException catch (error) {
      if (allowDemoData) {
        return _mockHistory();
      }
      throw _mapDioException(error);
    }
  }

  Future<String?> fetchContentBody(String id) async {
    if (allowDemoData) {
      return _demoContentById(id)?.body;
    }

    try {
      final response = await _dio.get('/api/status/content/$id/body');
      final data = _asMap(response.data);
      return data['body'] as String? ?? data['content'] as String?;
    } on DioException catch (error) {
      throw _mapDioException(error);
    }
  }

  Future<bool> saveContentBody(
    String id,
    String body, {
    String editedBy = 'flutter_app',
    String? editNote,
  }) async {
    if (allowDemoData) {
      return true;
    }

    try {
      await _dio.put(
        '/api/status/content/$id/body',
        data: {
          'body': body,
          'edited_by': editedBy,
          if (editNote != null) 'edit_note': editNote,
        },
      );
      return true;
    } on DioException catch (error) {
      throw _mapDioException(error);
    }
  }

  Future<void> transitionContent(
    String id,
    String toStatus, {
    String? reason,
  }) async {
    if (allowDemoData) {
      return;
    }

    try {
      await _dio.post(
        '/api/status/content/$id/transition',
        data: {
          'to_status': toStatus,
          'changed_by': 'flutter_app',
          if (reason != null) 'reason': reason,
        },
      );
    } on DioException catch (error) {
      throw _mapDioException(error);
    }
  }

  Future<void> approveContent(String id) => transitionContent(id, 'approved');

  Future<void> rejectContent(String id) => transitionContent(id, 'rejected');

  Future<bool> updateContent(
    String id, {
    String? title,
    String? body,
  }) async {
    if (allowDemoData) {
      return true;
    }

    try {
      final data = <String, dynamic>{};
      if (title != null) data['title'] = title;
      if (body != null) data['body'] = body;
      await _dio.patch('/api/status/content/$id', data: data);
      return true;
    } on DioException catch (error) {
      throw _mapDioException(error);
    }
  }

  Future<NarrativeSynthesisResult> synthesizeNarrative({
    required String profileId,
    required List<RitualEntry> entries,
    Map<String, dynamic>? currentVoice,
    Map<String, dynamic>? currentPositioning,
    String? chapterTitle,
  }) async {
    try {
      final response = await _dio.post(
        '/api/psychology/synthesize-narrative',
        data: {
          'profile_id': profileId,
          'entries': entries
              .where((entry) => !entry.isEmpty)
              .map((entry) => entry.toJson())
              .toList(),
          if (currentVoice != null) 'current_voice': currentVoice,
          if (currentPositioning != null)
            'current_positioning': currentPositioning,
          if (chapterTitle != null) 'chapter_title': chapterTitle,
        },
      );
      return NarrativeSynthesisResult.fromJson(_asMap(response.data));
    } on DioException catch (error) {
      if (allowDemoData) {
        return _mockNarrativeResult();
      }
      throw _mapDioException(error);
    }
  }

  Future<List<Persona>> fetchPersonas() async {
    try {
      final response = await _dio.get('/api/personas');
      final data = response.data;
      if (data is! List) {
        throw const ApiException(
          ApiErrorType.invalidResponse,
          'Invalid personas response from FastAPI.',
        );
      }
      return data
          .map((json) => Persona.fromJson(_normalizePersonaJson(json)))
          .toList();
    } on DioException catch (error) {
      if (allowDemoData) {
        return _mockPersonas();
      }
      throw _mapDioException(error);
    }
  }

  Future<Persona> savePersona(Persona persona) async {
    if (allowDemoData) {
      return persona.copyWith(
        id: persona.id ?? 'mock-${DateTime.now().millisecondsSinceEpoch}',
      );
    }

    try {
      final payload = persona.toJson()
        ..remove('id')
        ..removeWhere((key, value) => value == null);

      final Response<dynamic> response;
      if (persona.id case final id?) {
        response = await _dio.put('/api/personas/$id', data: payload);
      } else {
        response = await _dio.post('/api/personas', data: payload);
      }
      return Persona.fromJson(_normalizePersonaJson(_asMap(response.data)));
    } on DioException catch (error) {
      throw _mapDioException(error);
    }
  }

  Future<Map<String, dynamic>> refinePersona(Persona persona) async {
    try {
      final response = await _dio.post(
        '/api/psychology/refine-persona',
        data: {'persona': persona.toJson()},
      );
      return _asMap(response.data);
    } on DioException catch (error) {
      if (allowDemoData) {
        return {
          'suggested_updates': <String, dynamic>{},
          'new_confidence': persona.confidence,
        };
      }
      throw _mapDioException(error);
    }
  }

  Future<List<AngleSuggestion>> generateAngles({
    Map<String, dynamic>? creatorVoice,
    Map<String, dynamic>? creatorPositioning,
    String? narrativeSummary,
    required Map<String, dynamic> personaData,
    String? contentType,
    int count = 3,
  }) async {
    try {
      final response = await _dio.post(
        '/api/psychology/generate-angles',
        data: {
          if (creatorVoice != null) 'creator_voice': creatorVoice,
          if (creatorPositioning != null)
            'creator_positioning': creatorPositioning,
          if (narrativeSummary != null) 'narrative_summary': narrativeSummary,
          'persona_data': personaData,
          if (contentType != null) 'content_type': contentType,
          'count': count,
        },
      );
      final raw = response.data;
      final angles = raw is Map<String, dynamic> ? raw['angles'] ?? [] : raw;
      if (angles is! List) {
        throw const ApiException(
          ApiErrorType.invalidResponse,
          'Invalid angles response from FastAPI.',
        );
      }
      return angles
          .map((json) => AngleSuggestion.fromJson(json as Map<String, dynamic>))
          .toList();
    } on DioException catch (error) {
      if (allowDemoData) {
        return _mockAngles();
      }
      throw _mapDioException(error);
    }
  }

  Future<Map<String, dynamic>?> createContentFromAngle({
    required AngleSuggestion angle,
    String? projectId,
  }) async {
    if (allowDemoData) {
      return {'success': true, 'id': 'demo-angle-content'};
    }

    try {
      final contentType = switch (angle.contentType) {
        'blog_post' => 'article',
        'social_post' => 'article',
        'video_script' => 'video_script',
        'reel' => 'video_script',
        _ => angle.contentType,
      };
      final sourceRobot = switch (angle.contentType) {
        'newsletter' => 'newsletter',
        _ => 'manual',
      };

      final response = await _dio.post(
        '/api/status/content',
        data: {
          'title': angle.title,
          'content_type': contentType,
          'source_robot': sourceRobot,
          'status': 'todo',
          if (projectId != null) 'project_id': projectId,
          'content_preview': angle.hook,
          'priority': angle.confidence >= 80 ? 4 : 3,
          'tags': [
            angle.contentType,
            if (angle.narrativeThread.isNotEmpty) angle.narrativeThread,
          ],
          'metadata': {
            'angle': angle.angle,
            'hook': angle.hook,
            'narrative_thread': angle.narrativeThread,
            'pain_point_addressed': angle.painPointAddressed,
            'confidence': angle.confidence,
            'generated_from': 'angles_screen',
          },
        },
      );
      return _asMap(response.data);
    } on DioException catch (error) {
      throw _mapDioException(error);
    }
  }

  /// Dispatch an angle to the real content generation pipeline.
  /// Returns {task_id, content_record_id, format, status}.
  Future<Map<String, dynamic>?> dispatchPipeline({
    required AngleSuggestion angle,
    Map<String, dynamic>? creatorVoice,
    String? projectId,
  }) async {
    if (allowDemoData) {
      return {
        'task_id': 'demo-task',
        'content_record_id': 'demo-record',
        'format': angle.contentType,
        'status': 'running',
      };
    }

    // Map angle content_type to pipeline format
    final targetFormat = switch (angle.contentType) {
      'blog_post' => 'article',
      'social_post' => 'social_post',
      'newsletter' => 'newsletter',
      'short' || 'reel' => 'short',
      'video_script' => 'article',
      _ => angle.contentType,
    };

    try {
      final response = await _dio.post(
        '/api/psychology/dispatch-pipeline',
        data: {
          'angle_data': {
            'title': angle.title,
            'hook': angle.hook,
            'angle': angle.angle,
            'content_type': angle.contentType,
            'narrative_thread': angle.narrativeThread,
            'pain_point_addressed': angle.painPointAddressed,
            'confidence': angle.confidence,
          },
          'target_format': targetFormat,
          if (creatorVoice != null) 'creator_voice': creatorVoice,
          if (projectId != null) 'project_id': projectId,
        },
      );
      return _asMap(response.data);
    } on DioException catch (error) {
      throw _mapDioException(error);
    }
  }

  /// Poll pipeline dispatch status.
  Future<Map<String, dynamic>?> getPipelineStatus(String taskId) async {
    try {
      final response = await _dio.get('/api/psychology/pipeline-status/$taskId');
      return _asMap(response.data);
    } on DioException catch (error) {
      throw _mapDioException(error);
    }
  }

  Future<List<Map<String, dynamic>>> fetchScheduleJobs() async {
    if (allowDemoData) {
      return const [];
    }

    try {
      final response = await _dio.get('/api/scheduler/jobs');
      final data = response.data;
      final jobs = data is List ? data : (_asMap(data)['jobs'] ?? []);
      if (jobs is! List) {
        throw const ApiException(
          ApiErrorType.invalidResponse,
          'Invalid schedule jobs response from FastAPI.',
        );
      }
      return jobs.cast<Map<String, dynamic>>();
    } on DioException catch (error) {
      throw _mapDioException(error);
    }
  }

  Future<void> scheduleContent(String contentId, DateTime scheduledFor) async {
    if (allowDemoData) {
      return;
    }

    try {
      await _dio.patch(
        '/api/status/content/$contentId/schedule',
        data: {'scheduled_for': scheduledFor.toIso8601String()},
      );
    } on DioException catch (error) {
      throw _mapDioException(error);
    }
  }

  Future<List<PublishAccount>> fetchPublishAccounts() async {
    if (allowDemoData) {
      return const [];
    }

    try {
      final response = await _dio.get('/api/publish/accounts');
      final accounts = _asMap(response.data)['accounts'] ?? [];
      if (accounts is! List) {
        throw const ApiException(
          ApiErrorType.invalidResponse,
          'Invalid publish accounts response from FastAPI.',
        );
      }
      return accounts
          .map((json) => PublishAccount.fromJson(json as Map<String, dynamic>))
          .where(
            (account) => account.id.isNotEmpty && account.platform.isNotEmpty,
          )
          .toList();
    } on DioException catch (error) {
      throw _mapDioException(error);
    }
  }

  /// Get OAuth connect URL for a platform. Opens in browser to authorize.
  Future<String?> getConnectUrl(String platform) async {
    if (allowDemoData) return null;

    try {
      final response = await _dio.get('/api/publish/connect/$platform');
      final data = _asMap(response.data);
      return data['connect_url'] as String?;
    } on DioException {
      return null;
    }
  }

  /// Disconnect a social account.
  Future<bool> disconnectAccount(String accountId) async {
    if (allowDemoData) return false;

    try {
      await _dio.delete('/api/publish/accounts/$accountId');
      return true;
    } on DioException {
      return false;
    }
  }

  Future<Map<String, dynamic>> publishContent({
    required String content,
    required List<Map<String, String>> platforms,
    String? title,
    List<String> mediaUrls = const [],
    List<String> tags = const [],
    String? contentRecordId,
    bool publishNow = true,
  }) async {
    if (allowDemoData) {
      return {
        'success': false,
        'error': 'Publishing is disabled in demo mode.',
      };
    }

    try {
      final response = await _dio.post(
        '/api/publish',
        data: {
          'content': content,
          'platforms': platforms,
          if (title != null) 'title': title,
          if (mediaUrls.isNotEmpty) 'media_urls': mediaUrls,
          if (tags.isNotEmpty) 'tags': tags,
          if (contentRecordId != null) 'content_record_id': contentRecordId,
          'publish_now': publishNow,
        },
      );
      return _asMap(response.data);
    } on DioException catch (error) {
      throw _mapDioException(error);
    }
  }

  // ─── Reels ────────────────────────────────────────────────

  Future<Map<String, dynamic>> downloadReel({
    required String url,
    required String userId,
    String? bunnyStorageKey,
    String? bunnyCdnHostname,
  }) async {
    try {
      final response = await _dio.post('/api/reels/download', data: {
        'url': url,
        'user_id': userId,
        if (bunnyStorageKey != null) 'bunny_storage_key': bunnyStorageKey,
        if (bunnyCdnHostname != null) 'bunny_cdn_hostname': bunnyCdnHostname,
      });
      return _asMap(response.data);
    } on DioException catch (error) {
      throw _mapDioException(error);
    }
  }

  Future<Map<String, dynamic>> getReelsCookieStatus(String userId) async {
    try {
      final response = await _dio.get('/api/reels/cookies/status',
          queryParameters: {'user_id': userId});
      return _asMap(response.data);
    } on DioException catch (error) {
      if (allowDemoData) return {'has_cookies': false};
      throw _mapDioException(error);
    }
  }

  // ─── Content Tools ───────────────────────────────────────

  Future<Map<String, dynamic>> fetchPendingValidations({
    String? projectId,
    int daysAhead = 7,
  }) async {
    try {
      final params = <String, dynamic>{'days_ahead': daysAhead};
      if (projectId != null) params['project_id'] = projectId;
      final response = await _dio.get('/api/content/pending-validations',
          queryParameters: params);
      return _asMap(response.data);
    } on DioException catch (error) {
      if (allowDemoData) return {'total': 0, 'articles': []};
      throw _mapDioException(error);
    }
  }

  // ─── Work Domains ─────────────────────────────────────────

  Future<List<Map<String, dynamic>>> fetchWorkDomains({String? projectId}) async {
    try {
      final params = <String, dynamic>{};
      if (projectId != null) params['projectId'] = projectId;
      final response = await _dio.get('/api/work-domains', queryParameters: params);
      final data = response.data;
      if (data is List) return data.cast<Map<String, dynamic>>();
      return [];
    } on DioException catch (error) {
      if (allowDemoData) return const [];
      throw _mapDioException(error);
    }
  }

  // ─── Activity ─────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> fetchActivity({
    String? projectId,
    int limit = 50,
  }) async {
    try {
      final params = <String, dynamic>{'limit': limit};
      if (projectId != null) params['projectId'] = projectId;
      final response = await _dio.get('/api/activity', queryParameters: params);
      final data = response.data;
      if (data is List) return data.cast<Map<String, dynamic>>();
      return [];
    } on DioException catch (error) {
      if (allowDemoData) return const [];
      throw _mapDioException(error);
    }
  }

  // ─── Runs ─────────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> fetchRuns({
    String? robotName,
    String? status,
    int limit = 20,
  }) async {
    try {
      final params = <String, dynamic>{'limit': limit};
      if (robotName != null) params['robot_name'] = robotName;
      if (status != null) params['status'] = status;
      final response = await _dio.get('/runs', queryParameters: params);
      final data = response.data;
      if (data is List) return data.cast<Map<String, dynamic>>();
      return (_asMap(data)['runs'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    } on DioException catch (error) {
      if (allowDemoData) return const [];
      throw _mapDioException(error);
    }
  }

  // ─── Templates ────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> fetchDefaultTemplates() async {
    try {
      final response = await _dio.get('/api/templates/defaults');
      final data = response.data;
      if (data is List) return data.cast<Map<String, dynamic>>();
      return (_asMap(data)['templates'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    } on DioException catch (error) {
      if (allowDemoData) return const [];
      throw _mapDioException(error);
    }
  }

  // ─── Newsletter ───────────────────────────────────────────

  Future<Map<String, dynamic>> checkNewsletterConfig() async {
    try {
      final response = await _dio.get('/api/newsletter/config/check');
      return _asMap(response.data);
    } on DioException catch (error) {
      if (allowDemoData) return {'configured': false};
      throw _mapDioException(error);
    }
  }

  Future<Map<String, dynamic>> generateNewsletter({
    required String name,
    required List<String> topics,
    required String targetAudience,
    String tone = 'professional',
    int maxSections = 5,
  }) async {
    try {
      final response = await _dio.post('/api/newsletter/generate-async', data: {
        'name': name,
        'topics': topics,
        'target_audience': targetAudience,
        'tone': tone,
        'max_sections': maxSections,
      });
      return _asMap(response.data);
    } on DioException catch (error) {
      throw _mapDioException(error);
    }
  }

  Future<Map<String, dynamic>> getNewsletterJobStatus(String jobId) async {
    try {
      final response = await _dio.get('/api/newsletter/jobs/$jobId');
      return _asMap(response.data);
    } on DioException catch (error) {
      throw _mapDioException(error);
    }
  }

  // ─── Research ─────────────────────────────────────────────

  Future<Map<String, dynamic>> runCompetitorAnalysis({
    required String targetUrl,
    required List<String> competitors,
    List<String> keywords = const [],
  }) async {
    try {
      final response = await _dio.post('/api/research/competitor-analysis', data: {
        'target_url': targetUrl,
        'competitors': competitors,
        if (keywords.isNotEmpty) 'keywords': keywords,
      });
      return _asMap(response.data);
    } on DioException catch (error) {
      throw _mapDioException(error);
    }
  }

  // ─── SEO Mesh ─────────────────────────────────────────────

  Future<Map<String, dynamic>> analyzeMesh({required String repoUrl}) async {
    try {
      final response = await _dio.post('/api/mesh/analyze', data: {
        'repo_url': repoUrl,
      });
      return _asMap(response.data);
    } on DioException catch (error) {
      throw _mapDioException(error);
    }
  }

  // ─── Affiliations ──────────────────────────────────────────

  Future<List<AffiliateLink>> fetchAffiliations({String? projectId}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (projectId != null) queryParams['projectId'] = projectId;
      final response = await _dio.get(
        '/api/affiliations',
        queryParameters: queryParams,
      );
      final data = response.data;
      if (data is! List) {
        throw const ApiException(
          ApiErrorType.invalidResponse,
          'Invalid affiliations response from FastAPI.',
        );
      }
      return data
          .map((json) => AffiliateLink.fromJson(json as Map<String, dynamic>))
          .toList();
    } on DioException catch (error) {
      if (allowDemoData) return const [];
      throw _mapDioException(error);
    }
  }

  Future<AffiliateLink> createAffiliation(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/api/affiliations', data: data);
      return AffiliateLink.fromJson(_asMap(response.data));
    } on DioException catch (error) {
      throw _mapDioException(error);
    }
  }

  Future<AffiliateLink> updateAffiliation(
    String id,
    Map<String, dynamic> data,
  ) async {
    try {
      final response = await _dio.put('/api/affiliations/$id', data: data);
      return AffiliateLink.fromJson(_asMap(response.data));
    } on DioException catch (error) {
      throw _mapDioException(error);
    }
  }

  Future<bool> deleteAffiliation(String id) async {
    try {
      await _dio.delete('/api/affiliations/$id');
      return true;
    } on DioException catch (error) {
      throw _mapDioException(error);
    }
  }

  List<ContentItem> _parseContentList(dynamic data) {
    final items = data is List
        ? data
        : (_asMap(data)['items'] ?? _asMap(data)['content'] ?? []);
    if (items is! List) {
      throw const ApiException(
        ApiErrorType.invalidResponse,
        'Invalid content response from FastAPI.',
      );
    }
    return items
        .map((json) => ContentItem.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  Map<String, dynamic> _asMap(
    dynamic data, {
    Map<String, dynamic> fallback = const {},
  }) {
    return data is Map<String, dynamic> ? data : fallback;
  }

  Map<String, dynamic> _normalizePersonaJson(dynamic data) {
    final json = _asMap(data);
    return {
      'id': json['id'],
      'name': json['name'],
      'avatar': json['avatar'],
      'confidence': json['confidence'],
      'demographics': json['demographics'],
      'pain_points': json['painPoints'] ?? json['pain_points'],
      'goals': json['goals'],
      'language': json['language'],
      'content_preferences':
          json['contentPreferences'] ?? json['content_preferences'],
    };
  }

  ApiException _mapDioException(DioException error) {
    final statusCode = error.response?.statusCode;
    final message = _detailMessage(error);

    if (statusCode == 401) {
      return ApiException(
        ApiErrorType.unauthorized,
        message.isEmpty ? 'Your Clerk session expired.' : message,
      );
    }

    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout) {
      return ApiException(
        ApiErrorType.offline,
        message.isEmpty ? 'FastAPI is unreachable.' : message,
      );
    }

    if (statusCode != null) {
      return ApiException(
        ApiErrorType.server,
        message.isEmpty
            ? 'FastAPI returned an unexpected error ($statusCode).'
            : message,
      );
    }

    return ApiException(
      ApiErrorType.unknown,
      message.isEmpty ? 'Unexpected API error.' : message,
    );
  }

  String _detailMessage(DioException error) {
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final detail = data['detail'] ?? data['message'] ?? data['error'];
      if (detail is String && detail.isNotEmpty) {
        return detail;
      }
    }

    return error.message ?? '';
  }

  ContentItem? _demoContentById(String id) {
    for (final item in [..._mockContent(), ..._mockHistory()]) {
      if (item.id == id) {
        return item;
      }
    }
    return null;
  }

  List<Project> _mockProjects() => [
        Project(
          id: DemoSeed.projectId,
          name: DemoSeed.projectName,
          url: DemoSeed.repoUrl,
          description: DemoSeed.description,
          isDefault: true,
          settings: const ProjectSettings(
            techStack: TechStackDetection(
              framework: Framework.nextjs,
              frameworkVersion: 'latest',
              confidence: 0.95,
            ),
            onboardingStatus: OnboardingStatus.completed,
          ),
          createdAt: DateTime.now().subtract(const Duration(days: 30)),
        ),
      ];

  List<Persona> _mockPersonas() => [
        const Persona(
          id: 'persona-1',
          name: 'Tech-Savvy Solopreneur',
          avatar: '🚀',
          confidence: 72,
          demographics: PersonaDemographics(
            role: 'Indie developer / Solopreneur',
            industry: 'SaaS / Tech',
            ageRange: '25-40',
            experienceLevel: '3-8 years',
          ),
          painPoints: [
            'Overwhelmed by too many AI tools, can\'t decide which to use',
            'Wants to ship faster but stuck in analysis paralysis',
          ],
          goals: [
            'Build a profitable SaaS with minimal team',
            'Use AI to multiply productivity without losing quality',
          ],
        ),
      ];

  NarrativeSynthesisResult _mockNarrativeResult() =>
      const NarrativeSynthesisResult(
        narrativeSummary:
            'This week\'s narrative centers around a shift from tool accumulation to tool mastery. '
            'The creator is moving from "trying everything" to "mastering the few tools that matter." '
            'This aligns with a new chapter: Radical Pragmatism — choosing depth over breadth.',
        chapterTransition: true,
        suggestedChapterTitle: 'Radical Pragmatism',
        voiceDelta: {
          'tone_shift': 'More direct and opinionated',
          'new_vocabulary': ['ship it', 'good enough', 'pragmatic'],
        },
        positioningDelta: {
          'angle_shift': 'From "AI enthusiast" to "pragmatic AI builder"',
        },
      );

  List<AngleSuggestion> _mockAngles() => [
        const AngleSuggestion(
          title: 'The Filter: I tested 50 AI tools, here are the 3 worth your time',
          hook:
              'Stop hoarding AI subscriptions. I burned \$500/month so you don\'t have to.',
          angle:
              'Pragmatic curation — position as the person who already did the hard work of filtering',
          contentType: 'blog_post',
          narrativeThread: 'Radical Pragmatism',
          painPointAddressed: 'Overwhelmed by too many AI tools',
          confidence: 87,
        ),
        const AngleSuggestion(
          title: 'Your problem isn\'t the tools — it\'s clarity',
          hook:
              'You don\'t need another AI tool. You need to know what you\'re solving.',
          angle:
              'Confrontational mirror — challenge the assumption that more tools = more productivity',
          contentType: 'social_post',
          narrativeThread: 'Radical Pragmatism',
          painPointAddressed: 'Analysis paralysis on tool selection',
          confidence: 79,
        ),
        const AngleSuggestion(
          title: 'My 5-minute AI tool decision framework',
          hook:
              'I\'ve been paralyzed by tool choice too. Here\'s how I broke free in 5 minutes.',
          angle:
              'Empathetic guide — share a personal framework, position as a peer who solved the same problem',
          contentType: 'video_script',
          narrativeThread: 'Radical Pragmatism',
          painPointAddressed: 'Stuck in analysis paralysis',
          confidence: 82,
        ),
      ];

  List<ContentItem> _mockContent() {
    final now = DateTime.now();
    return [
      ContentItem(
        id: '1',
        title: '10 Flutter Tips for Production Apps',
        body:
            '# 10 Flutter Tips for Production Apps\n\nFlutter has become the go-to framework for cross-platform development. Here are 10 tips that will level up your production apps.\n\n## 1. Use Riverpod for State Management\n\nRiverpod provides compile-time safety and automatic disposal of unused providers.\n\n## 2. Implement Proper Error Handling\n\nAlways wrap your async operations in try-catch blocks.\n\n## 3. Optimize Image Loading\n\nUse `cached_network_image` to avoid re-downloading images.\n\n## 4. Profile Before You Optimize\n\nUse Flutter DevTools to identify actual bottlenecks.\n\n## 5. Write Widget Tests\n\nWidget tests are fast and catch most UI regression bugs.',
        summary: 'Essential Flutter tips for production-ready apps.',
        type: ContentType.blogPost,
        status: ContentStatus.pending,
        channels: [PublishingChannel.ghost, PublishingChannel.twitter],
        projectName: DemoSeed.projectName,
        createdAt: now.subtract(const Duration(hours: 2)),
      ),
      ContentItem(
        id: '2',
        title: 'AI is transforming how we build software',
        body:
            'AI is transforming how we build software.\n\nIn 2026, the best developers aren\'t those who write the most code — they\'re the ones who know how to direct AI.\n\n3 skills that matter:\n→ Prompt engineering\n→ Code review (AI output)\n→ System architecture\n\n#AI #SoftwareEngineering',
        summary: 'Thread about AI in software development',
        type: ContentType.socialPost,
        status: ContentStatus.pending,
        channels: [PublishingChannel.twitter, PublishingChannel.linkedin],
        projectName: DemoSeed.projectName,
        createdAt: now.subtract(const Duration(hours: 1)),
      ),
      ContentItem(
        id: '3',
        title: 'Weekly Tech Digest #42',
        body:
            '# Weekly Tech Digest #42\n\n## Top Stories\n\n**Flutter 3.41 Released** — Hot reload on web, better Material 3.\n\n**Claude 4.6 Opus** — 1M context window.\n\n## Tutorial of the Week\n\nBuilding real-time dashboards with Flutter + WebSockets.',
        summary: 'Weekly newsletter with top tech stories',
        type: ContentType.newsletter,
        status: ContentStatus.pending,
        channels: [PublishingChannel.ghost],
        projectName: DemoSeed.projectName,
        createdAt: now.subtract(const Duration(minutes: 30)),
      ),
      ContentItem(
        id: '4',
        title: 'How I Built a SaaS in 30 Days',
        body:
            'HOOK: "I went from idea to \$2K MRR in 30 days."\n\nINTRO (0:00-0:15):\nShow revenue dashboard.\n\nSECTION 1 - The Idea (0:15-1:00):\n"I started with a problem I had myself..."\n\nSECTION 2 - The Build (1:00-3:00):\n"Flutter frontend, Python backend..."\n\nCTA (4:30-5:00):\n"Template link in bio."',
        summary: 'YouTube video script about building a SaaS',
        type: ContentType.videoScript,
        status: ContentStatus.pending,
        channels: [PublishingChannel.youtube],
        projectName: DemoSeed.projectName,
        createdAt: now.subtract(const Duration(minutes: 45)),
      ),
      ContentItem(
        id: '5',
        title: 'Quick tip: Use sealed classes',
        body:
            'REEL (30s)\n\n"Stop using if-else chains!"\n\n[Show bad code]\n"This? Terrible."\n\n[Show sealed class]\n"The compiler catches every missing case."\n\n"Follow for more Flutter tips."\n\n#Flutter #Dart #CodingTips',
        summary: 'Instagram reel about sealed classes in Dart',
        type: ContentType.reel,
        status: ContentStatus.pending,
        channels: [PublishingChannel.instagram, PublishingChannel.tiktok],
        projectName: DemoSeed.projectName,
        createdAt: now.subtract(const Duration(minutes: 15)),
      ),
    ];
  }

  List<ContentItem> _mockHistory() {
    final now = DateTime.now();
    return [
      ContentItem(
        id: 'h1',
        title: 'Getting Started with Riverpod 3.0',
        body: 'Published article about Riverpod 3.0 migration guide...',
        type: ContentType.blogPost,
        status: ContentStatus.published,
        channels: [PublishingChannel.ghost],
        projectName: DemoSeed.projectName,
        createdAt: now.subtract(const Duration(days: 1)),
        publishedAt: now.subtract(const Duration(hours: 20)),
      ),
      ContentItem(
        id: 'h2',
        title: 'The future of cross-platform development',
        body: 'Social post about Flutter vs React Native...',
        type: ContentType.socialPost,
        status: ContentStatus.published,
        channels: [PublishingChannel.twitter, PublishingChannel.linkedin],
        projectName: DemoSeed.projectName,
        createdAt: now.subtract(const Duration(days: 2)),
        publishedAt: now.subtract(const Duration(days: 1, hours: 12)),
      ),
      ContentItem(
        id: 'h3',
        title: 'Bad take on microservices',
        body: 'Rejected post about microservices being dead...',
        type: ContentType.socialPost,
        status: ContentStatus.rejected,
        channels: [PublishingChannel.twitter],
        projectName: DemoSeed.projectName,
        createdAt: now.subtract(const Duration(days: 3)),
      ),
    ];
  }
}

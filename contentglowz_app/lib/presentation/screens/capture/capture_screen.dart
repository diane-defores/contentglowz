import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../data/models/capture_asset.dart';
import '../../../data/models/capture_content_link.dart';
import '../../../data/models/content_item.dart';
import '../../../data/services/api_service.dart';
import '../../../data/services/capture_local_store.dart';
import '../../../data/services/device_capture_service.dart';
import '../../../l10n/app_localizations.dart';
import '../../../providers/providers.dart';
import 'capture_asset_preview.dart';

class CaptureScreen extends ConsumerStatefulWidget {
  const CaptureScreen({super.key, this.captureService, this.localStore});

  final DeviceCaptureClient? captureService;
  final CaptureLocalStore? localStore;

  @override
  ConsumerState<CaptureScreen> createState() => _CaptureScreenState();
}

class _CaptureScreenState extends ConsumerState<CaptureScreen> {
  late final DeviceCaptureClient _captureService;
  CaptureLocalStore? _store;
  CaptureSupport? _support;
  StreamSubscription<CaptureNativeEvent>? _eventSubscription;
  List<CaptureAsset> _assets = const <CaptureAsset>[];
  List<CaptureContentLink> _links = const <CaptureContentLink>[];
  bool _loading = true;
  bool _busy = false;
  bool _recording = false;
  bool _microphoneEnabled = false;
  int _durationMs = 0;
  int _maxDurationMs = 300000;
  String? _message;
  String? _noticeMessage;

  @override
  void initState() {
    super.initState();
    _captureService = widget.captureService ?? DeviceCaptureService();
    _store = widget.localStore;
    _eventSubscription = _captureService.events.listen(_handleCaptureEvent);
    _load();
  }

  @override
  void dispose() {
    _eventSubscription?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    final support = await _captureService.checkSupport();
    CaptureLocalStore? store = _store;
    if (store == null) {
      final prefs = await SharedPreferences.getInstance();
      store = CaptureLocalStore(prefs);
    }
    if (!mounted) return;
    setState(() {
      _support = support;
      _store = store;
      _assets = store!.loadRecentAssets();
      _links = store.loadContentLinks();
      _loading = false;
    });
  }

  Future<void> _takeScreenshot() async {
    setState(() {
      _busy = true;
      _message = context.tr('Waiting for Android screen capture consent.');
      _noticeMessage = null;
    });
    try {
      final asset = await _captureService.takeScreenshot();
      await _addAsset(asset);
      if (!mounted) return;
      setState(() {
        _message = context.tr('Screenshot saved locally.');
      });
    } catch (error) {
      _showError(error);
    } finally {
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }

  Future<void> _startRecording() async {
    setState(() {
      _busy = true;
      _message = context.tr('Waiting for Android screen capture consent.');
      _noticeMessage = null;
    });
    try {
      await _captureService.startRecording(
        includeMicrophone: _microphoneEnabled,
      );
    } catch (error) {
      _showError(error);
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }

  Future<void> _stopRecording() async {
    setState(() {
      _busy = true;
      _message = context.tr('Finalizing screen recording.');
    });
    try {
      await _captureService.stopRecording();
    } catch (error) {
      _showError(error);
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }

  Future<void> _shareAsset(CaptureAsset asset) async {
    try {
      await _captureService.shareAsset(asset);
    } catch (error) {
      _showError(error);
    }
  }

  Future<void> _discardAsset(CaptureAsset asset) async {
    try {
      await _captureService.deleteAsset(asset);
      final next = await _store!.removeAsset(asset.id);
      if (!mounted) return;
      setState(() {
        _assets = next;
        _links = _store!.loadContentLinks();
      });
    } catch (error) {
      _showError(error);
    }
  }

  Future<void> _addAsset(CaptureAsset asset) async {
    final next = await _store!.addAsset(asset);
    if (!mounted) return;
    setState(() => _assets = next);
  }

  Future<void> _createContentFromAsset(CaptureAsset asset) async {
    final projectId = ref.read(activeProjectIdProvider);
    if (projectId == null || projectId.isEmpty) {
      setState(() {
        _message = context.tr(
          'Choose an active project before creating content.',
        );
      });
      return;
    }

    setState(() {
      _busy = true;
      _message = context.tr('Creating content from capture.');
      _noticeMessage = null;
    });

    try {
      final api = ref.read(apiServiceProvider);
      final item = await api.createContentDraftFromCapture(
        asset: asset,
        projectId: projectId,
      );
      await _store!.linkAssetToContent(
        CaptureContentLink(
          assetId: asset.id,
          contentId: item.id,
          projectId: projectId,
          syncState: CaptureContentLinkSyncState.backendLinked,
          createdAt: DateTime.now(),
        ),
      );
      ref.invalidate(pendingContentProvider);
      if (!mounted) return;
      setState(() {
        _links = _store!.loadContentLinks();
        _busy = false;
        _message = context.tr('Content created from capture.');
      });
      context.go('/editor/${item.id}');
    } catch (error) {
      _showError(error);
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }

  Future<void> _attachAssetToContent(CaptureAsset asset) async {
    final projectId = ref.read(activeProjectIdProvider);
    if (projectId == null || projectId.isEmpty) {
      setState(() {
        _message = context.tr(
          'Choose an active project before linking assets.',
        );
      });
      return;
    }

    final pending =
        ref.read(pendingContentProvider).value ?? const <ContentItem>[];
    final selected = await showModalBottomSheet<ContentItem>(
      context: context,
      showDragHandle: true,
      builder: (context) => _ContentPickerSheet(items: pending),
    );
    if (selected == null) return;

    setState(() {
      _busy = true;
      _message = context.tr('Linking capture to content.');
      _noticeMessage = null;
    });

    var syncState = CaptureContentLinkSyncState.backendLinked;
    String? backendAssetId;
    try {
      final response = await ref
          .read(apiServiceProvider)
          .attachCaptureAssetToContent(contentId: selected.id, asset: asset);
      backendAssetId = response?['id']?.toString();
    } catch (error) {
      if (error is ApiException && error.isOffline) {
        syncState = CaptureContentLinkSyncState.pendingBackend;
        if (mounted) {
          _noticeMessage = context.tr(
            'Backend link is unavailable. The local link stays on this device.',
          );
        }
      } else {
        _showError(error);
        if (mounted) setState(() => _busy = false);
        return;
      }
    }

    await _store!.linkAssetToContent(
      CaptureContentLink(
        assetId: asset.id,
        contentId: selected.id,
        projectId: projectId,
        backendAssetId: backendAssetId,
        syncState: syncState,
        createdAt: DateTime.now(),
      ),
    );
    if (!mounted) return;
    setState(() {
      _links = _store!.loadContentLinks();
      _busy = false;
      _message = context.tr('Capture linked to content.');
    });
  }

  void _handleCaptureEvent(CaptureNativeEvent event) {
    if (!mounted) return;
    switch (event.type) {
      case CaptureEventType.recording:
        setState(() {
          _recording = true;
          _busy = false;
          _durationMs = event.durationMs ?? 0;
          _maxDurationMs = event.maxDurationMs ?? _maxDurationMs;
          _microphoneEnabled = event.microphoneEnabled ?? _microphoneEnabled;
          _message = context.tr('Screen recording is active.');
        });
      case CaptureEventType.progress:
        setState(() {
          _durationMs = event.durationMs ?? _durationMs;
          _maxDurationMs = event.maxDurationMs ?? _maxDurationMs;
          _message = event.message ?? _message;
        });
      case CaptureEventType.completed:
        final asset = event.asset;
        setState(() {
          _recording = false;
          _busy = false;
          _durationMs = 0;
          _message = context.tr('Capture saved locally.');
          _noticeMessage = null;
        });
        if (asset != null) {
          unawaited(_addAsset(asset));
        }
      case CaptureEventType.failed:
        setState(() {
          _busy = false;
          if (event.recoverable) {
            _noticeMessage = event.message;
          } else {
            _message =
                event.message ??
                context.tr('Capture could not complete. You can try again.');
          }
        });
      case CaptureEventType.canceled:
        setState(() {
          _busy = false;
          _recording = false;
          _message =
              event.message ??
              context.tr(
                'Screen capture was canceled before a file was saved.',
              );
          _noticeMessage = null;
        });
      case CaptureEventType.notice:
        setState(() {
          _noticeMessage = event.message;
        });
    }
  }

  void _showError(Object error) {
    if (!mounted) return;
    setState(() {
      _message = error is CaptureException
          ? error.message
          : context.tr('Capture could not complete. You can try again.');
    });
  }

  @override
  Widget build(BuildContext context) {
    final support = _support;
    final contentItems =
        ref.watch(pendingContentProvider).value ?? const <ContentItem>[];
    return Scaffold(
      appBar: AppBar(title: Text(context.tr('Capture'))),
      body: _loading || support == null
          ? const Center(child: CircularProgressIndicator())
          : support.isSupported
          ? _SupportedCaptureView(
              assets: _assets,
              busy: _busy,
              recording: _recording,
              microphoneEnabled: _microphoneEnabled,
              durationMs: _durationMs,
              maxDurationMs: _maxDurationMs,
              message: _message,
              noticeMessage: _noticeMessage,
              onToggleMicrophone: _recording || _busy
                  ? null
                  : (value) => setState(() => _microphoneEnabled = value),
              onScreenshot: _busy || _recording ? null : _takeScreenshot,
              onRecord: _busy || _recording ? null : _startRecording,
              onStop: _recording ? _stopRecording : null,
              onShare: _shareAsset,
              onDiscard: _discardAsset,
              onCreateContent: _busy ? null : _createContentFromAsset,
              onAttachContent: _busy ? null : _attachAssetToContent,
              links: _links,
              contentItems: contentItems,
            )
          : _UnsupportedCaptureView(support: support),
    );
  }
}

class _UnsupportedCaptureView extends StatelessWidget {
  const _UnsupportedCaptureView({required this.support});

  final CaptureSupport support;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 460),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.phonelink_off_rounded,
                size: 56,
                color: theme.colorScheme.outline,
              ),
              const SizedBox(height: 16),
              Text(
                context.tr('Android capture only'),
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                support.reason ??
                    context.tr(
                      'Device screen capture is available only in the Android app for now.',
                    ),
                textAlign: TextAlign.center,
                style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SupportedCaptureView extends StatelessWidget {
  const _SupportedCaptureView({
    required this.assets,
    required this.busy,
    required this.recording,
    required this.microphoneEnabled,
    required this.durationMs,
    required this.maxDurationMs,
    required this.message,
    required this.noticeMessage,
    required this.onToggleMicrophone,
    required this.onScreenshot,
    required this.onRecord,
    required this.onStop,
    required this.onShare,
    required this.onDiscard,
    required this.onCreateContent,
    required this.onAttachContent,
    required this.links,
    required this.contentItems,
  });

  final List<CaptureAsset> assets;
  final bool busy;
  final bool recording;
  final bool microphoneEnabled;
  final int durationMs;
  final int maxDurationMs;
  final String? message;
  final String? noticeMessage;
  final ValueChanged<bool>? onToggleMicrophone;
  final VoidCallback? onScreenshot;
  final VoidCallback? onRecord;
  final VoidCallback? onStop;
  final ValueChanged<CaptureAsset> onShare;
  final ValueChanged<CaptureAsset> onDiscard;
  final ValueChanged<CaptureAsset>? onCreateContent;
  final ValueChanged<CaptureAsset>? onAttachContent;
  final List<CaptureContentLink> links;
  final List<ContentItem> contentItems;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Wrap(
          spacing: 8,
          runSpacing: 8,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            FilledButton.icon(
              onPressed: onScreenshot,
              icon: const Icon(Icons.photo_camera_rounded),
              label: Text(context.tr('Screenshot')),
            ),
            FilledButton.tonalIcon(
              onPressed: onRecord,
              icon: const Icon(Icons.fiber_manual_record_rounded),
              label: Text(context.tr('Record')),
            ),
            if (recording)
              OutlinedButton.icon(
                onPressed: onStop,
                icon: const Icon(Icons.stop_rounded),
                label: Text(context.tr('Stop')),
              ),
            FilterChip(
              selected: microphoneEnabled,
              onSelected: onToggleMicrophone,
              avatar: Icon(
                microphoneEnabled ? Icons.mic_rounded : Icons.mic_off_rounded,
                size: 18,
              ),
              label: Text(context.tr('Mic')),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (busy) const LinearProgressIndicator(),
        if (recording) ...[
          const SizedBox(height: 12),
          LinearProgressIndicator(
            value: maxDurationMs <= 0 ? null : durationMs / maxDurationMs,
          ),
          const SizedBox(height: 8),
          Text(
            '${_formatDuration(durationMs)} / ${_formatDuration(maxDurationMs)}',
            style: TextStyle(
              color: theme.colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
        if (message != null) ...[
          const SizedBox(height: 12),
          Text(
            message!,
            style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
          ),
        ],
        if (noticeMessage != null) ...[
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                Icons.info_outline_rounded,
                size: 18,
                color: theme.colorScheme.tertiary,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  noticeMessage!,
                  style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
                ),
              ),
            ],
          ),
        ],
        const SizedBox(height: 24),
        Text(
          context.tr('Local captures'),
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 12),
        if (assets.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 32),
            child: Center(
              child: Text(
                context.tr('No local captures yet.'),
                style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
              ),
            ),
          )
        else
          for (final asset in assets)
            _CaptureAssetCard(
              asset: asset,
              link: _linkForAsset(asset.id),
              linkedContent: _contentForAsset(asset.id),
              onShare: () => onShare(asset),
              onDiscard: () => onDiscard(asset),
              onCreateContent: onCreateContent == null
                  ? null
                  : () => onCreateContent!(asset),
              onAttachContent: onAttachContent == null
                  ? null
                  : () => onAttachContent!(asset),
            ),
      ],
    );
  }

  CaptureContentLink? _linkForAsset(String assetId) {
    for (final link in links) {
      if (link.assetId == assetId) return link;
    }
    return null;
  }

  ContentItem? _contentForAsset(String assetId) {
    final link = _linkForAsset(assetId);
    if (link == null) return null;
    for (final item in contentItems) {
      if (item.id == link.contentId) return item;
    }
    return null;
  }
}

class _CaptureAssetCard extends StatelessWidget {
  const _CaptureAssetCard({
    required this.asset,
    required this.link,
    required this.linkedContent,
    required this.onShare,
    required this.onDiscard,
    required this.onCreateContent,
    required this.onAttachContent,
  });

  final CaptureAsset asset;
  final CaptureContentLink? link;
  final ContentItem? linkedContent;
  final VoidCallback onShare;
  final VoidCallback onDiscard;
  final VoidCallback? onCreateContent;
  final VoidCallback? onAttachContent;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 96,
              height: 96,
              child: buildCaptureAssetPreview(asset),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    asset.isScreenshot
                        ? context.tr('Screenshot')
                        : context.tr('Recording'),
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    [
                      '${asset.width}x${asset.height}',
                      _formatBytes(asset.byteSize),
                      if (asset.durationMs != null)
                        _formatDuration(asset.durationMs!),
                      if (asset.microphoneEnabled) context.tr('Mic on'),
                    ].join(' - '),
                    style: TextStyle(
                      color: theme.colorScheme.onSurfaceVariant,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 8),
                  if (link != null) ...[
                    Text(
                      linkedContent == null
                          ? context.tr('Linked to content')
                          : context.tr('Linked to {title}', {
                              'title': linkedContent!.title,
                            }),
                      style: TextStyle(
                        color: theme.colorScheme.primary,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],
                  Wrap(
                    spacing: 4,
                    runSpacing: 4,
                    children: [
                      IconButton.filled(
                        tooltip: context.tr('Create content'),
                        onPressed: onCreateContent,
                        icon: const Icon(Icons.note_add_rounded),
                      ),
                      IconButton.filledTonal(
                        tooltip: context.tr('Link to content'),
                        onPressed: onAttachContent,
                        icon: const Icon(Icons.playlist_add_rounded),
                      ),
                      IconButton.filledTonal(
                        tooltip: context.tr('Share'),
                        onPressed: onShare,
                        icon: const Icon(Icons.ios_share_rounded),
                      ),
                      IconButton(
                        tooltip: context.tr('Discard'),
                        onPressed: onDiscard,
                        icon: const Icon(Icons.delete_outline_rounded),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ContentPickerSheet extends StatelessWidget {
  const _ContentPickerSheet({required this.items});

  final List<ContentItem> items;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SafeArea(
      child: ListView(
        shrinkWrap: true,
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        children: [
          Text(
            context.tr('Link to content'),
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          if (items.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Text(
                context.tr('No pending content is available for this project.'),
                style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
              ),
            )
          else
            for (final item in items)
              ListTile(
                leading: const Icon(Icons.article_outlined),
                title: Text(item.title),
                subtitle: Text(item.typeLabel),
                onTap: () => Navigator.of(context).pop(item),
              ),
        ],
      ),
    );
  }
}

String _formatDuration(int ms) {
  final duration = Duration(milliseconds: ms);
  final minutes = duration.inMinutes.remainder(60).toString().padLeft(2, '0');
  final seconds = duration.inSeconds.remainder(60).toString().padLeft(2, '0');
  return '$minutes:$seconds';
}

String _formatBytes(int bytes) {
  if (bytes >= 1024 * 1024) {
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
  if (bytes >= 1024) {
    return '${(bytes / 1024).toStringAsFixed(1)} KB';
  }
  return '$bytes B';
}

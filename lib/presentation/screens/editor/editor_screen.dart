import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../data/models/content_audit.dart';
import '../../../data/models/content_item.dart';
import '../../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_error_view.dart';
import 'platform_preview_sheet.dart';

class EditorScreen extends ConsumerStatefulWidget {
  final String contentId;

  const EditorScreen({super.key, required this.contentId});

  @override
  ConsumerState<EditorScreen> createState() => _EditorScreenState();
}

class _EditorScreenState extends ConsumerState<EditorScreen> {
  late TextEditingController _titleController;
  late TextEditingController _bodyController;
  bool _isEditing = false;
  bool _isPreview = true;
  bool _hasChanges = false;

  ContentItem? _item;
  bool _bodyLoaded = false;
  Future<ContentAuditTrail>? _auditFuture;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController();
    _bodyController = TextEditingController();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _bodyController.dispose();
    super.dispose();
  }

  void _initFromItem(ContentItem item) {
    if (_item?.id != item.id) {
      _item = item;
      _titleController.text = item.title;
      _bodyController.text = item.body;
      _hasChanges = false;
      _bodyLoaded = item.body.isNotEmpty;
      _auditFuture = _loadAuditTrail(item.id);
      // If body is empty/preview only, fetch full body from API
      if (!_bodyLoaded) {
        _loadFullBody(item.id);
      }
    }
  }

  Future<ContentAuditTrail> _loadAuditTrail(String contentId) async {
    final api = ref.read(apiServiceProvider);
    return api.fetchContentAuditTrail(contentId);
  }

  Future<void> _loadFullBody(String contentId) async {
    try {
      final api = ref.read(apiServiceProvider);
      final body = await api.fetchContentBody(contentId);
      if (body != null && mounted) {
        setState(() {
          _bodyController.text = body;
          _bodyLoaded = true;
        });
      }
    } catch (error, stackTrace) {
      if (mounted) {
        showDiagnosticSnackBar(
          context,
          ref,
          message: 'Could not load full content: $error',
          scope: 'editor.load_full_content',
          error: error,
          stackTrace: stackTrace,
          contextData: {'contentId': contentId},
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final contentAsync = ref.watch(pendingContentProvider);

    return contentAsync.when(
      loading: () =>
          const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (error, stackTrace) => Scaffold(
        appBar: AppBar(title: const Text('Error')),
        body: Center(
          child: AppErrorView(
            scope: 'editor.load_pending_content',
            title: 'Could not open the editor',
            error: error,
            stackTrace: stackTrace,
            onRetry: () => ref.invalidate(pendingContentProvider),
          ),
        ),
      ),
      data: (items) {
        final item = items.where((c) => c.id == widget.contentId).firstOrNull;
        if (item == null) {
          return Scaffold(
            appBar: AppBar(),
            body: const Center(child: Text('Content not found')),
          );
        }

        _initFromItem(item);

        return Scaffold(
          appBar: _buildAppBar(item),
          body: _buildBody(item),
          bottomNavigationBar: _buildBottomBar(item),
        );
      },
    );
  }

  PreferredSizeWidget _buildAppBar(ContentItem item) {
    final typeColor = AppTheme.colorForContentType(item.typeLabel);

    return AppBar(
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_rounded),
        onPressed: () {
          if (_hasChanges) {
            _showDiscardDialog();
          } else {
            context.pop();
          }
        },
      ),
      title: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: typeColor.withAlpha(40),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              item.typeLabel,
              style: TextStyle(color: typeColor, fontSize: 13),
            ),
          ),
          if (item.projectName != null) ...[
            const SizedBox(width: 8),
            Text(
              item.projectName!,
              style: TextStyle(
                fontSize: 13,
                color: Colors.white.withAlpha(120),
              ),
            ),
          ],
        ],
      ),
      actions: [
        // Platform preview
        if (item.channels.isNotEmpty)
          IconButton(
            icon: const Icon(Icons.devices_rounded),
            tooltip: 'Platform preview',
            onPressed: () => _showPlatformPreview(item),
          ),
        // Toggle edit/preview
        IconButton(
          icon: Icon(_isPreview ? Icons.edit_rounded : Icons.visibility_rounded),
          tooltip: _isPreview ? 'Edit' : 'Preview',
          onPressed: () => setState(() {
            _isPreview = !_isPreview;
            _isEditing = !_isPreview;
          }),
        ),
      ],
    );
  }

  Widget _buildBody(ContentItem item) {
    return Column(
      children: [
        // Title
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
          child: _isEditing
              ? TextField(
                  controller: _titleController,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                  decoration: const InputDecoration(
                    hintText: 'Title',
                    border: InputBorder.none,
                    filled: false,
                  ),
                  onChanged: (_) => setState(() => _hasChanges = true),
                )
              : Text(
                  _titleController.text,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
        ),
        // Channels
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            children: [
              Icon(Icons.send_rounded,
                  size: 14, color: Colors.white.withAlpha(80)),
              const SizedBox(width: 8),
              ...item.channels.map((ch) => Container(
                    margin: const EdgeInsets.only(right: 6),
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.white.withAlpha(15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      ch.name,
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.white.withAlpha(120),
                      ),
                    ),
                  )),
            ],
          ),
        ),
        // Format-specific metadata bar
        if (_item != null) _buildFormatMetaBar(_item!),
        if (_auditFuture != null) _buildAuditPanel(),
        const SizedBox(height: 12),
        const Divider(height: 1, color: Colors.white12),
        // Body content
        Expanded(
          child: _isEditing
              ? Padding(
                  padding: const EdgeInsets.all(20),
                  child: TextField(
                    controller: _bodyController,
                    maxLines: null,
                    expands: true,
                    style: TextStyle(
                      fontSize: 15,
                      color: Colors.white.withAlpha(220),
                      height: 1.7,
                    ),
                    decoration: const InputDecoration(
                      hintText: 'Content body...',
                      border: InputBorder.none,
                      filled: false,
                    ),
                    onChanged: (_) => setState(() => _hasChanges = true),
                  ),
                )
              : Padding(
                  padding: const EdgeInsets.all(20),
                  child: Markdown(
                    data: _bodyController.text,
                    selectable: true,
                    styleSheet: MarkdownStyleSheet(
                      p: TextStyle(
                        fontSize: 15,
                        color: Colors.white.withAlpha(220),
                        height: 1.7,
                      ),
                      h1: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                      h2: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                      h3: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                      code: TextStyle(
                        backgroundColor: Colors.white.withAlpha(15),
                        color: const Color(0xFF6C5CE7),
                        fontSize: 14,
                      ),
                      codeblockDecoration: BoxDecoration(
                        color: Colors.white.withAlpha(10),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      blockquoteDecoration: BoxDecoration(
                        border: Border(
                          left: BorderSide(
                            color: Colors.white.withAlpha(40),
                            width: 3,
                          ),
                        ),
                      ),
                      listBullet: TextStyle(
                        color: Colors.white.withAlpha(180),
                      ),
                    ),
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildFormatMetaBar(ContentItem item) {
    final chips = <Widget>[];

    switch (item.type) {
      case ContentType.blogPost:
        if (item.seoKeyword != null) {
          chips.add(_editorChip(Icons.search, 'SEO: ${item.seoKeyword}'));
        }
        if (item.seoVolume != null) {
          chips.add(_editorChip(Icons.trending_up, '${item.seoVolume} vol'));
        }
      case ContentType.short:
        if (item.shortPlatform != null) {
          chips.add(_editorChip(Icons.play_arrow_rounded, item.shortPlatform!));
        }
        if (item.shortDuration != null) {
          chips.add(_editorChip(Icons.timer_outlined, '${item.shortDuration}s'));
        }
        if (item.shortHashtags.isNotEmpty) {
          chips.add(_editorChip(Icons.tag, item.shortHashtags.take(3).join(' ')));
        }
      case ContentType.socialPost:
        for (final p in item.socialPlatforms) {
          chips.add(_editorChip(Icons.public, p));
        }
      case ContentType.newsletter:
        // Newsletter-specific: could show subject line, CTA etc.
        break;
      case ContentType.videoScript || ContentType.reel:
        break;
    }

    if (item.narrativeThread != null) {
      chips.add(_editorChip(Icons.auto_stories, item.narrativeThread!));
    }
    if (item.angleConfidence != null) {
      chips.add(_editorChip(Icons.psychology, '${item.angleConfidence}% conf'));
    }

    if (chips.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Wrap(
        spacing: 8,
        runSpacing: 4,
        children: chips,
      ),
    );
  }

  Widget _editorChip(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(10),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white.withAlpha(25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: Colors.white.withAlpha(140)),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextStyle(fontSize: 12, color: Colors.white.withAlpha(160)),
          ),
        ],
      ),
    );
  }

  Widget _buildAuditPanel() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
      child: FutureBuilder<ContentAuditTrail>(
        future: _auditFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return _auditContainer(
              child: Row(
                children: [
                  const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    'Loading audit trail...',
                    style: TextStyle(color: Colors.white.withAlpha(150)),
                  ),
                ],
              ),
            );
          }

          if (snapshot.hasError) {
            return _auditContainer(
              child: Text(
                'Audit trail unavailable: ${snapshot.error}',
                style: TextStyle(color: AppTheme.rejectColor),
              ),
            );
          }

          final trail = snapshot.data ?? const ContentAuditTrail(transitions: [], edits: []);
          if (trail.isEmpty) {
            return _auditContainer(
              child: Text(
                'No audit events yet.',
                style: TextStyle(color: Colors.white.withAlpha(150)),
              ),
            );
          }

          return _auditContainer(
            child: Theme(
              data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
              child: ExpansionTile(
                tilePadding: EdgeInsets.zero,
                childrenPadding: EdgeInsets.zero,
                title: const Text(
                  'Audit Trail',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                subtitle: Text(
                  '${trail.transitions.length} transitions • ${trail.edits.length} edits',
                  style: TextStyle(color: Colors.white.withAlpha(130)),
                ),
                trailing: IconButton(
                  tooltip: 'Copy audit trail',
                  onPressed: () => _copyAuditTrail(trail),
                  icon: Icon(Icons.copy_rounded, color: Colors.white.withAlpha(170)),
                ),
                children: [
                  if (trail.transitions.isNotEmpty) ...[
                    _auditSectionTitle('Status transitions'),
                    ...trail.transitions.take(8).map(_buildTransitionTile),
                  ],
                  if (trail.edits.isNotEmpty) ...[
                    _auditSectionTitle('Body edits'),
                    ...trail.edits.take(8).map(_buildEditTile),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _auditContainer({required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(8),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withAlpha(18)),
      ),
      child: child,
    );
  }

  Widget _auditSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(top: 4, bottom: 8),
      child: Text(
        title,
        style: TextStyle(
          color: Colors.white.withAlpha(180),
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  Widget _buildTransitionTile(ContentStatusChange event) {
    return _auditEventTile(
      icon: Icons.swap_horiz_rounded,
      accent: const Color(0xFFFDAA5E),
      title: '${event.fromStatus} → ${event.toStatus}',
      actor: event.actor,
      timestamp: event.timestamp,
      note: event.reason,
    );
  }

  Widget _buildEditTile(ContentEditEvent event) {
    return _auditEventTile(
      icon: Icons.edit_note_rounded,
      accent: AppTheme.editColor,
      title: 'v${event.previousVersion} → v${event.newVersion}',
      actor: event.actor,
      timestamp: event.createdAt,
      note: event.editNote,
    );
  }

  Widget _auditEventTile({
    required IconData icon,
    required Color accent,
    required String title,
    required AuditActor actor,
    required DateTime timestamp,
    String? note,
  }) {
    final date = DateFormat('MMM d, HH:mm').format(timestamp.toLocal());
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(6),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withAlpha(10)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: accent.withAlpha(30),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 16, color: accent),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '${actor.actorLabel} (${actor.actorType}:${actor.actorId})',
                      style: TextStyle(
                        color: Colors.white.withAlpha(150),
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                date,
                style: TextStyle(
                  color: Colors.white.withAlpha(120),
                  fontSize: 11,
                ),
              ),
            ],
          ),
          if (note != null && note.trim().isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              note.trim(),
              style: TextStyle(
                color: Colors.white.withAlpha(165),
                fontSize: 12,
                height: 1.4,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _copyAuditTrail(ContentAuditTrail trail) async {
    final lines = <String>[
      'ContentFlow audit trail',
      if (_item != null) 'content_id: ${_item!.id}',
      if (_item != null) 'title: ${_item!.title}',
      'transitions: ${trail.transitions.length}',
      ...trail.transitions.map(
        (event) =>
            '- transition ${event.fromStatus} -> ${event.toStatus} | actor=${event.actor.actorType}:${event.actor.actorId} | label=${event.actor.actorLabel} | at=${event.timestamp.toIso8601String()}${event.reason == null ? '' : ' | reason=${event.reason}'}',
      ),
      'edits: ${trail.edits.length}',
      ...trail.edits.map(
        (event) =>
            '- edit v${event.previousVersion} -> v${event.newVersion} | actor=${event.actor.actorType}:${event.actor.actorId} | label=${event.actor.actorLabel} | at=${event.createdAt.toIso8601String()}${event.editNote == null ? '' : ' | note=${event.editNote}'}',
      ),
    ];
    await Clipboard.setData(ClipboardData(text: lines.join('\n')));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Audit trail copied'),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  Widget _buildBottomBar(ContentItem item) {
    return Container(
      padding: EdgeInsets.fromLTRB(
          20, 12, 20, 12 + MediaQuery.of(context).padding.bottom),
      decoration: const BoxDecoration(
        color: Color(0xFF1A1A2E),
        border: Border(top: BorderSide(color: Colors.white12)),
      ),
      child: Row(
        children: [
          // Reject button
          Expanded(
            child: OutlinedButton.icon(
              onPressed: () => _reject(item),
              icon: const Icon(Icons.close_rounded),
              label: const Text('Skip'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.rejectColor,
                side: BorderSide(color: AppTheme.rejectColor.withAlpha(100)),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Publish button
          Expanded(
            flex: 2,
            child: FilledButton.icon(
              onPressed: () => _publish(item),
              icon: const Icon(Icons.send_rounded),
              label: Text(_hasChanges ? 'Save & Publish' : 'Publish'),
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.approveColor,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _publish(ContentItem item) async {
    if (_hasChanges) {
      try {
        final api = ref.read(apiServiceProvider);
        await api.updateContent(item.id, title: _titleController.text);
        await api.saveContentBody(item.id, _bodyController.text);

        final updated = item.copyWith(
          title: _titleController.text,
          body: _bodyController.text,
        );
        ref.read(pendingContentProvider.notifier).updateItem(updated);
      } catch (error, stackTrace) {
        if (!mounted) return;
        showDiagnosticSnackBar(
          context,
          ref,
          message: 'Could not save changes: $error',
          scope: 'editor.save_changes',
          error: error,
          stackTrace: stackTrace,
          contextData: {'contentId': item.id},
          backgroundColor: Colors.orange.withAlpha(200),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        );
        return;
      }
    }
    final result = await ref.read(pendingContentProvider.notifier).approve(item.id);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(result.message),
        backgroundColor: _colorForApproveSeverity(result.severity).withAlpha(200),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
    context.pop();
  }

  void _reject(ContentItem item) {
    ref.read(pendingContentProvider.notifier).reject(item.id);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Skipped: ${item.title}'),
        backgroundColor: AppTheme.rejectColor.withAlpha(200),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
    context.pop();
  }

  void _showPlatformPreview(ContentItem item) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => PlatformPreviewSheet(
        title: _titleController.text,
        body: _bodyController.text,
        channels: item.channels,
        type: item.type,
      ),
    );
  }

  void _showDiscardDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A2E),
        title: const Text('Discard changes?'),
        content: const Text('You have unsaved edits.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Keep editing'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.pop();
            },
            child: Text('Discard',
                style: TextStyle(color: AppTheme.rejectColor)),
          ),
        ],
      ),
    );
  }

  Color _colorForApproveSeverity(ApproveSeverity severity) => switch (severity) {
        ApproveSeverity.success => AppTheme.approveColor,
        ApproveSeverity.info => Colors.blue,
        ApproveSeverity.warning => Colors.orange,
        ApproveSeverity.error => AppTheme.rejectColor,
      };
}

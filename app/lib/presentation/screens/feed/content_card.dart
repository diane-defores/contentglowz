import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/models/content_item.dart';
import '../../../data/models/offline_sync.dart';
import '../../../l10n/app_localizations.dart';
import '../../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/offline_sync_status_chip.dart';

class ContentCard extends ConsumerWidget {
  final ContentItem item;
  final VoidCallback? onTap;

  const ContentCard({super.key, required this.item, this.onTap});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final typeColor = AppTheme.colorForContentType(item.typeLabel);
    final palette = AppTheme.paletteOf(context);
    final isVideoCard = item.isVideoType;
    final syncInfo = ref.watch(
      offlineEntitySyncProvider(offlineEntityKey('content', item.id)),
    );

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: palette.elevatedSurface,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: typeColor.withAlpha(80), width: 1.5),
          boxShadow: [
            BoxShadow(
              color: typeColor.withAlpha(30),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with type badge and project
            _buildHeader(context, typeColor, syncInfo),
            // Format-specific metadata chips
            if (_hasFormatMeta()) _buildFormatMeta(typeColor),
            // Dedicated media preview
            if (isVideoCard)
              _buildVideoMediaPreview(context, typeColor)
            else if (item.imageUrl != null)
              _buildImage(context),
            // Content preview
            if (!isVideoCard)
              Expanded(child: _buildBody(context)),
            // Format-aware review template
            if (isVideoCard)
              _buildVideoReviewCard(context, typeColor)
            else
              _buildReviewTemplate(context, typeColor),
            // Footer with channels and timestamp
            _buildFooter(context, typeColor),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(
    BuildContext context,
    Color typeColor,
    OfflineEntitySyncInfo? syncInfo,
  ) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: typeColor.withAlpha(40),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(_iconForType(item.type), size: 14, color: typeColor),
                const SizedBox(width: 6),
                Text(
                  item.typeLabel,
                  style: TextStyle(
                    color: typeColor,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          const Spacer(),
          if (syncInfo != null) ...[
            OfflineSyncStatusChip(info: syncInfo, compact: true),
            const SizedBox(width: 8),
          ],
          if (item.projectName != null)
            Text(
              item.projectName!,
              style: TextStyle(
                color: theme.colorScheme.onSurfaceVariant,
                fontSize: 12,
              ),
            ),
        ],
      ),
    );
  }

  bool _hasFormatMeta() {
    if (item.isVideoType) {
      return false;
    }
    return item.seoKeyword != null ||
        item.shortPlatform != null ||
        item.socialPlatforms.isNotEmpty ||
        item.narrativeThread != null ||
        item.generationReason != null ||
        item.isContentComplete;
  }

  Widget _buildFormatMeta(Color typeColor) {
    final chips = <Widget>[];

    // SEO keyword chip (articles)
    if (item.seoKeyword != null) {
      chips.add(_metaChip(Icons.search, item.seoKeyword!, typeColor));
      if (item.seoVolume != null) {
        final diffLabel = item.seoDifficulty != null
            ? ' / KD ${item.seoDifficulty}'
            : '';
        chips.add(
          _metaChip(
            Icons.trending_up,
            '${item.seoVolume} vol$diffLabel',
            AppTheme.approveColor,
          ),
        );
      }
    }

    // Generation reason chip (why this content was created)
    if (item.generationReason != null && item.seoKeyword == null) {
      chips.add(
        _metaChip(
          Icons.lightbulb_outline,
          item.generationReason!,
          AppTheme.warningColor,
        ),
      );
    }

    if (item.isContentComplete) {
      chips.add(
        _metaChip(Icons.done_all_rounded, 'Complete', AppTheme.approveColor),
      );
    }

    // Short platform + duration
    if (item.shortPlatform != null) {
      chips.add(
        _metaChip(Icons.play_arrow_rounded, item.shortPlatform!, typeColor),
      );
      if (item.shortDuration != null) {
        chips.add(
          _metaChip(
            Icons.timer_outlined,
            '${item.shortDuration}s',
            AppTheme.warningColor,
          ),
        );
      }
    }

    // Social platforms
    if (item.socialPlatforms.isNotEmpty) {
      for (final p in item.socialPlatforms) {
        chips.add(_metaChip(_iconForPlatform(p), p, typeColor));
      }
    }

    // Narrative thread
    if (item.narrativeThread != null) {
      chips.add(
        _metaChip(
          Icons.auto_stories,
          item.narrativeThread!,
          AppTheme.infoColor,
        ),
      );
    }

    if (chips.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 0),
      child: Wrap(spacing: 6, runSpacing: 4, children: chips),
    );
  }

  Widget _metaChip(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withAlpha(40)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color.withAlpha(180)),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(fontSize: 11, color: color.withAlpha(200)),
          ),
        ],
      ),
    );
  }

  IconData _iconForPlatform(String platform) {
    return switch (platform.toLowerCase()) {
      'twitter' || 'x' => Icons.alternate_email,
      'linkedin' => Icons.work_outline,
      'instagram' => Icons.camera_alt_outlined,
      'tiktok' => Icons.music_note,
      'youtube' || 'youtube_shorts' => Icons.play_circle_outline,
      _ => Icons.public,
    };
  }

  Widget _buildImage(BuildContext context) {
    final palette = AppTheme.paletteOf(context);
    return Container(
      height: 180,
      margin: const EdgeInsets.fromLTRB(20, 12, 20, 0),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: palette.mutedSurface,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Image.network(
          item.imageUrl!,
          fit: BoxFit.cover,
          width: double.infinity,
          errorBuilder: (_, _, _) => Center(
            child: Icon(
              Icons.image_outlined,
              color: Theme.of(context).colorScheme.outlineVariant,
              size: 48,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildVideoMediaPreview(BuildContext context, Color typeColor) {
    final palette = AppTheme.paletteOf(context);
    final theme = Theme.of(context);
    final status = _videoStatusPresentation(context, item.videoFeedState);
    final previewImageUrl = item.videoPreviewImageUrl;
    final previewCaption = item.videoPlaybackUrl != null
        ? context.tr('Playback ready')
        : item.isVideoReadyToPublish
        ? context.tr('Preview ready')
        : context.tr('Preview pending');

    return Container(
      key: Key('video-preview-${item.id}'),
      height: 124,
      margin: const EdgeInsets.fromLTRB(20, 12, 20, 0),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        color: palette.mutedSurface,
        gradient: previewImageUrl == null
            ? LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  status.color.withValues(alpha: 0.24),
                  palette.mutedSurface,
                  typeColor.withValues(alpha: 0.12),
                ],
              )
            : null,
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (previewImageUrl != null)
            Image.network(
              previewImageUrl,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => _buildVideoPreviewFallback(
                context,
                theme,
                status,
              ),
            )
          else
            _buildVideoPreviewFallback(context, theme, status),
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black.withValues(alpha: 0.08),
                  Colors.black.withValues(alpha: 0.1),
                  Colors.black.withValues(alpha: 0.55),
                ],
              ),
            ),
          ),
          Positioned(
            top: 12,
            left: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.42),
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: Colors.white.withValues(alpha: 0.18)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.smart_display_rounded, size: 14, color: Colors.white),
                  const SizedBox(width: 6),
                  Text(
                    context.tr('Video preview'),
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            top: 12,
            right: 12,
            child: TextButton.icon(
              key: Key('edit-video-${item.id}'),
              onPressed: onTap,
              style: TextButton.styleFrom(
                foregroundColor: Colors.white,
                backgroundColor: Colors.black.withValues(alpha: 0.42),
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 8,
                ),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                visualDensity: VisualDensity.compact,
              ),
              icon: const Icon(Icons.edit_rounded, size: 14),
              label: Text(context.tr('Edit video')),
            ),
          ),
          Center(
            child: Container(
              width: 58,
              height: 58,
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.42),
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
              ),
              child: Icon(
                item.isVideoReadyToPublish
                    ? Icons.play_arrow_rounded
                    : Icons.hourglass_top_rounded,
                color: Colors.white,
                size: 34,
              ),
            ),
          ),
          Positioned(
            left: 14,
            right: 14,
            bottom: 14,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        previewCaption,
                        style: theme.textTheme.labelLarge?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        status.label,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: Colors.white.withValues(alpha: 0.86),
                          height: 1.2,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: status.color.withValues(alpha: 0.88),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    status.label,
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVideoPreviewFallback(
    BuildContext context,
    ThemeData theme,
    _VideoStatusPresentation status,
  ) {
    return Padding(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(status.icon, color: status.color, size: 28),
          const Spacer(),
          Text(
            item.title,
            style: theme.textTheme.titleMedium?.copyWith(
              color: theme.colorScheme.onSurface,
              fontWeight: FontWeight.w800,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 6),
          Text(
            item.summary?.trim().isNotEmpty == true
                ? item.summary!.trim()
                : item.videoPreflightSummary,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
              height: 1.3,
            ),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildBody(BuildContext context) {
    final theme = Theme.of(context);
    final summary = item.summary?.trim();
    final previewText = summary != null && summary.isNotEmpty
        ? item.summary!
        : _truncateBody(item.body);
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxHeight < 44) {
          return const SizedBox.shrink();
        }
        final showPreview = constraints.maxHeight >= 110;
        final titleLines = constraints.maxHeight < 72 ? 1 : 2;
        final previewLines = switch (constraints.maxHeight) {
          < 140 => item.isVideoType ? 1 : 2,
          < 180 => item.isVideoType ? 2 : 3,
          _ => item.isVideoType ? 3 : 5,
        };
        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
          child: ClipRect(
            child: SingleChildScrollView(
              physics: const NeverScrollableScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    item.title,
                    style: TextStyle(
                      color: theme.colorScheme.onSurface,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      height: 1.3,
                    ),
                    maxLines: titleLines,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (showPreview) ...[
                    const SizedBox(height: 10),
                    Text(
                      previewText,
                      style: TextStyle(
                        color: theme.colorScheme.onSurfaceVariant,
                        fontSize: 14,
                        height: 1.6,
                      ),
                      maxLines: previewLines,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildFooter(BuildContext context, Color typeColor) {
    final screenWidth = MediaQuery.sizeOf(context).width;
    final showHints = screenWidth > 380 && !item.isVideoType;
    final theme = Theme.of(context);
    final publishHint = item.isVideoType
        ? _videoFooterHint(context)
        : context.tr('Publish');
    final publishHintColor = item.isVideoType && !item.isVideoReadyToPublish
        ? AppTheme.warningColor.withAlpha(170)
        : AppTheme.approveColor.withAlpha(150);

    final footerPadding = item.isVideoType
        ? const EdgeInsets.fromLTRB(20, 10, 20, 10)
        : const EdgeInsets.fromLTRB(20, 12, 20, 16);

    return Container(
      padding: footerPadding,
      child: Row(
        children: [
          // Channel icons
          ...item.channels.map(
            (channel) => Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Icon(
                _iconForChannel(channel),
                size: 18,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          const Spacer(),
          // Swipe hints — hidden on very narrow screens to prevent overflow
          if (showHints)
            Flexible(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.arrow_back_rounded,
                    size: 14,
                    color: AppTheme.rejectColor.withAlpha(150),
                  ),
                  const SizedBox(width: 3),
                  Text(
                    context.tr('Skip'),
                    style: TextStyle(
                      fontSize: 11,
                      color: AppTheme.rejectColor.withAlpha(150),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Icon(
                    Icons.arrow_upward_rounded,
                    size: 14,
                    color: AppTheme.editColor.withAlpha(150),
                  ),
                  const SizedBox(width: 3),
                  Text(
                    context.tr('Edit'),
                    style: TextStyle(
                      fontSize: 11,
                      color: AppTheme.editColor.withAlpha(150),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    publishHint,
                    style: TextStyle(fontSize: 11, color: publishHintColor),
                  ),
                  if (item.isVideoReadyToPublish) ...[
                    const SizedBox(width: 3),
                    Icon(
                      Icons.arrow_forward_rounded,
                      size: 14,
                      color: publishHintColor,
                    ),
                  ],
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildVideoReviewCard(BuildContext context, Color typeColor) {
    final theme = Theme.of(context);
    final state = item.videoFeedState;
    final status = _videoStatusPresentation(context, state);
    final destinations = _videoDestinationSummary(context);
    final preflightSummary = _videoPreflightSummary(context, destinations);

    return Container(
      margin: const EdgeInsets.fromLTRB(20, 8, 20, 0),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: typeColor.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: typeColor.withValues(alpha: 0.18)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: status.color.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(
                    color: status.color.withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(status.icon, size: 14, color: status.color),
                    const SizedBox(width: 6),
                    Text(
                      status.label,
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: status.color,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            status.copy,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurface,
              fontWeight: FontWeight.w600,
              height: 1.35,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 8),
          Text(
            context.tr('Publish preflight'),
            style: theme.textTheme.labelLarge?.copyWith(
              color: theme.colorScheme.onSurface,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            preflightSummary,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
              height: 1.35,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _reviewTemplateChip(
                context,
                _ReviewTemplateStep(Icons.outbound_rounded, destinations),
                typeColor,
              ),
              _reviewTemplateChip(
                context,
                _ReviewTemplateStep(
                  item.isVideoReadyToPublish
                      ? Icons.swipe_right_alt_rounded
                      : Icons.pan_tool_alt_outlined,
                  item.isVideoReadyToPublish
                      ? context.tr('Swipe right to publish')
                      : _videoFooterHint(context),
                ),
                status.color,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildReviewTemplate(BuildContext context, Color typeColor) {
    final template = _templateForType(context);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 10, 20, 0),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: typeColor.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: typeColor.withValues(alpha: 0.18)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: typeColor.withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(template.icon, color: typeColor, size: 17),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      template.title,
                      style: theme.textTheme.labelLarge?.copyWith(
                        color: colorScheme.onSurface,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Text(
                      template.copy,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                        height: 1.25,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final step in template.steps)
                _reviewTemplateChip(context, step, typeColor),
            ],
          ),
        ],
      ),
    );
  }

  Widget _reviewTemplateChip(
    BuildContext context,
    _ReviewTemplateStep step,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 7),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.68),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.18)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(step.icon, size: 13, color: color),
          const SizedBox(width: 5),
          Text(
            step.label,
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurface,
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  _ReviewTemplate _templateForType(BuildContext context) {
    final channels = item.channels.isEmpty
        ? context.tr('channel fit')
        : item.channels.take(2).map((channel) => channel.name).join(' + ');
    return switch (item.type) {
      ContentType.blogPost => _ReviewTemplate(
        icon: Icons.article_outlined,
        title: context.tr('Article review template'),
        copy: context.tr(
          'Check promise, structure, and SEO intent before publish.',
        ),
        steps: [
          _ReviewTemplateStep(
            Icons.search_rounded,
            item.seoKeyword ?? context.tr('SEO intent'),
          ),
          _ReviewTemplateStep(
            Icons.format_align_left_rounded,
            context.tr('Structure'),
          ),
          _ReviewTemplateStep(Icons.link_rounded, context.tr('CTA / links')),
        ],
      ),
      ContentType.newsletter => _ReviewTemplate(
        icon: Icons.mark_email_read_outlined,
        title: context.tr('Newsletter review template'),
        copy: context.tr('Validate subject, sections, and reader action.'),
        steps: [
          _ReviewTemplateStep(Icons.subject_rounded, context.tr('Subject')),
          _ReviewTemplateStep(
            Icons.view_agenda_outlined,
            context.tr('Sections'),
          ),
          _ReviewTemplateStep(Icons.touch_app_outlined, context.tr('CTA')),
        ],
      ),
      ContentType.short || ContentType.reel => _ReviewTemplate(
        icon: Icons.smart_display_outlined,
        title: context.tr('Short-form review template'),
        copy: context.tr('Watch the hook, pacing, and platform fit.'),
        steps: [
          _ReviewTemplateStep(Icons.bolt_rounded, context.tr('Hook')),
          _ReviewTemplateStep(
            Icons.timer_outlined,
            item.shortDuration == null
                ? context.tr('Pacing')
                : '${item.shortDuration}s',
          ),
          _ReviewTemplateStep(
            Icons.tag_rounded,
            item.shortPlatform ?? channels,
          ),
        ],
      ),
      ContentType.videoScript => _ReviewTemplate(
        icon: Icons.video_camera_front_outlined,
        title: context.tr('Video script review template'),
        copy: context.tr('Check opening, beats, and recording clarity.'),
        steps: [
          _ReviewTemplateStep(Icons.play_arrow_rounded, context.tr('Opening')),
          _ReviewTemplateStep(Icons.list_alt_rounded, context.tr('Beats')),
          _ReviewTemplateStep(Icons.mic_none_rounded, context.tr('Voice')),
        ],
      ),
      ContentType.socialPost => _ReviewTemplate(
        icon: Icons.forum_outlined,
        title: context.tr('Social post review template'),
        copy: context.tr('Check the hook, platform nuance, and reply trigger.'),
        steps: [
          _ReviewTemplateStep(Icons.campaign_outlined, context.tr('Hook')),
          _ReviewTemplateStep(Icons.public_rounded, channels),
          _ReviewTemplateStep(
            Icons.question_answer_outlined,
            context.tr('Reply trigger'),
          ),
        ],
      ),
    };
  }

  String _truncateBody(String body) {
    // Remove markdown headers for preview
    return body
        .replaceAll(RegExp(r'^#{1,6}\s+', multiLine: true), '')
        .replaceAll(RegExp(r'\*\*([^*]+)\*\*'), r'\1')
        .replaceAll(RegExp(r'\n{2,}'), '\n');
  }

  IconData _iconForType(ContentType type) {
    return switch (type) {
      ContentType.blogPost => Icons.article_outlined,
      ContentType.socialPost => Icons.chat_bubble_outline,
      ContentType.newsletter => Icons.email_outlined,
      ContentType.videoScript => Icons.videocam_outlined,
      ContentType.reel => Icons.slow_motion_video,
      ContentType.short => Icons.bolt_outlined,
    };
  }

  IconData _iconForChannel(PublishingChannel channel) {
    return switch (channel) {
      PublishingChannel.wordpress => Icons.language,
      PublishingChannel.ghost => Icons.edit_note,
      PublishingChannel.twitter => Icons.alternate_email,
      PublishingChannel.linkedin => Icons.work_outline,
      PublishingChannel.instagram => Icons.camera_alt_outlined,
      PublishingChannel.tiktok => Icons.music_note,
      PublishingChannel.youtube => Icons.play_circle_outline,
    };
  }

  String _videoDestinationSummary(BuildContext context) {
    final channelNames = item.channels.map((channel) => channel.name).toList();
    if (channelNames.isNotEmpty) {
      return context.tr('Destinations: {channels}', {
        'channels': channelNames.join(', '),
      });
    }
    final platformNames = <String>{
      if (item.shortPlatform != null) item.shortPlatform!,
      ...item.socialPlatforms,
    }.toList();
    if (platformNames.isNotEmpty) {
      return context.tr('Destinations: {channels}', {
        'channels': platformNames.join(', '),
      });
    }
    return context.tr('Destinations: to confirm');
  }

  String _videoPreflightSummary(BuildContext context, String destinations) {
    final blockerSummary = item.videoGenerationBlockerSummary?.trim();
    final blockers = item.videoGenerationBlockers;
    return switch (item.videoFeedState) {
      'ready' => context.tr(
        'Publish preflight complete. {destinations}. Swipe right publishes this version.',
        {'destinations': destinations},
      ),
      'rendering' => context.tr(
        'Render still in progress. {destinations}. Publish stays disabled until the final video is ready.',
        {'destinations': destinations},
      ),
      'blocked' =>
        context.tr('Blocked before publish. {destinations}. {reason}', {
          'destinations': destinations,
          'reason': blockerSummary?.isNotEmpty == true
              ? blockerSummary!
              : blockers.isNotEmpty
              ? blockers.join(', ')
              : context.tr('Resolve the publish blocker in the video flow.'),
        }),
      _ => context.tr(
        'Needs review before publish. {destinations}. Open the video editor if you want to adjust this cut.',
        {'destinations': destinations},
      ),
    };
  }

  String _videoFooterHint(BuildContext context) {
    return switch (item.videoFeedState) {
      'ready' => context.tr('Publish'),
      'rendering' => context.tr('Rendering'),
      'blocked' => context.tr('Blocked'),
      _ => context.tr('Needs review'),
    };
  }

  _VideoStatusPresentation _videoStatusPresentation(
    BuildContext context,
    String state,
  ) {
    return switch (state) {
      'ready' => _VideoStatusPresentation(
        label: context.tr('Ready'),
        copy: context.tr(
          'This video is ready for feed-native publish without opening the editor.',
        ),
        color: AppTheme.approveColor,
        icon: Icons.check_circle_rounded,
      ),
      'rendering' => _VideoStatusPresentation(
        label: context.tr('Rendering'),
        copy: context.tr(
          'Background generation is still running. The feed keeps publish disabled until the final asset exists.',
        ),
        color: AppTheme.warningColor,
        icon: Icons.autorenew_rounded,
      ),
      'blocked' => _VideoStatusPresentation(
        label: context.tr('Blocked'),
        copy: context.tr(
          'A publish blocker is already known, so the card explains it before any swipe.',
        ),
        color: AppTheme.rejectColor,
        icon: Icons.block_rounded,
      ),
      _ => _VideoStatusPresentation(
        label: context.tr('Needs review'),
        copy: context.tr(
          'The cut exists but still needs a human check before the feed can promise publish.',
        ),
        color: AppTheme.infoColor,
        icon: Icons.rate_review_outlined,
      ),
    };
  }
}

class _ReviewTemplate {
  const _ReviewTemplate({
    required this.icon,
    required this.title,
    required this.copy,
    required this.steps,
  });

  final IconData icon;
  final String title;
  final String copy;
  final List<_ReviewTemplateStep> steps;
}

class _ReviewTemplateStep {
  const _ReviewTemplateStep(this.icon, this.label);

  final IconData icon;
  final String label;
}

class _VideoStatusPresentation {
  const _VideoStatusPresentation({
    required this.label,
    required this.copy,
    required this.color,
    required this.icon,
  });

  final String label;
  final String copy;
  final Color color;
  final IconData icon;
}

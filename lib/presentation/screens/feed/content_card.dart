import 'package:flutter/material.dart';
import '../../../data/models/content_item.dart';
import '../../theme/app_theme.dart';

class ContentCard extends StatelessWidget {
  final ContentItem item;
  final VoidCallback? onTap;

  const ContentCard({super.key, required this.item, this.onTap});

  @override
  Widget build(BuildContext context) {
    final typeColor = AppTheme.colorForContentType(item.typeLabel);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFF1A1A2E),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: typeColor.withAlpha(80),
            width: 1.5,
          ),
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
            _buildHeader(typeColor),
            // Image if present
            if (item.imageUrl != null) _buildImage(),
            // Content preview
            Expanded(child: _buildBody(context)),
            // Footer with channels and timestamp
            _buildFooter(context, typeColor),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(Color typeColor) {
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
          if (item.projectName != null)
            Text(
              item.projectName!,
              style: TextStyle(
                color: Colors.white.withAlpha(120),
                fontSize: 12,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildImage() {
    return Container(
      height: 180,
      margin: const EdgeInsets.fromLTRB(20, 12, 20, 0),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: Colors.white.withAlpha(10),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Image.network(
          item.imageUrl!,
          fit: BoxFit.cover,
          width: double.infinity,
          errorBuilder: (_, _, _) => const Center(
            child: Icon(Icons.image_outlined, color: Colors.white24, size: 48),
          ),
        ),
      ),
    );
  }

  Widget _buildBody(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            item.title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
              height: 1.3,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 10),
          Expanded(
            child: Text(
              item.summary ?? _truncateBody(item.body),
              style: TextStyle(
                color: Colors.white.withAlpha(170),
                fontSize: 14,
                height: 1.6,
              ),
              overflow: TextOverflow.fade,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFooter(BuildContext context, Color typeColor) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
      child: Row(
        children: [
          // Channel icons
          ...item.channels.map((channel) => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: Icon(
                  _iconForChannel(channel),
                  size: 18,
                  color: Colors.white.withAlpha(120),
                ),
              )),
          const Spacer(),
          // Swipe hints
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.arrow_back_rounded,
                  size: 14, color: AppTheme.rejectColor.withAlpha(150)),
              const SizedBox(width: 4),
              Text('Skip',
                  style: TextStyle(
                      fontSize: 11,
                      color: AppTheme.rejectColor.withAlpha(150))),
              const SizedBox(width: 12),
              Text('Edit',
                  style: TextStyle(
                      fontSize: 11,
                      color: AppTheme.editColor.withAlpha(150))),
              const SizedBox(width: 4),
              Icon(Icons.arrow_upward_rounded,
                  size: 14, color: AppTheme.editColor.withAlpha(150)),
              const SizedBox(width: 12),
              Text('Publish',
                  style: TextStyle(
                      fontSize: 11,
                      color: AppTheme.approveColor.withAlpha(150))),
              const SizedBox(width: 4),
              Icon(Icons.arrow_forward_rounded,
                  size: 14, color: AppTheme.approveColor.withAlpha(150)),
            ],
          ),
        ],
      ),
    );
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
}

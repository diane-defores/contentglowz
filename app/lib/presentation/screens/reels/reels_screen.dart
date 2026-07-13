import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../l10n/app_localizations.dart';
import '../../theme/app_theme.dart';
import '../../widgets/project_picker_action.dart';

class ReelsScreen extends StatelessWidget {
  const ReelsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('Reels')),
        actions: const [ProjectPickerAction()],
      ),
      body: Center(
        child: Padding(
          padding: AppSpacing.page(context),
          child: Card(
            child: Padding(
              padding: AppSpacing.card(context),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.video_library_rounded,
                    color: theme.colorScheme.primary,
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Text(
                    context.tr('Prepare your next video from its sources'),
                    textAlign: TextAlign.center,
                    style: theme.textTheme.titleLarge,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    context.tr(
                      'Open a content item, gather videos, images, audio, text and links, then choose whether to save the sources or generate the video.',
                    ),
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  FilledButton.icon(
                    onPressed: () => context.go('/feed'),
                    icon: const Icon(Icons.arrow_forward_rounded),
                    label: Text(context.tr('Choose content')),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../l10n/app_localizations.dart';
import '../../providers/providers.dart';
import 'app_error_view.dart';

class ProjectPickerAction extends ConsumerWidget {
  const ProjectPickerAction({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projectsState = ref.watch(projectsStateProvider);
    final activeProject = ref.watch(activeProjectProvider);
    final isSwitching = ref.watch(activeProjectControllerProvider).isLoading;
    final activeLabel =
        activeProject?.name ?? context.tr('No project selected');
    final activeColor = Theme.of(context).colorScheme.onSurface;

    if (isSwitching) {
      return const Padding(
        padding: EdgeInsets.symmetric(horizontal: 12),
        child: SizedBox(
          width: 18,
          height: 18,
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
      );
    }

    return PopupMenuButton<String?>(
      tooltip: context.tr('Switch project'),
      onSelected: (projectId) async {
        if (projectId == activeProject?.id) {
          return;
        }
        try {
          await ref
              .read(activeProjectControllerProvider.notifier)
              .setActiveProject(projectId);
        } catch (error) {
          if (!context.mounted) {
            return;
          }
          showCopyableDiagnosticSnackBar(
            context,
            ref,
            message: context.tr('Could not switch project: {error}', {
              'error': '$error',
            }),
            scope: 'project_picker.switch',
            error: error,
          );
        }
      },
      itemBuilder: (context) => projectsState.when(
        data: (state) {
          final availableProjects = state.items
              .where((project) => !project.isArchived && !project.isDeleted)
              .toList();
          if (availableProjects.isEmpty) {
            return [
              PopupMenuItem<String?>(
                enabled: false,
                child: Text(context.tr('No project selected')),
              ),
            ];
          }

          return [
            PopupMenuItem<String?>(
              value: null,
              child: ListTile(
                leading: const Icon(Icons.block_rounded),
                title: Text(context.tr('No project selected')),
                trailing: activeProject == null
                    ? const Icon(Icons.check_rounded, size: 18)
                    : null,
              ),
            ),
            const PopupMenuDivider(),
            for (final project in availableProjects)
              PopupMenuItem<String>(
                value: project.id,
                child: ListTile(
                  leading: const Icon(Icons.folder_copy_rounded),
                  title: Text(project.name),
                  subtitle: Text(
                    project.url,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  trailing: activeProject?.id == project.id
                      ? const Icon(Icons.check_rounded, size: 18)
                      : null,
                ),
              ),
          ];
        },
        loading: () => [
          PopupMenuItem<String?>(
            enabled: false,
            child: Text(context.tr('Loading projects...')),
          ),
        ],
        error: (_, _) => [
          PopupMenuItem<String?>(
            enabled: false,
            child: Text(context.tr('Project management unavailable')),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.folder_copy_rounded),
            const SizedBox(width: 6),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 130),
              child: Text(
                activeLabel,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 13,
                  color: activeColor,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const Icon(Icons.keyboard_arrow_down_rounded, size: 18),
          ],
        ),
      ),
    );
  }
}

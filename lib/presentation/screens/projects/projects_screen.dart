import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../data/models/project.dart';
import '../../../l10n/app_localizations.dart';
import '../../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_error_view.dart';

class ProjectsScreen extends ConsumerWidget {
  const ProjectsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projectsState = ref.watch(projectsStateProvider);
    final activeProject = ref.watch(activeProjectProvider);
    final archivedProjects = ref.watch(archivedProjectsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('Projects')),
        actions: [
          IconButton(
            tooltip: context.tr('Refresh'),
            onPressed: () => ref.invalidate(projectsStateProvider),
            icon: const Icon(Icons.refresh_rounded),
          ),
          IconButton(
            tooltip: context.tr('Create project'),
            onPressed: () =>
                context.push('/onboarding?mode=create&intent=project-manage'),
            icon: const Icon(Icons.add_rounded),
          ),
        ],
      ),
      body: projectsState.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => AppErrorView(
          scope: 'projects.screen',
          title: 'Project management unavailable',
          message: error.toString(),
          onRetry: () => ref.invalidate(projectsStateProvider),
        ),
        data: (state) {
          final availableProjects = state.items
              .where((project) => !project.isArchived && !project.isDeleted)
              .toList();
          if (availableProjects.isEmpty && archivedProjects.isEmpty) {
            return _EmptyProjectsState(isDegraded: state.isDegraded);
          }

          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              if (state.isDegraded) ...[
                _NoticeCard(
                  message:
                      state.message ??
                      context.tr('Project management unavailable'),
                  tone: AppTheme.warningColor,
                ),
                const SizedBox(height: 16),
              ],
              Text(
                context.tr('Active project'),
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 12),
              if (activeProject != null)
                _ProjectCard(
                  project: activeProject,
                  isActive: true,
                  onSwitch: null,
                )
              else
                _NoticeCard(message: context.tr('No project selected')),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      context.tr('Projects'),
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                  FilledButton.icon(
                    onPressed: () => context.push(
                      '/onboarding?mode=create&intent=project-manage',
                    ),
                    icon: const Icon(Icons.add_rounded),
                    label: Text(context.tr('Create project')),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ...availableProjects.map(
                (project) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _ProjectCard(
                    project: project,
                    isActive: activeProject?.id == project.id,
                    onSwitch: activeProject?.id == project.id
                        ? null
                        : () => _setActiveProject(context, ref, project),
                  ),
                ),
              ),
              if (archivedProjects.isNotEmpty) ...[
                const SizedBox(height: 24),
                Text(
                  context.tr('Archived projects'),
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 12),
                ...archivedProjects.map(
                  (project) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _ProjectCard(
                      project: project,
                      isActive: false,
                      onSwitch: null,
                      archived: true,
                    ),
                  ),
                ),
              ],
            ],
          );
        },
      ),
    );
  }

  Future<void> _setActiveProject(
    BuildContext context,
    WidgetRef ref,
    Project project,
  ) async {
    try {
      await ref
          .read(activeProjectControllerProvider.notifier)
          .setActiveProject(project.id);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.tr('Active project updated.'))),
        );
      }
    } catch (error, stackTrace) {
      if (!context.mounted) return;
      showDiagnosticSnackBar(
        context,
        ref,
        message: 'Could not switch project: $error',
        scope: 'projects.switch',
        error: error,
        stackTrace: stackTrace,
        contextData: {'projectId': project.id},
      );
    }
  }
}

class _ProjectCard extends ConsumerWidget {
  const _ProjectCard({
    required this.project,
    required this.isActive,
    required this.onSwitch,
    this.archived = false,
  });

  final Project project;
  final bool isActive;
  final VoidCallback? onSwitch;
  final bool archived;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mutationState = ref.watch(projectMutationControllerProvider);
    final isBusy = mutationState.isLoading;
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isActive ? colorScheme.primary : colorScheme.outlineVariant,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  project.name,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: colorScheme.onSurface,
                  ),
                ),
              ),
              if (isActive)
                Chip(label: Text(context.tr('Active project')))
              else if (project.isDefault)
                Chip(label: Text(context.tr('Default'))),
            ],
          ),
          const SizedBox(height: 8),
          if (project.url.isNotEmpty)
            Text(
              project.url,
              style: TextStyle(color: colorScheme.onSurfaceVariant),
            ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (project.settings?.techStack != null)
                Chip(label: Text(project.settings!.techStack!.framework.name)),
              Chip(
                label: Text(
                  project.settings?.onboardingStatus.name ??
                      OnboardingStatus.pending.name,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (onSwitch != null)
                OutlinedButton(
                  onPressed: isBusy ? null : onSwitch,
                  child: Text(context.tr('Switch project')),
                ),
              OutlinedButton(
                onPressed: isBusy
                    ? null
                    : () => context.push(
                        '/onboarding?mode=edit&intent=project-manage&projectId=${project.id}',
                      ),
                child: Text(context.tr('Edit project')),
              ),
              OutlinedButton(
                onPressed: isBusy
                    ? null
                    : () => _setDefaultProject(context, ref, project),
                child: Text(context.tr('Set as default')),
              ),
              OutlinedButton(
                onPressed: isBusy
                    ? null
                    : () => archived
                          ? _runMutation(
                              context,
                              ref,
                              action: () => ref
                                  .read(
                                    projectMutationControllerProvider.notifier,
                                  )
                                  .unarchiveProject(project.id),
                              scope: 'projects.unarchive',
                              failureMessage:
                                  'Could not unarchive project: ${project.name}',
                            )
                          : _confirmArchive(context, ref),
                child: Text(
                  context.tr(
                    archived ? 'Unarchive project' : 'Archive project',
                  ),
                ),
              ),
              if (!archived)
                TextButton(
                  onPressed: isBusy ? null : () => _confirmDelete(context, ref),
                  child: Text(context.tr('Delete project')),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _setDefaultProject(
    BuildContext context,
    WidgetRef ref,
    Project project,
  ) async {
    try {
      await ref
          .read(currentUserSettingsProvider.notifier)
          .setDefaultProjectId(project.id);
      ref.invalidate(projectsStateProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.tr('Active project updated.'))),
        );
      }
    } catch (error, stackTrace) {
      if (!context.mounted) return;
      showDiagnosticSnackBar(
        context,
        ref,
        message: 'Could not update default project: $error',
        scope: 'projects.default',
        error: error,
        stackTrace: stackTrace,
        contextData: {'projectId': project.id},
      );
    }
  }

  Future<void> _confirmArchive(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(context.tr('Archive project')),
        content: Text(context.tr('Archive this project?')),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(context.tr('Cancel')),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(context.tr('Archive project')),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;
    await _runMutation(
      context,
      ref,
      action: () => ref
          .read(projectMutationControllerProvider.notifier)
          .archiveProject(project.id),
      scope: 'projects.archive',
      failureMessage: 'Could not archive project: ${project.name}',
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(context.tr('Delete project')),
        content: Text(
          context.tr('Delete this project from the active workspace list?'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(context.tr('Cancel')),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(context.tr('Delete')),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;
    await _runMutation(
      context,
      ref,
      action: () => ref
          .read(projectMutationControllerProvider.notifier)
          .deleteProject(project.id),
      scope: 'projects.delete',
      failureMessage: 'Could not delete project: ${project.name}',
    );
  }

  Future<void> _runMutation(
    BuildContext context,
    WidgetRef ref, {
    required Future<void> Function() action,
    required String scope,
    required String failureMessage,
  }) async {
    try {
      await action();
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(context.tr('Project updated.'))));
      }
    } catch (error, stackTrace) {
      if (!context.mounted) return;
      showDiagnosticSnackBar(
        context,
        ref,
        message: failureMessage,
        scope: scope,
        error: error,
        stackTrace: stackTrace,
      );
    }
  }
}

class _EmptyProjectsState extends StatelessWidget {
  const _EmptyProjectsState({required this.isDegraded});

  final bool isDegraded;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.folder_copy_outlined, size: 72),
            const SizedBox(height: 16),
            Text(
              context.tr('No projects yet'),
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              context.tr(
                isDegraded
                    ? 'Project management unavailable'
                    : 'Create project',
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () =>
                  context.push('/onboarding?mode=create&intent=project-manage'),
              child: Text(context.tr('Create project')),
            ),
          ],
        ),
      ),
    );
  }
}

class _NoticeCard extends StatelessWidget {
  const _NoticeCard({required this.message, this.tone});

  final String message;
  final Color? tone;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final color = tone ?? colorScheme.primary;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline_rounded, color: color),
          const SizedBox(width: 12),
          Expanded(child: Text(message)),
        ],
      ),
    );
  }
}

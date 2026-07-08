import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../data/models/brand_profile.dart';
import '../../../data/models/content_item.dart';
import '../../../l10n/app_localizations.dart';
import '../../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_error_view.dart';
import '../../widgets/project_picker_action.dart';
import '../settings/settings_widgets.dart';

const double _brandProfileEditorMaxWidth = 720;
const double _brandProfileLoadingIndicatorSize = 18;

class BrandProfilesScreen extends ConsumerWidget {
  const BrandProfilesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeProjectId = ref.watch(activeProjectIdProvider);
    final profilesState = ref.watch(brandProfilesStateProvider);
    final groupGap = settingsGroupGap(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('Brand Profiles')),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          tooltip: context.tr('Back'),
          onPressed: () => context.pop(),
        ),
        actions: const [ProjectPickerAction()],
      ),
      floatingActionButton: activeProjectId == null
          ? null
          : FloatingActionButton.extended(
              onPressed: () => _openEditor(context, ref),
              icon: const Icon(Icons.add_rounded),
              label: Text(context.tr('New profile')),
            ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(brandProfilesStateProvider);
            await ref.read(brandProfilesStateProvider.future);
          },
          child: ListView(
            padding: settingsPagePadding(context),
            children: [
              _HeroCard(activeProjectId: activeProjectId),
              SizedBox(height: groupGap),
              profilesState.when(
                loading: () => const _LoadingState(),
                error: (error, stackTrace) => AppErrorView(
                  scope: 'settings.brand_profiles',
                  title: 'Could not load brand profiles',
                  message: error.toString(),
                  stackTrace: stackTrace,
                  onRetry: () => ref.invalidate(brandProfilesStateProvider),
                  helperText:
                      'The saved profiles stay intact. Retry once the backend is reachable.',
                  compact: true,
                ),
                data: (state) {
                  if (activeProjectId == null) {
                    return const _NoProjectSelected();
                  }
                  if (state.items.isEmpty) {
                    return _EmptyState(
                      onCreate: () => _openEditor(context, ref),
                    );
                  }

                  return Column(
                    children: [
                      if (state.isDegraded) ...[
                        _DegradedNotice(message: state.message),
                        SizedBox(height: groupGap),
                      ],
                      SettingsGroup(
                        title: 'Profiles',
                        caption:
                            'One profile can be default. Other profiles stay available for future generations.',
                        children: [
                          for (var i = 0; i < state.items.length; i++)
                            _BrandProfileCard(
                              profile: state.items[i],
                              onEdit: () => _openEditor(
                                context,
                                ref,
                                profile: state.items[i],
                              ),
                              onPreview: () => _previewImpact(
                                context,
                                ref,
                                profile: state.items[i],
                              ),
                              onSetDefault: state.items[i].isDefault
                                  ? null
                                  : () => _setDefault(
                                      context,
                                      ref,
                                      state.items[i],
                                    ),
                              onDelete: state.items[i].isDefault
                                  ? null
                                  : () => _confirmDelete(
                                      context,
                                      ref,
                                      state.items[i],
                                    ),
                            ),
                        ],
                      ),
                    ],
                  );
                },
              ),
              SizedBox(height: AppSpacing.xl * 4),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _openEditor(
    BuildContext context,
    WidgetRef ref, {
    BrandProfile? profile,
  }) async {
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return BrandProfileEditorDialog(profile: profile);
      },
    );
  }

  Future<void> _setDefault(
    BuildContext context,
    WidgetRef ref,
    BrandProfile profile,
  ) async {
    try {
      await ref
          .read(brandProfileControllerProvider.notifier)
          .setDefaultBrandProfile(profile.id);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.tr('Default brand profile updated.')),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (error, stackTrace) {
      if (!context.mounted) return;
      showCopyableDiagnosticSnackBar(
        context,
        ref,
        message: context.tr('Could not update the default brand profile.'),
        scope: 'settings.brand_profiles.default',
        error: error,
        stackTrace: stackTrace,
      );
    }
  }

  Future<void> _confirmDelete(
    BuildContext context,
    WidgetRef ref,
    BrandProfile profile,
  ) async {
    if (profile.isDefault) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.tr(
              'Set another profile as default before deleting this one.',
            ),
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final shouldDelete = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: Text(context.tr('Delete brand profile?')),
          content: Text(
            context.tr(
              'This removes the saved profile. Existing generated videos stay unchanged.',
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: Text(context.tr('Cancel')),
            ),
            FilledButton.tonal(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: Text(context.tr('Delete')),
            ),
          ],
        );
      },
    );
    if (shouldDelete != true) return;

    try {
      await ref
          .read(brandProfileControllerProvider.notifier)
          .deleteBrandProfile(profile.id);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.tr('Brand profile deleted.')),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (error, stackTrace) {
      if (!context.mounted) return;
      showCopyableDiagnosticSnackBar(
        context,
        ref,
        message: context.tr('Could not delete the brand profile.'),
        scope: 'settings.brand_profiles.delete',
        error: error,
        stackTrace: stackTrace,
      );
    }
  }

  Future<void> _previewImpact(
    BuildContext context,
    WidgetRef ref, {
    required BrandProfile profile,
  }) async {
    try {
      final previewContent = await _selectPreviewContent(context, ref);
      if (previewContent == null) return;

      final generation = await ref
          .read(apiServiceProvider)
          .generateBrandedVideoFromContent(
            contentId: previewContent.id,
            brandProfileId: profile.id,
            triggerSource: 'branding_profiles_screen',
          );

      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.tr('Preview generation started for {title}.', {
              'title': previewContent.title,
            }),
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
      final contentId = generation.timeline.contentId.isEmpty
          ? previewContent.id
          : generation.timeline.contentId;
      context.push('/editor/$contentId/video');
    } catch (error, stackTrace) {
      if (!context.mounted) return;
      showCopyableDiagnosticSnackBar(
        context,
        ref,
        message: context.tr('Could not start a branded preview.'),
        scope: 'settings.brand_profiles.preview',
        error: error,
        stackTrace: stackTrace,
      );
    }
  }

  Future<ContentItem?> _selectPreviewContent(
    BuildContext context,
    WidgetRef ref,
  ) async {
    final items = (await ref.read(
      pendingContentProvider.future,
    )).where((item) => item.isContentComplete).toList();

    if (!context.mounted) return null;
    if (items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.tr('No complete content is ready to preview branding yet.'),
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return null;
    }

    return showModalBottomSheet<ContentItem>(
      context: context,
      showDragHandle: true,
      builder: (_) => _BrandPreviewContentSheet(items: items),
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({required this.activeProjectId});

  final String? activeProjectId;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);
    final hasProject = activeProjectId != null;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: palette.elevatedSurface,
        borderRadius: BorderRadius.circular(AppRadii.xl),
        border: Border.all(color: palette.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: AppSpacing.xl * 2,
                height: AppSpacing.xl * 2,
                decoration: BoxDecoration(
                  color: AppTheme.editColor.withAlpha(28),
                  borderRadius: BorderRadius.circular(AppRadii.lg),
                ),
                child: Icon(Icons.palette_outlined, color: AppTheme.editColor),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      context.tr('Project branding rules'),
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xxs),
                    Text(
                      hasProject
                          ? context.tr(
                              'Edit one reusable rule set per project, then let generation use it automatically.',
                            )
                          : context.tr(
                              'Pick a project first, then manage its reusable branding defaults.',
                            ),
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _LoadingState extends StatelessWidget {
  const _LoadingState();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.symmetric(vertical: AppSpacing.xl * 2),
        child: CircularProgressIndicator(),
      ),
    );
  }
}

class _NoProjectSelected extends StatelessWidget {
  const _NoProjectSelected();

  @override
  Widget build(BuildContext context) {
    return AppErrorView(
      scope: 'settings.brand_profiles.project',
      title: 'No active project',
      message:
          'Select a project to create or edit brand profiles for that workspace.',
      helperText:
          'Brand profiles are project-scoped and never shared across projects.',
      compact: true,
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onCreate});

  final VoidCallback onCreate;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);

    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: palette.elevatedSurface,
        borderRadius: BorderRadius.circular(AppRadii.xl),
        border: Border.all(color: palette.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            context.tr('No brand profile yet'),
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: AppSpacing.xxs),
          Text(
            context.tr(
              'Create the first project profile so generation can reuse the same colors, typography and motion defaults every time.',
            ),
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              height: 1.4,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          FilledButton.icon(
            onPressed: onCreate,
            icon: const Icon(Icons.add_rounded),
            label: Text(context.tr('Create brand profile')),
          ),
        ],
      ),
    );
  }
}

class _DegradedNotice extends StatelessWidget {
  const _DegradedNotice({this.message});

  final String? message;

  @override
  Widget build(BuildContext context) {
    return AppErrorView(
      scope: 'settings.brand_profiles.degraded',
      title: 'Brand profiles loaded with fallback',
      message: message ?? 'The backend returned a degraded read response.',
      helperText:
          'Saved profiles stay intact. Refresh once the service recovers.',
      compact: true,
    );
  }
}

class _BrandProfileCard extends StatelessWidget {
  const _BrandProfileCard({
    required this.profile,
    required this.onEdit,
    required this.onPreview,
    required this.onSetDefault,
    required this.onDelete,
  });

  final BrandProfile profile;
  final VoidCallback onEdit;
  final VoidCallback onPreview;
  final VoidCallback? onSetDefault;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);
    final chipColor = profile.isDefault
        ? AppTheme.approveColor
        : AppTheme.infoColor;

    return SettingsBlock(
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: palette.surface,
          borderRadius: BorderRadius.circular(AppRadii.lg),
          border: Border.all(color: palette.borderSubtle),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              profile.name,
                              style: Theme.of(context).textTheme.titleMedium
                                  ?.copyWith(fontWeight: FontWeight.w700),
                            ),
                          ),
                          if (profile.isDefault)
                            _MiniChip(
                              label: context.tr('Default'),
                              color: chipColor,
                            ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.xxs),
                      Text(
                        context.tr('Revision {revision}', {
                          'revision': profile.revision.toString(),
                        }),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: AppSpacing.xs,
              runSpacing: AppSpacing.xs,
              children: [
                if (profile.primaryColors.isNotEmpty)
                  _MiniChip(
                    label: context.tr('{count} primary colors', {
                      'count': profile.primaryColors.length.toString(),
                    }),
                    color: AppTheme.editColor,
                  ),
                if (profile.secondaryColors.isNotEmpty)
                  _MiniChip(
                    label: context.tr('{count} secondary colors', {
                      'count': profile.secondaryColors.length.toString(),
                    }),
                    color: AppTheme.infoColor,
                  ),
                if (profile.toneKeywords.isNotEmpty)
                  _MiniChip(
                    label: context.tr('{count} tone keywords', {
                      'count': profile.toneKeywords.length.toString(),
                    }),
                    color: AppTheme.warningColor,
                  ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: AppSpacing.xs,
              runSpacing: AppSpacing.xs,
              children: [
                OutlinedButton(
                  onPressed: onEdit,
                  child: Text(context.tr('Edit')),
                ),
                OutlinedButton(
                  onPressed: onPreview,
                  child: Text(context.tr('Preview impact')),
                ),
                OutlinedButton(
                  onPressed: onSetDefault,
                  child: Text(context.tr('Make default')),
                ),
                FilledButton.tonal(
                  onPressed: onDelete,
                  child: Text(context.tr('Delete')),
                ),
              ],
            ),
            if (profile.isDefault) ...[
              const SizedBox(height: AppSpacing.xs),
              Text(
                context.tr(
                  'Set another profile as default before deleting this one.',
                ),
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                  height: 1.4,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _MiniChip extends StatelessWidget {
  const _MiniChip({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xxs,
      ),
      decoration: BoxDecoration(
        color: color.withAlpha(24),
        borderRadius: BorderRadius.circular(AppRadii.pill),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: color,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _BrandPreviewContentSheet extends StatelessWidget {
  const _BrandPreviewContentSheet({required this.items});

  final List<ContentItem> items;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SafeArea(
      child: ListView(
        shrinkWrap: true,
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.md,
          AppSpacing.xs,
          AppSpacing.md,
          AppSpacing.xl,
        ),
        children: [
          Text(
            context.tr('Preview branding impact'),
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            context.tr(
              'Choose a complete content item to run through the canonical branded generation route.',
            ),
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          for (final item in items)
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.play_circle_outline_rounded),
              title: Text(item.title),
              subtitle: Text(
                context.tr('{type} - Complete', {'type': item.typeLabel}),
              ),
              onTap: () => Navigator.of(context).pop(item),
            ),
        ],
      ),
    );
  }
}

class BrandProfileEditorDialog extends ConsumerStatefulWidget {
  const BrandProfileEditorDialog({super.key, this.profile});

  final BrandProfile? profile;

  @override
  ConsumerState<BrandProfileEditorDialog> createState() =>
      _BrandProfileEditorDialogState();
}

class _BrandProfileEditorDialogState
    extends ConsumerState<BrandProfileEditorDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _logoController;
  late final TextEditingController _primaryColorsController;
  late final TextEditingController _secondaryColorsController;
  late final TextEditingController _fontHeadingController;
  late final TextEditingController _fontBodyController;
  late final TextEditingController _toneKeywordsController;
  late final TextEditingController _ctaDefaultsController;
  late final TextEditingController _captionDefaultsController;
  late final TextEditingController _transitionFamilyController;
  late bool _introModuleEnabled;
  late bool _outroModuleEnabled;
  late bool _isDefault;
  late String _motionIntensity;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final draft =
        widget.profile?.toDraft() ?? const BrandProfileDraft(name: '');
    _nameController = TextEditingController(text: draft.name);
    _logoController = TextEditingController(text: draft.logoAssetId ?? '');
    _primaryColorsController = TextEditingController(
      text: draft.primaryColors.join(', '),
    );
    _secondaryColorsController = TextEditingController(
      text: draft.secondaryColors.join(', '),
    );
    _fontHeadingController = TextEditingController(
      text: draft.fontHeading ?? '',
    );
    _fontBodyController = TextEditingController(text: draft.fontBody ?? '');
    _toneKeywordsController = TextEditingController(
      text: draft.toneKeywords.join(', '),
    );
    _ctaDefaultsController = TextEditingController(
      text: draft.ctaDefaults == null
          ? ''
          : JsonEncoder.withIndent('  ').convert(draft.ctaDefaults),
    );
    _captionDefaultsController = TextEditingController(
      text: draft.captionStyleDefaults == null
          ? ''
          : JsonEncoder.withIndent('  ').convert(draft.captionStyleDefaults),
    );
    _transitionFamilyController = TextEditingController(
      text: draft.transitionFamily ?? '',
    );
    _introModuleEnabled = draft.introModuleEnabled;
    _outroModuleEnabled = draft.outroModuleEnabled;
    _isDefault = draft.isDefault;
    _motionIntensity = draft.motionIntensity;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _logoController.dispose();
    _primaryColorsController.dispose();
    _secondaryColorsController.dispose();
    _fontHeadingController.dispose();
    _fontBodyController.dispose();
    _toneKeywordsController.dispose();
    _ctaDefaultsController.dispose();
    _captionDefaultsController.dispose();
    _transitionFamilyController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.profile != null;

    return AlertDialog(
      scrollable: true,
      title: Text(
        context.tr(isEditing ? 'Edit brand profile' : 'Create brand profile'),
      ),
      content: Form(
        key: _formKey,
        child: ConstrainedBox(
          constraints: const BoxConstraints(
            maxWidth: _brandProfileEditorMaxWidth,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildField(
                controller: _nameController,
                label: 'Profile name',
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return context.tr('A profile name is required.');
                  }
                  return null;
                },
              ),
              _buildField(controller: _logoController, label: 'Logo asset id'),
              _buildField(
                controller: _primaryColorsController,
                label: 'Primary colors',
                helperText: '#0F172A, #1D4ED8',
              ),
              _buildField(
                controller: _secondaryColorsController,
                label: 'Secondary colors',
                helperText: '#E2E8F0, #CBD5E1',
              ),
              _buildField(
                controller: _fontHeadingController,
                label: 'Heading font',
              ),
              _buildField(controller: _fontBodyController, label: 'Body font'),
              _buildField(
                controller: _toneKeywordsController,
                label: 'Tone keywords',
                helperText: 'Direct, energetic, premium',
              ),
              _buildField(
                controller: _transitionFamilyController,
                label: 'Transition family',
              ),
              _buildField(
                controller: _ctaDefaultsController,
                label: 'CTA defaults JSON',
                maxLines: 4,
              ),
              _buildField(
                controller: _captionDefaultsController,
                label: 'Caption defaults JSON',
                maxLines: 4,
              ),
              const SizedBox(height: AppSpacing.sm),
              DropdownButtonFormField<String>(
                initialValue: _motionIntensity,
                decoration: const InputDecoration(
                  labelText: 'Motion intensity',
                ),
                items: const [
                  DropdownMenuItem(value: 'low', child: Text('Low')),
                  DropdownMenuItem(value: 'medium', child: Text('Medium')),
                  DropdownMenuItem(value: 'high', child: Text('High')),
                ],
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _motionIntensity = value);
                  }
                },
              ),
              const SizedBox(height: AppSpacing.xs),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Intro module enabled'),
                value: _introModuleEnabled,
                onChanged: (value) =>
                    setState(() => _introModuleEnabled = value),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Outro module enabled'),
                value: _outroModuleEnabled,
                onChanged: (value) =>
                    setState(() => _outroModuleEnabled = value),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Make default profile'),
                value: _isDefault,
                onChanged: (value) => setState(() => _isDefault = value),
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: _saving ? null : () => Navigator.of(context).pop(),
          child: Text(context.tr('Cancel')),
        ),
        FilledButton(
          onPressed: _saving ? null : _save,
          child: _saving
              ? const SizedBox(
                  width: _brandProfileLoadingIndicatorSize,
                  height: _brandProfileLoadingIndicatorSize,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : Text(context.tr('Save')),
        ),
      ],
    );
  }

  Widget _buildField({
    required TextEditingController controller,
    required String label,
    String? helperText,
    String? Function(String?)? validator,
    int maxLines = 1,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: TextFormField(
        controller: controller,
        maxLines: maxLines,
        validator: validator,
        decoration: InputDecoration(labelText: label, helperText: helperText),
      ),
    );
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    final draft = BrandProfileDraft(
      name: _nameController.text.trim(),
      logoAssetId: _cleanNullable(_logoController.text),
      primaryColors: _csv(_primaryColorsController.text),
      secondaryColors: _csv(_secondaryColorsController.text),
      fontHeading: _cleanNullable(_fontHeadingController.text),
      fontBody: _cleanNullable(_fontBodyController.text),
      toneKeywords: _csv(_toneKeywordsController.text),
      ctaDefaults: _parseJsonMap(_ctaDefaultsController.text),
      captionStyleDefaults: _parseJsonMap(_captionDefaultsController.text),
      motionIntensity: _motionIntensity,
      transitionFamily: _cleanNullable(_transitionFamilyController.text),
      introModuleEnabled: _introModuleEnabled,
      outroModuleEnabled: _outroModuleEnabled,
      isDefault: _isDefault,
    );

    setState(() => _saving = true);
    try {
      final controller = ref.read(brandProfileControllerProvider.notifier);
      if (widget.profile == null) {
        await controller.createBrandProfile(draft: draft);
      } else {
        await controller.updateBrandProfile(
          brandProfileId: widget.profile!.id,
          draft: draft,
        );
      }
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.tr(
              widget.profile == null
                  ? 'Brand profile created.'
                  : 'Brand profile updated.',
            ),
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (error, stackTrace) {
      if (!mounted) return;
      setState(() => _saving = false);
      showCopyableDiagnosticSnackBar(
        context,
        ref,
        message: context.tr('Could not save the brand profile.'),
        scope: 'settings.brand_profiles.save',
        error: error,
        stackTrace: stackTrace,
      );
    }
  }

  String? _cleanNullable(String value) {
    final trimmed = value.trim();
    return trimmed.isEmpty ? null : trimmed;
  }

  List<String> _csv(String value) {
    return value
        .split(',')
        .map((entry) => entry.trim())
        .where((entry) => entry.isNotEmpty)
        .toList();
  }

  Map<String, dynamic>? _parseJsonMap(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) {
      return null;
    }
    final decoded = jsonDecode(trimmed);
    if (decoded is Map<String, dynamic>) {
      return decoded;
    }
    if (decoded is Map) {
      return Map<String, dynamic>.from(decoded);
    }
    throw const FormatException('Expected a JSON object.');
  }
}

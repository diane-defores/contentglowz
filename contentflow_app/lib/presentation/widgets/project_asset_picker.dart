import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/project_asset.dart';
import '../../l10n/app_localizations.dart';
import '../../providers/providers.dart';

class ProjectAssetPicker extends ConsumerWidget {
  const ProjectAssetPicker({
    super.key,
    required this.targetType,
    required this.targetId,
    required this.usageAction,
    this.placement,
    this.allowedMediaKinds,
    this.onSelected,
  });

  final String targetType;
  final String targetId;
  final String usageAction;
  final String? placement;
  final Set<String>? allowedMediaKinds;
  final void Function(ProjectAssetUsage usage)? onSelected;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final library = ref.watch(projectAssetLibraryProvider);
    final controller = ref.read(projectAssetLibraryProvider.notifier);
    final theme = Theme.of(context);

    return library.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, _) =>
          Center(child: Text(context.tr('Asset library unavailable'))),
      data: (state) {
        final selectedId = state.selectedAssetId;
        final selectedAsset = state.selectedAsset;
        final visibleAssets = allowedMediaKinds == null
            ? state.assets
            : state.assets
                  .where(
                    (asset) => allowedMediaKinds!.contains(asset.mediaKind),
                  )
                  .toList();
        final usage = selectedId == null
            ? const <ProjectAssetUsage>[]
            : (state.assetUsage[selectedId] ?? const <ProjectAssetUsage>[]);
        final events = selectedId == null
            ? const <ProjectAssetEvent>[]
            : (state.assetEvents[selectedId] ?? const <ProjectAssetEvent>[]);

        return LayoutBuilder(
          builder: (context, constraints) {
            final twoPanels = constraints.maxWidth >= 760;
            final listPane = _AssetListPane(
              state: state,
              assets: visibleAssets,
              onRefresh: controller.refresh,
              onMediaKindChanged: controller.setMediaKindFilter,
              onSourceChanged: controller.setSourceFilter,
              onIncludeTombstonedChanged: controller.setIncludeTombstoned,
              onAssetTap: controller.selectAsset,
            );
            final detailPane = _AssetDetailPane(
              asset: selectedAsset,
              usage: usage,
              events: events,
              isMutating: state.isMutating,
              onSelect: selectedAsset == null
                  ? null
                  : () async {
                      final result = await controller.selectForTarget(
                        assetId: selectedAsset.id,
                        targetType: targetType,
                        targetId: targetId,
                        usageAction: usageAction,
                        placement: placement,
                      );
                      if (result != null) {
                        onSelected?.call(result);
                      }
                    },
              onSetPrimary: selectedAsset == null
                  ? null
                  : () => controller.setPrimary(
                      assetId: selectedAsset.id,
                      targetType: targetType,
                      targetId: targetId,
                      usageAction: usageAction,
                      placement: placement,
                    ),
              onClearPrimary: () => controller.clearPrimary(
                targetType: targetType,
                targetId: targetId,
                placement: placement,
              ),
              onTombstone: selectedAsset == null
                  ? null
                  : () => controller.tombstoneAsset(selectedAsset.id),
              onRestore: selectedAsset == null
                  ? null
                  : () => controller.restoreAsset(selectedAsset.id),
            );

            if (!twoPanels) {
              return Container(
                decoration: BoxDecoration(
                  border: Border.all(color: theme.colorScheme.outlineVariant),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  children: [
                    Expanded(child: listPane),
                    detailPane,
                  ],
                ),
              );
            }
            return Container(
              decoration: BoxDecoration(
                border: Border.all(color: theme.colorScheme.outlineVariant),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Expanded(flex: 4, child: listPane),
                  VerticalDivider(
                    width: 1,
                    color: theme.colorScheme.outlineVariant,
                  ),
                  Expanded(flex: 3, child: detailPane),
                ],
              ),
            );
          },
        );
      },
    );
  }
}

class _AssetListPane extends StatelessWidget {
  const _AssetListPane({
    required this.state,
    required this.assets,
    required this.onRefresh,
    required this.onMediaKindChanged,
    required this.onSourceChanged,
    required this.onIncludeTombstonedChanged,
    required this.onAssetTap,
  });

  final ProjectAssetLibraryState state;
  final List<ProjectAsset> assets;
  final Future<void> Function() onRefresh;
  final void Function(String?) onMediaKindChanged;
  final void Function(String?) onSourceChanged;
  final void Function(bool) onIncludeTombstonedChanged;
  final Future<void> Function(String?) onAssetTap;

  static const _mediaKindOptions = <String>[
    'image',
    'video',
    'audio',
    'music',
    'thumbnail',
    'video_cover',
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(10, 8, 10, 6),
          child: Wrap(
            spacing: 8,
            runSpacing: 6,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              SizedBox(
                width: 130,
                child: DropdownButtonFormField<String?>(
                  initialValue: state.mediaKindFilter,
                  isExpanded: true,
                  isDense: true,
                  decoration: const InputDecoration(
                    isDense: true,
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 8,
                    ),
                  ),
                  hint: Text(context.tr('Kind')),
                  items: [
                    DropdownMenuItem<String>(
                      value: null,
                      child: Text(context.tr('All')),
                    ),
                    ..._mediaKindOptions.map(
                      (kind) => DropdownMenuItem<String>(
                        value: kind,
                        child: Text(kind),
                      ),
                    ),
                  ],
                  onChanged: onMediaKindChanged,
                ),
              ),
              SizedBox(
                width: 150,
                child: TextFormField(
                  initialValue: state.sourceFilter ?? '',
                  decoration: InputDecoration(
                    hintText: context.tr('Source'),
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 8,
                    ),
                  ),
                  onFieldSubmitted: (value) =>
                      onSourceChanged(value.trim().isEmpty ? null : value),
                ),
              ),
              FilterChip(
                label: Text(context.tr('Tombstoned')),
                selected: state.includeTombstoned,
                onSelected: onIncludeTombstonedChanged,
                visualDensity: VisualDensity.compact,
              ),
              IconButton(
                tooltip: context.tr('Refresh'),
                onPressed: onRefresh,
                icon: const Icon(Icons.refresh_rounded),
              ),
            ],
          ),
        ),
        const Divider(height: 1),
        Expanded(
          child: assets.isEmpty
              ? Center(child: Text(context.tr('No assets')))
              : ListView.separated(
                  itemCount: assets.length,
                  separatorBuilder: (_, _) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final asset = assets[index];
                    final selected = state.selectedAssetId == asset.id;
                    return ListTile(
                      dense: true,
                      selected: selected,
                      onTap: () => onAssetTap(asset.id),
                      leading: Icon(_iconForKind(asset.mediaKind)),
                      title: Text(
                        asset.fileName ?? asset.id,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      subtitle: Text(
                        '${asset.mediaKind} · ${asset.source}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      trailing: asset.status == 'tombstoned'
                          ? const Icon(Icons.archive_rounded, size: 16)
                          : null,
                    );
                  },
                ),
        ),
      ],
    );
  }

  IconData _iconForKind(String mediaKind) {
    switch (mediaKind) {
      case 'audio':
      case 'music':
        return Icons.graphic_eq_rounded;
      case 'video':
      case 'video_cover':
        return Icons.videocam_rounded;
      default:
        return Icons.image_rounded;
    }
  }
}

class _AssetDetailPane extends StatelessWidget {
  const _AssetDetailPane({
    required this.asset,
    required this.usage,
    required this.events,
    required this.isMutating,
    this.onSelect,
    this.onSetPrimary,
    required this.onClearPrimary,
    this.onTombstone,
    this.onRestore,
  });

  final ProjectAsset? asset;
  final List<ProjectAssetUsage> usage;
  final List<ProjectAssetEvent> events;
  final bool isMutating;
  final Future<void> Function()? onSelect;
  final Future<void> Function()? onSetPrimary;
  final Future<void> Function() onClearPrimary;
  final Future<void> Function()? onTombstone;
  final Future<void> Function()? onRestore;

  @override
  Widget build(BuildContext context) {
    if (asset == null) {
      return SizedBox(
        height: 180,
        child: Center(child: Text(context.tr('Select an asset'))),
      );
    }
    final isTombstoned = asset!.status == 'tombstoned';
    return Padding(
      padding: const EdgeInsets.all(10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            asset!.fileName ?? asset!.id,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.titleSmall,
          ),
          const SizedBox(height: 4),
          Text('${asset!.mediaKind} · ${asset!.source}'),
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              FilledButton.tonal(
                onPressed: isMutating ? null : onSelect,
                child: Text(context.tr('Select')),
              ),
              OutlinedButton(
                onPressed: isMutating ? null : onSetPrimary,
                child: Text(context.tr('Primary')),
              ),
              OutlinedButton(
                onPressed: isMutating ? null : onClearPrimary,
                child: Text(context.tr('Clear')),
              ),
              OutlinedButton(
                onPressed: isMutating
                    ? null
                    : (isTombstoned ? onRestore : onTombstone),
                child: Text(context.tr(isTombstoned ? 'Restore' : 'Remove')),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(context.tr('Usage: {count}', {'count': '${usage.length}'})),
          Text(context.tr('Events: {count}', {'count': '${events.length}'})),
        ],
      ),
    );
  }
}

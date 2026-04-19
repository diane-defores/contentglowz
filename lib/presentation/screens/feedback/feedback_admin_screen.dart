import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../data/models/feedback_entry.dart';
import '../../../providers/providers.dart';

class FeedbackAdminScreen extends ConsumerStatefulWidget {
  const FeedbackAdminScreen({super.key});

  @override
  ConsumerState<FeedbackAdminScreen> createState() => _FeedbackAdminScreenState();
}

class _FeedbackAdminScreenState extends ConsumerState<FeedbackAdminScreen> {
  final AudioPlayer _player = AudioPlayer();
  FeedbackAdminStatusFilter _statusFilter = FeedbackAdminStatusFilter.all;
  FeedbackAdminTypeFilter _typeFilter = FeedbackAdminTypeFilter.all;
  String? _playingEntryId;

  FeedbackAdminQuery get _query => FeedbackAdminQuery(
    status: _statusFilter,
    type: _typeFilter,
  );

  @override
  void initState() {
    super.initState();
    _player.onPlayerComplete.listen((_) {
      if (!mounted) return;
      setState(() => _playingEntryId = null);
    });
  }

  @override
  void dispose() {
    _player.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authSession = ref.watch(authSessionProvider);
    if (authSession.isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Feedback Admin')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final isFeedbackAdmin = ref.watch(isFeedbackAdminProvider);
    if (!isFeedbackAdmin) {
      return Scaffold(
        appBar: AppBar(title: const Text('Feedback Admin')),
        body: const Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Text(
              'Accès refusé. Cette vue n’est visible que pour les comptes allowlistés.',
              textAlign: TextAlign.center,
            ),
          ),
        ),
      );
    }

    final entriesAsync = ref.watch(feedbackAdminEntriesProvider(_query));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Feedback Admin'),
        actions: [
          IconButton(
            onPressed: () {
              ref.invalidate(feedbackAdminEntriesProvider(_query));
            },
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            'Retours utilisateurs reçus par le backend. Le contrôle d’accès réel reste côté serveur.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.5),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final filter in FeedbackAdminStatusFilter.values)
                ChoiceChip(
                  label: Text(_statusLabel(filter)),
                  selected: _statusFilter == filter,
                  onSelected: (_) => setState(() => _statusFilter = filter),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final filter in FeedbackAdminTypeFilter.values)
                ChoiceChip(
                  label: Text(_typeLabel(filter)),
                  selected: _typeFilter == filter,
                  onSelected: (_) => setState(() => _typeFilter = filter),
                ),
            ],
          ),
          const SizedBox(height: 20),
          entriesAsync.when(
            data: (entries) {
              if (entries.isEmpty) {
                return const Text('Aucun feedback pour ce filtre.');
              }
              return Column(
                children: [
                  for (final entry in entries) _FeedbackEntryCard(
                    entry: entry,
                    isPlaying: _playingEntryId == entry.id,
                    onTogglePlayback: entry.audioUrl == null
                        ? null
                        : () => _togglePlayback(entry),
                    onMarkReviewed: entry.status == FeedbackEntryStatus.reviewed
                        ? null
                        : () => _markReviewed(entry.id),
                  ),
                ],
              );
            },
            loading: () => const Padding(
              padding: EdgeInsets.all(32),
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (error, _) => Padding(
              padding: const EdgeInsets.all(16),
              child: Text('Impossible de charger les feedbacks: $error'),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _togglePlayback(FeedbackEntry entry) async {
    final audioUrl = entry.audioUrl;
    if (audioUrl == null || audioUrl.isEmpty) {
      _showSnack('Aucune URL audio fournie par le backend.');
      return;
    }

    if (_playingEntryId == entry.id) {
      await _player.stop();
      if (!mounted) return;
      setState(() => _playingEntryId = null);
      return;
    }

    await _player.stop();
    await _player.play(UrlSource(audioUrl));
    if (!mounted) return;
    setState(() => _playingEntryId = entry.id);
  }

  Future<void> _markReviewed(String feedbackId) async {
    try {
      await ref.read(feedbackServiceProvider).markReviewed(feedbackId);
      ref.invalidate(feedbackAdminEntriesProvider(_query));
      ref.invalidate(feedbackAdminEntriesProvider(const FeedbackAdminQuery()));
      _showSnack('Feedback marqué comme lu.');
    } catch (error) {
      _showSnack('Échec de mise à jour: $error');
    }
  }

  void _showSnack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }
}

class _FeedbackEntryCard extends StatelessWidget {
  const _FeedbackEntryCard({
    required this.entry,
    required this.isPlaying,
    this.onTogglePlayback,
    this.onMarkReviewed,
  });

  final FeedbackEntry entry;
  final bool isPlaying;
  final VoidCallback? onTogglePlayback;
  final VoidCallback? onMarkReviewed;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Chip(
                  label: Text(entry.isAudio ? 'Audio' : 'Texte'),
                  avatar: Icon(
                    entry.isAudio ? Icons.mic_rounded : Icons.notes_rounded,
                    size: 18,
                  ),
                ),
                const SizedBox(width: 8),
                Chip(
                  backgroundColor: entry.status == FeedbackEntryStatus.reviewed
                      ? theme.colorScheme.surfaceContainerHighest
                      : theme.colorScheme.primaryContainer,
                  label: Text(
                    entry.status == FeedbackEntryStatus.reviewed ? 'Lu' : 'Nouveau',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              entry.message?.trim().isNotEmpty == true
                  ? entry.message!
                  : 'Feedback audio',
              style: theme.textTheme.bodyLarge,
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _MetaChip(label: DateFormat.yMMMd().add_Hm().format(entry.createdAt.toLocal())),
                _MetaChip(label: entry.platform),
                _MetaChip(label: entry.locale),
                _MetaChip(label: entry.userEmail?.isNotEmpty == true ? entry.userEmail! : 'anonyme'),
                if (entry.durationMs != null)
                  _MetaChip(label: _formatDuration(entry.durationMs!)),
              ],
            ),
            if (entry.isAudio) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  FilledButton.tonalIcon(
                    onPressed: onTogglePlayback,
                    icon: Icon(isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded),
                    label: Text(isPlaying ? 'Pause' : 'Lire'),
                  ),
                  if (entry.audioUrl == null || entry.audioUrl!.isEmpty) ...[
                    const SizedBox(width: 12),
                    Text(
                      'Audio indisponible',
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ],
              ),
            ],
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerRight,
              child: OutlinedButton.icon(
                onPressed: onMarkReviewed,
                icon: const Icon(Icons.done_all_rounded),
                label: const Text('Marquer comme lu'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  const _MetaChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(label, style: Theme.of(context).textTheme.bodySmall),
    );
  }
}

String _statusLabel(FeedbackAdminStatusFilter filter) => switch (filter) {
  FeedbackAdminStatusFilter.all => 'Tous',
  FeedbackAdminStatusFilter.unread => 'Non lus',
  FeedbackAdminStatusFilter.reviewed => 'Lus',
};

String _typeLabel(FeedbackAdminTypeFilter filter) => switch (filter) {
  FeedbackAdminTypeFilter.all => 'Tous types',
  FeedbackAdminTypeFilter.text => 'Texte',
  FeedbackAdminTypeFilter.audio => 'Audio',
};

String _formatDuration(int durationMs) {
  final totalSeconds = (durationMs / 1000).floor();
  final minutes = totalSeconds ~/ 60;
  final seconds = totalSeconds % 60;
  return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
}

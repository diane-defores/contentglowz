import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../data/models/ritual.dart';
import '../../../providers/providers.dart';
import '../../theme/app_theme.dart';

class RitualScreen extends ConsumerStatefulWidget {
  const RitualScreen({super.key});

  @override
  ConsumerState<RitualScreen> createState() => _RitualScreenState();
}

class _RitualScreenState extends ConsumerState<RitualScreen> {
  final List<RitualEntry> _entries = EntryType.values
      .map((t) => RitualEntry(type: t))
      .toList();
  final Map<EntryType, TextEditingController> _controllers = {};

  bool _isSubmitting = false;
  NarrativeSynthesisResult? _result;

  @override
  void initState() {
    super.initState();
    for (final type in EntryType.values) {
      _controllers[type] = TextEditingController();
    }
  }

  @override
  void dispose() {
    for (final c in _controllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Weekly Ritual'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: _result != null ? _buildResultView() : _buildEntryForm(),
    );
  }

  Widget _buildEntryForm() {
    final filledCount = _entries
        .where((e) => _controllers[e.type]!.text.trim().isNotEmpty)
        .length;

    return Column(
      children: [
        // Header
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 4),
          child: Row(
            children: [
              Text(
                '$filledCount/${_entries.length} entries',
                style: TextStyle(
                    color: Colors.white.withAlpha(100), fontSize: 13),
              ),
              const Spacer(),
              Text(
                'Fill at least 2',
                style: TextStyle(
                    color: Colors.white.withAlpha(60), fontSize: 13),
              ),
            ],
          ),
        ),
        // Entries
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _entries.length,
            itemBuilder: (context, index) =>
                _buildEntryCard(_entries[index]),
          ),
        ),
        // Submit
        Container(
          padding: EdgeInsets.fromLTRB(
              24, 12, 24, 12 + MediaQuery.of(context).padding.bottom),
          decoration: const BoxDecoration(
            color: Color(0xFF1A1A2E),
            border: Border(top: BorderSide(color: Colors.white12)),
          ),
          child: FilledButton(
            onPressed:
                filledCount >= 2 && !_isSubmitting ? _submit : null,
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              backgroundColor: const Color(0xFF6C5CE7),
            ),
            child: _isSubmitting
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Synthesize Narrative'),
          ),
        ),
      ],
    );
  }

  Widget _buildEntryCard(RitualEntry entry) {
    final controller = _controllers[entry.type]!;
    final color = _colorForType(entry.type);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: controller.text.trim().isNotEmpty
              ? color.withAlpha(60)
              : Colors.white.withAlpha(15),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Type header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
            child: Row(
              children: [
                Text(entry.emoji, style: const TextStyle(fontSize: 20)),
                const SizedBox(width: 10),
                Text(
                  entry.label,
                  style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ),
          // Input
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
            child: TextField(
              controller: controller,
              maxLines: 3,
              minLines: 2,
              style: TextStyle(
                  color: Colors.white.withAlpha(220), fontSize: 14, height: 1.6),
              decoration: InputDecoration(
                hintText: entry.hint,
                hintStyle: TextStyle(color: Colors.white.withAlpha(40)),
                border: InputBorder.none,
                filled: false,
                contentPadding: EdgeInsets.zero,
              ),
              onChanged: (_) => setState(() {}),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResultView() {
    final result = _result!;

    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        // Chapter transition badge
        if (result.chapterTransition && result.suggestedChapterTitle != null)
          Container(
            margin: const EdgeInsets.only(bottom: 20),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  const Color(0xFF6C5CE7).withAlpha(30),
                  const Color(0xFF0984E3).withAlpha(30),
                ],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF6C5CE7).withAlpha(60)),
            ),
            child: Row(
              children: [
                const Icon(Icons.auto_stories,
                    color: Color(0xFF6C5CE7), size: 28),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'New Chapter Detected',
                        style: TextStyle(
                            color: Colors.white.withAlpha(150), fontSize: 12),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        result.suggestedChapterTitle!,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

        // Narrative summary
        const Text(
          'Narrative Summary',
          style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Colors.white54,
              letterSpacing: 1),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: const Color(0xFF1A1A2E),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Text(
            result.narrativeSummary,
            style: TextStyle(
              color: Colors.white.withAlpha(200),
              fontSize: 15,
              height: 1.7,
            ),
          ),
        ),

        // Voice changes
        if (result.voiceDelta.isNotEmpty) ...[
          const SizedBox(height: 24),
          const Text(
            'Voice Evolution',
            style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Colors.white54,
                letterSpacing: 1),
          ),
          const SizedBox(height: 12),
          _buildDeltaCard(result.voiceDelta, Icons.record_voice_over,
              const Color(0xFF00B894)),
        ],

        // Positioning changes
        if (result.positioningDelta.isNotEmpty) ...[
          const SizedBox(height: 16),
          const Text(
            'Positioning Shift',
            style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Colors.white54,
                letterSpacing: 1),
          ),
          const SizedBox(height: 12),
          _buildDeltaCard(result.positioningDelta, Icons.my_location,
              const Color(0xFF0984E3)),
        ],

        const SizedBox(height: 32),

        // Actions
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => setState(() => _result = null),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  side: BorderSide(color: Colors.white.withAlpha(40)),
                ),
                child: const Text('Edit Entries'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: FilledButton(
                onPressed: _validateNarrative,
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  backgroundColor: AppTheme.approveColor,
                ),
                child: const Text('Validate & Save'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildDeltaCard(
      Map<String, dynamic> delta, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withAlpha(10),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withAlpha(40)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: delta.entries.map((e) {
          final value = e.value is List ? (e.value as List).join(', ') : '${e.value}';
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(icon, size: 16, color: color),
                const SizedBox(width: 10),
                Expanded(
                  child: RichText(
                    text: TextSpan(children: [
                      TextSpan(
                        text: '${_formatKey(e.key)}: ',
                        style: TextStyle(
                            color: color, fontWeight: FontWeight.w600),
                      ),
                      TextSpan(
                        text: value,
                        style:
                            TextStyle(color: Colors.white.withAlpha(180)),
                      ),
                    ]),
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  String _formatKey(String key) =>
      key.replaceAll('_', ' ').replaceFirstMapped(
          RegExp(r'^[a-z]'), (m) => m.group(0)!.toUpperCase());

  Color _colorForType(EntryType type) => switch (type) {
        EntryType.reflection => const Color(0xFF6C5CE7),
        EntryType.win => const Color(0xFF00B894),
        EntryType.struggle => const Color(0xFFE17055),
        EntryType.idea => const Color(0xFFFDAA5E),
        EntryType.pivot => const Color(0xFF0984E3),
      };

  Future<void> _submit() async {
    setState(() => _isSubmitting = true);

    final entries = _entries.map((e) {
      final controller = _controllers[e.type]!;
      return e.copyWith(content: controller.text);
    }).toList();

    try {
      final api = ref.read(apiServiceProvider);
      final creatorProfile = ref.read(creatorProfileProvider).valueOrNull;
      final result = await api.synthesizeNarrative(
        profileId: creatorProfile?.id ?? 'default',
        entries: entries,
        currentVoice: creatorProfile?.voice,
        currentPositioning: creatorProfile?.positioning,
      );

      if (!mounted) return;
      setState(() {
        _isSubmitting = false;
        _result = result;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Narrative synthesis failed: $error')),
      );
    }
  }

  void _validateNarrative() {
    ref.read(lastNarrativeProvider.notifier).state = _result;
    final result = _result;
    if (result != null && !ref.read(authSessionProvider).isDemo) {
      unawaited(
        ref.read(apiServiceProvider).saveCreatorProfile(
          voice: result.voiceDelta.isEmpty ? null : result.voiceDelta,
          positioning: result.positioningDelta.isEmpty
              ? null
              : result.positioningDelta,
        ),
      );
      ref.invalidate(creatorProfileProvider);
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Narrative validated and saved!'),
        backgroundColor: AppTheme.approveColor.withAlpha(200),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
    context.pop();
  }
}

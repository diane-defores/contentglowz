import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../l10n/app_localizations.dart';
import '../../../providers/providers.dart';
import '../../widgets/app_error_view.dart';
import '../../widgets/project_picker_action.dart';

class ResearchScreen extends ConsumerStatefulWidget {
  const ResearchScreen({super.key});

  @override
  ConsumerState<ResearchScreen> createState() => _ResearchScreenState();
}

class _ResearchScreenState extends ConsumerState<ResearchScreen> {
  final _targetUrlCtrl = TextEditingController();
  final _competitorsCtrl = TextEditingController();
  final _keywordsCtrl = TextEditingController();
  bool _analyzing = false;
  Map<String, dynamic>? _result;

  @override
  void dispose() {
    _targetUrlCtrl.dispose();
    _competitorsCtrl.dispose();
    _keywordsCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('Research')),
        actions: const [ProjectPickerAction()],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(context.tr('Competitor Analysis'), style: theme.textTheme.titleMedium),
          const SizedBox(height: 4),
          Text(
            context.tr('Analyze your site against competitors'),
              style: theme.textTheme.bodySmall
                  ?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
          const SizedBox(height: 16),

          TextField(
            controller: _targetUrlCtrl,
            decoration: InputDecoration(
              labelText: context.tr('Your site URL'),
              hintText: context.tr('https://yoursite.com'),
            ),
            keyboardType: TextInputType.url,
          ),
          const SizedBox(height: 12),

          TextField(
            controller: _competitorsCtrl,
            decoration: InputDecoration(
              labelText: context.tr('Competitor URLs (one per line)'),
              hintText: context.tr('https://competitor1.com\nhttps://competitor2.com'),
            ),
            maxLines: 3,
            keyboardType: TextInputType.url,
          ),
          const SizedBox(height: 12),

          TextField(
            controller: _keywordsCtrl,
            decoration: InputDecoration(
              labelText: context.tr('Keywords (comma-separated, optional)'),
              hintText: context.tr('saas, flutter, ai'),
            ),
          ),
          const SizedBox(height: 20),

          FilledButton.icon(
            onPressed: _analyzing ? null : _analyze,
            icon: _analyzing
                ? const SizedBox(
                    height: 18, width: 18,
                    child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.analytics),
            label: Text(_analyzing ? context.tr('Analyzing...') : context.tr('Analyze')),
          ),

          if (_result != null) ...[
            const SizedBox(height: 20),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(context.tr('Analysis Results'),
                        style: theme.textTheme.titleSmall),
                    const SizedBox(height: 8),
                    ..._buildResults(),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  List<Widget> _buildResults() {
    if (_result == null) return [];
    final competitors = _result!['competitors'] as List? ?? [];
    return [
      for (final comp in competitors) ...[
        Text(
          (comp as Map)['name']?.toString() ?? context.tr('Unknown'),
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        ),
        if (comp['strengths'] case final List strengths when strengths.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(left: 12, top: 4),
            child: Text(
                context.tr('Strengths: {list}', {'list': strengths.join(', ')}),
                style: const TextStyle(fontSize: 12)),
          ),
        if (comp['weaknesses'] case final List weaknesses when weaknesses.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(left: 12, top: 2),
            child: Text(
                context.tr(
                    'Weaknesses: {list}', {'list': weaknesses.join(', ')}),
                style: const TextStyle(fontSize: 12)),
          ),
        const SizedBox(height: 8),
      ],
      if (competitors.isEmpty)
        Text(context.tr('No competitor data returned.'),
            style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
    ];
  }

  Future<void> _analyze() async {
    if (_targetUrlCtrl.text.trim().isEmpty || _competitorsCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(
                context.tr('Site URL and at least one competitor are required'))),
      );
      return;
    }

    setState(() {
      _analyzing = true;
      _result = null;
    });

    try {
      final api = ref.read(apiServiceProvider);
      final result = await api.runCompetitorAnalysis(
        targetUrl: _targetUrlCtrl.text.trim(),
        competitors: _competitorsCtrl.text
            .split('\n')
            .map((l) => l.trim())
            .where((l) => l.isNotEmpty)
            .toList(),
        keywords: _keywordsCtrl.text
            .split(',')
            .map((k) => k.trim())
            .where((k) => k.isNotEmpty)
            .toList(),
      );
      setState(() => _result = result);
    } catch (error, stackTrace) {
      if (mounted) {
        showDiagnosticSnackBar(
          context,
          ref,
          message: context.tr('Analysis failed: {error}', {'error': '$error'}),
          scope: 'research.competitor_analysis',
          error: error,
          stackTrace: stackTrace,
          contextData: {
            'targetUrl': _targetUrlCtrl.text.trim(),
            'competitors': _competitorsCtrl.text.trim(),
          },
        );
      }
    } finally {
      if (mounted) setState(() => _analyzing = false);
    }
  }
}

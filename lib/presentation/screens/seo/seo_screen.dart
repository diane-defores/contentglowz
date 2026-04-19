import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../providers/providers.dart';
import '../../widgets/app_error_view.dart';

class SeoScreen extends ConsumerStatefulWidget {
  const SeoScreen({super.key});

  @override
  ConsumerState<SeoScreen> createState() => _SeoScreenState();
}

class _SeoScreenState extends ConsumerState<SeoScreen> {
  final _repoUrlCtrl = TextEditingController();
  bool _analyzing = false;
  Map<String, dynamic>? _result;

  @override
  void dispose() {
    _repoUrlCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('SEO Mesh')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Topical Mesh Analysis', style: theme.textTheme.titleMedium),
          const SizedBox(height: 4),
          Text('Analyze your site structure and topical coverage',
              style: theme.textTheme.bodySmall
                  ?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
          const SizedBox(height: 16),

          TextField(
            controller: _repoUrlCtrl,
            decoration: const InputDecoration(
              labelText: 'Repository URL',
              hintText: 'https://github.com/user/site',
            ),
            keyboardType: TextInputType.url,
          ),
          const SizedBox(height: 20),

          FilledButton.icon(
            onPressed: _analyzing ? null : _analyze,
            icon: _analyzing
                ? const SizedBox(
                    height: 18, width: 18,
                    child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.hub),
            label: Text(_analyzing ? 'Analyzing...' : 'Analyze Mesh'),
          ),

          if (_result != null) ...[
            const SizedBox(height: 20),
            _MeshResults(result: _result!),
          ],
        ],
      ),
    );
  }

  Future<void> _analyze() async {
    if (_repoUrlCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Repository URL is required')),
      );
      return;
    }

    setState(() {
      _analyzing = true;
      _result = null;
    });

    try {
      final api = ref.read(apiServiceProvider);
      final result = await api.analyzeMesh(repoUrl: _repoUrlCtrl.text.trim());
      setState(() => _result = result);
    } catch (error, stackTrace) {
      if (mounted) {
        showDiagnosticSnackBar(
          context,
          ref,
          message: 'Analysis failed: $error',
          scope: 'seo.analyze_mesh',
          error: error,
          stackTrace: stackTrace,
          contextData: {'repoUrl': _repoUrlCtrl.text.trim()},
        );
      }
    } finally {
      if (mounted) setState(() => _analyzing = false);
    }
  }
}

class _MeshResults extends StatelessWidget {
  const _MeshResults({required this.result});
  final Map<String, dynamic> result;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final pages = result['total_pages'] as num? ?? 0;
    final issues = (result['issues'] as List?)?.length ?? 0;
    final recommendations = (result['recommendations'] as List?)?.length ?? 0;
    final score = result['overall_score'] as num?;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Stats row
        Row(
          children: [
            _StatCard(label: 'Pages', value: '$pages', color: theme.colorScheme.primary),
            const SizedBox(width: 8),
            _StatCard(label: 'Issues', value: '$issues', color: Colors.orange),
            const SizedBox(width: 8),
            _StatCard(label: 'Tips', value: '$recommendations', color: Colors.green),
            if (score != null) ...[
              const SizedBox(width: 8),
              _StatCard(label: 'Score', value: '${score.toInt()}%', color: Colors.blue),
            ],
          ],
        ),

        // Issues
        if (result['issues'] case final List issueList when issueList.isNotEmpty) ...[
          const SizedBox(height: 16),
          Text('Issues', style: theme.textTheme.titleSmall),
          const SizedBox(height: 8),
          ...issueList.take(10).map((issue) => Card(
                margin: const EdgeInsets.only(bottom: 6),
                child: ListTile(
                  dense: true,
                  leading: Icon(Icons.warning_amber, color: Colors.orange, size: 20),
                  title: Text((issue as Map)['description']?.toString() ?? 'Issue',
                      style: const TextStyle(fontSize: 13)),
                ),
              )),
        ],

        // Recommendations
        if (result['recommendations'] case final List recs when recs.isNotEmpty) ...[
          const SizedBox(height: 16),
          Text('Recommendations', style: theme.textTheme.titleSmall),
          const SizedBox(height: 8),
          ...recs.take(10).map((rec) => Card(
                margin: const EdgeInsets.only(bottom: 6),
                child: ListTile(
                  dense: true,
                  leading: Icon(Icons.lightbulb_outline, color: Colors.green, size: 20),
                  title: Text((rec as Map)['description']?.toString() ?? 'Recommendation',
                      style: const TextStyle(fontSize: 13)),
                ),
              )),
        ],
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value, required this.color});
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
            const SizedBox(height: 2),
            Text(label, style: TextStyle(fontSize: 11, color: color)),
          ],
        ),
      ),
    );
  }
}

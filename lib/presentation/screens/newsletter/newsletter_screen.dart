import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../providers/providers.dart';

final _configProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final api = ref.read(apiServiceProvider);
  return api.checkNewsletterConfig();
});

class NewsletterScreen extends ConsumerStatefulWidget {
  const NewsletterScreen({super.key});

  @override
  ConsumerState<NewsletterScreen> createState() => _NewsletterScreenState();
}

class _NewsletterScreenState extends ConsumerState<NewsletterScreen> {
  final _nameCtrl = TextEditingController();
  final _topicsCtrl = TextEditingController();
  final _audienceCtrl = TextEditingController();
  String _tone = 'professional';
  bool _generating = false;
  Map<String, dynamic>? _result;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _topicsCtrl.dispose();
    _audienceCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final configAsync = ref.watch(_configProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Newsletter')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Config status
          configAsync.when(
            loading: () => const LinearProgressIndicator(),
            error: (error, stackTrace) => Card(
              color: theme.colorScheme.errorContainer,
              child: const Padding(
                padding: EdgeInsets.all(12),
                child: Text('Could not check newsletter config'),
              ),
            ),
            data: (config) {
              final configured = config['configured'] == true;
              return Card(
                color: configured
                    ? Colors.green.withValues(alpha: 0.1)
                    : Colors.orange.withValues(alpha: 0.1),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      Icon(
                        configured ? Icons.check_circle : Icons.warning,
                        color: configured ? Colors.green : Colors.orange,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          configured
                              ? 'Newsletter agent configured'
                              : 'Newsletter agent not fully configured',
                          style: const TextStyle(fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 20),

          Text('Generate Newsletter', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),

          TextField(
            controller: _nameCtrl,
            decoration: const InputDecoration(
              labelText: 'Newsletter name',
              hintText: 'Weekly Tech Digest #43',
            ),
          ),
          const SizedBox(height: 12),

          TextField(
            controller: _topicsCtrl,
            decoration: const InputDecoration(
              labelText: 'Topics (comma-separated)',
              hintText: 'AI, Flutter, SaaS',
            ),
          ),
          const SizedBox(height: 12),

          TextField(
            controller: _audienceCtrl,
            decoration: const InputDecoration(
              labelText: 'Target audience',
              hintText: 'Indie developers building SaaS products',
            ),
          ),
          const SizedBox(height: 12),

          DropdownButtonFormField<String>(
            initialValue: _tone,
            decoration: const InputDecoration(labelText: 'Tone'),
            items: const [
              DropdownMenuItem(value: 'professional', child: Text('Professional')),
              DropdownMenuItem(value: 'casual', child: Text('Casual')),
              DropdownMenuItem(value: 'technical', child: Text('Technical')),
              DropdownMenuItem(value: 'inspirational', child: Text('Inspirational')),
            ],
            onChanged: (v) => setState(() => _tone = v ?? 'professional'),
          ),
          const SizedBox(height: 20),

          FilledButton.icon(
            onPressed: _generating ? null : _generate,
            icon: _generating
                ? const SizedBox(
                    height: 18, width: 18,
                    child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.auto_awesome),
            label: Text(_generating ? 'Generating...' : 'Generate'),
          ),

          if (_result != null) ...[
            const SizedBox(height: 20),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Job started', style: theme.textTheme.titleSmall),
                    const SizedBox(height: 8),
                    Text('Job ID: ${_result!['job_id'] ?? 'unknown'}',
                        style: theme.textTheme.bodySmall),
                    Text('Status: ${_result!['status'] ?? 'queued'}',
                        style: theme.textTheme.bodySmall),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _generate() async {
    if (_nameCtrl.text.trim().isEmpty || _topicsCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Name and topics are required')),
      );
      return;
    }

    setState(() {
      _generating = true;
      _result = null;
    });

    try {
      final api = ref.read(apiServiceProvider);
      final result = await api.generateNewsletter(
        name: _nameCtrl.text.trim(),
        topics: _topicsCtrl.text.split(',').map((t) => t.trim()).where((t) => t.isNotEmpty).toList(),
        targetAudience: _audienceCtrl.text.trim().isEmpty
            ? 'General audience'
            : _audienceCtrl.text.trim(),
        tone: _tone,
      );
      setState(() => _result = result);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Generation failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _generating = false);
    }
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../l10n/app_localizations.dart';
import '../../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_error_view.dart';
import '../../widgets/project_picker_action.dart';

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
    final palette = AppTheme.paletteOf(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('Newsletter')),
        actions: const [ProjectPickerAction()],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Config status
          configAsync.when(
            loading: () => const LinearProgressIndicator(),
            error: (error, stackTrace) => AppErrorView(
              scope: 'newsletter.config',
              title: context.tr('Could not check newsletter config'),
              error: error,
              stackTrace: stackTrace,
              compact: true,
              showIcon: false,
              onRetry: () => ref.invalidate(_configProvider),
            ),
            data: (config) {
              final configured = config['configured'] == true;
              final statusColor = configured
                  ? AppTheme.approveColor
                  : AppTheme.warningColor;
              return Card(
                color: configured
                    ? statusColor.withValues(alpha: 0.1)
                    : palette.mutedSurface,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      Icon(
                        configured ? Icons.check_circle : Icons.warning,
                        color: statusColor,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          configured
                              ? context.tr('Newsletter agent configured')
                              : context.tr(
                                  'Newsletter agent not fully configured',
                                ),
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

          Text(
            context.tr('Generate Newsletter'),
            style: theme.textTheme.titleMedium,
          ),
          const SizedBox(height: 12),

          TextField(
            controller: _nameCtrl,
            decoration: InputDecoration(
              labelText: context.tr('Newsletter name'),
              hintText: context.tr('Weekly Tech Digest #43'),
            ),
          ),
          const SizedBox(height: 12),

          TextField(
            controller: _topicsCtrl,
            decoration: InputDecoration(
              labelText: context.tr('Topics (comma-separated)'),
              hintText: context.tr('AI, Flutter, SaaS'),
            ),
          ),
          const SizedBox(height: 12),

          TextField(
            controller: _audienceCtrl,
            decoration: InputDecoration(
              labelText: context.tr('Target audience'),
              hintText: context.tr('Indie developers building SaaS products'),
            ),
          ),
          const SizedBox(height: 12),

          DropdownButtonFormField<String>(
            initialValue: _tone,
            decoration: InputDecoration(labelText: context.tr('Tone')),
            items: [
              DropdownMenuItem(
                value: 'professional',
                child: Text(context.tr('Professional')),
              ),
              DropdownMenuItem(
                value: 'casual',
                child: Text(context.tr('Casual')),
              ),
              DropdownMenuItem(
                value: 'technical',
                child: Text(context.tr('Technical')),
              ),
              DropdownMenuItem(
                value: 'inspirational',
                child: Text(context.tr('Inspirational')),
              ),
            ],
            onChanged: (v) => setState(() => _tone = v ?? 'professional'),
          ),
          const SizedBox(height: 20),

          FilledButton.icon(
            onPressed: _generating ? null : _generate,
            icon: _generating
                ? const SizedBox(
                    height: 18,
                    width: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.auto_awesome),
            label: Text(context.tr(_generating ? 'Generating...' : 'Generate')),
          ),

          if (_result != null) ...[
            const SizedBox(height: 20),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      context.tr('Job started'),
                      style: theme.textTheme.titleSmall,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      context.tr('Job ID: {jobId}', {
                        'jobId': _result!['job_id'] ?? context.tr('unknown'),
                      }),
                      style: theme.textTheme.bodySmall,
                    ),
                    Text(
                      context.tr('Status: {status}', {
                        'status': _result!['status'] ?? context.tr('queued'),
                      }),
                      style: theme.textTheme.bodySmall,
                    ),
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
        SnackBar(content: Text(context.tr('Name and topics are required'))),
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
        topics: _topicsCtrl.text
            .split(',')
            .map((t) => t.trim())
            .where((t) => t.isNotEmpty)
            .toList(),
        targetAudience: _audienceCtrl.text.trim().isEmpty
            ? context.tr('General audience')
            : _audienceCtrl.text.trim(),
        tone: _tone,
      );
      setState(() => _result = result);
    } catch (error, stackTrace) {
      if (mounted) {
        showDiagnosticSnackBar(
          context,
          ref,
          message: context.tr('Generation failed: {error}', {'error': error}),
          scope: 'newsletter.generate',
          error: error,
          stackTrace: stackTrace,
          contextData: {'name': _nameCtrl.text.trim()},
        );
      }
    } finally {
      if (mounted) setState(() => _generating = false);
    }
  }
}

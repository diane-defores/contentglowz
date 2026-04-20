import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/services/api_service.dart';
import '../../../providers/providers.dart';
import '../../../l10n/app_localizations.dart';
import '../../widgets/app_error_view.dart';

const _cadenceModes = ['fixed', 'ramp_up'];
const _clusterModes = ['directory', 'tags', 'auto', 'none'];
const _frameworks = ['astro', 'next', 'hugo', 'jekyll', 'eleventy'];
const _gatingMethods = ['future_date', 'draft_flag', 'both'];
const _rebuildMethods = ['webhook', 'github_actions', 'manual'];

class DripWizardSheet extends ConsumerStatefulWidget {
  const DripWizardSheet({super.key, this.onCreated});
  final VoidCallback? onCreated;

  @override
  ConsumerState<DripWizardSheet> createState() => _DripWizardSheetState();
}

class _DripWizardSheetState extends ConsumerState<DripWizardSheet> {
  int _step = 0;
  bool _submitting = false;

  // Step 1 — Basics
  final _nameCtrl = TextEditingController();
  final _directoryCtrl = TextEditingController(text: 'src/data');

  // Step 2 — Cadence
  String _cadenceMode = 'fixed';
  int _itemsPerDay = 3;
  final _startDateCtrl = TextEditingController();
  final List<int> _publishDays = [0, 1, 2, 3, 4]; // Mon-Fri
  final _publishTimeCtrl = TextEditingController(text: '06:00');

  // Step 3 — Clustering
  String _clusterMode = 'directory';
  bool _pillarFirst = true;

  // Step 4 — Deploy
  String _framework = 'astro';
  String _gatingMethod = 'future_date';
  String _rebuildMethod = 'manual';
  final _webhookUrlCtrl = TextEditingController();
  final _githubRepoCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    final now = DateTime.now().add(const Duration(days: 1));
    _startDateCtrl.text = '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _directoryCtrl.dispose();
    _startDateCtrl.dispose();
    _publishTimeCtrl.dispose();
    _webhookUrlCtrl.dispose();
    _githubRepoCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) => Column(
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    context.tr('New Drip Plan — Step {step}/4', {'step': _step + 1}),
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),

          // Step indicator
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: List.generate(4, (i) => Expanded(
                child: Container(
                  height: 4,
                  margin: const EdgeInsets.symmetric(horizontal: 2),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(2),
                    color: i <= _step ? colorScheme.primary : colorScheme.surfaceContainerHighest,
                  ),
                ),
              )),
            ),
          ),

          // Content
          Expanded(
            child: SingleChildScrollView(
              controller: scrollController,
              padding: const EdgeInsets.all(16),
              child: switch (_step) {
                0 => _buildStep1(),
                1 => _buildStep2(),
                2 => _buildStep3(),
                3 => _buildStep4(),
                _ => const SizedBox.shrink(),
              },
            ),
          ),

          // Footer buttons
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                if (_step > 0)
                  TextButton(
                    onPressed: () => setState(() => _step--),
                    child: Text(context.tr('Back')),
                  ),
                const Spacer(),
                if (_step < 3)
                  FilledButton(
                    onPressed: _canAdvance ? () => setState(() => _step++) : null,
                    child: Text(context.tr('Next')),
                  ),
                if (_step == 3)
                  FilledButton(
                    onPressed: _submitting ? null : _submit,
                    child: _submitting
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                        : Text(context.tr('Create Plan')),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  bool get _canAdvance => switch (_step) {
    0 => _nameCtrl.text.trim().isNotEmpty,
    1 => _startDateCtrl.text.isNotEmpty && _publishDays.isNotEmpty,
    2 => true,
    _ => true,
  };

  String _localizedWeekDay(int index) => switch (index) {
        0 => context.tr('Mon'),
        1 => context.tr('Tue'),
        2 => context.tr('Wed'),
        3 => context.tr('Thu'),
        4 => context.tr('Fri'),
        5 => context.tr('Sat'),
        _ => context.tr('Sun'),
      };

  // ─── Step 1: Basics ──────────────────────────────

  Widget _buildStep1() => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(context.tr('Name & Source'),
          style: Theme.of(context).textTheme.titleSmall),
      const SizedBox(height: 16),
      TextField(
        controller: _nameCtrl,
        decoration: InputDecoration(
          labelText: context.tr('Plan name'),
          hintText: context.tr('e.g. GoCharbon Launch'),
          border: const OutlineInputBorder(),
        ),
        onChanged: (_) => setState(() {}),
      ),
      const SizedBox(height: 16),
      TextField(
        controller: _directoryCtrl,
        decoration: InputDecoration(
          labelText: context.tr('Content directory'),
          hintText: context.tr('e.g. src/data'),
          border: const OutlineInputBorder(),
          helperText: context.tr('Absolute path to the Markdown files'),
        ),
      ),
    ],
  );

  // ─── Step 2: Cadence ─────────────────────────────

  Widget _buildStep2() => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(context.tr('Cadence'), style: Theme.of(context).textTheme.titleSmall),
      const SizedBox(height: 16),
      SegmentedButton<String>(
        segments: _cadenceModes
            .map(
              (m) => ButtonSegment(
                value: m,
                label: Text(
                  m == 'ramp_up'
                      ? context.tr('Ramp up')
                      : context.tr('Fixed'),
                ),
              ),
            )
            .toList(),
        selected: {_cadenceMode},
        onSelectionChanged: (s) => setState(() => _cadenceMode = s.first),
      ),
      const SizedBox(height: 16),
      Row(
        children: [
          Expanded(
            child: TextField(
              decoration: InputDecoration(
                labelText: context.tr('Articles/day'),
                border: const OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
              controller: TextEditingController(text: '$_itemsPerDay'),
              onChanged: (v) => _itemsPerDay = int.tryParse(v) ?? 3,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: TextField(
              controller: _startDateCtrl,
              decoration: InputDecoration(
                labelText: context.tr('Start date'),
                border: const OutlineInputBorder(),
                hintText: context.tr('YYYY-MM-DD'),
              ),
            ),
          ),
        ],
      ),
      const SizedBox(height: 16),
      TextField(
        controller: _publishTimeCtrl,
        decoration: InputDecoration(
          labelText: context.tr('Publish time'),
          border: const OutlineInputBorder(),
          hintText: context.tr('HH:MM'),
        ),
      ),
      const SizedBox(height: 16),
      Text(context.tr('Publish days'),
          style: Theme.of(context).textTheme.bodyMedium),
      const SizedBox(height: 8),
      Wrap(
        spacing: 8,
        children: List.generate(7, (i) => FilterChip(
          label: Text(_localizedWeekDay(i)),
          selected: _publishDays.contains(i),
          onSelected: (selected) {
            setState(() {
              if (selected) {
                _publishDays.add(i);
              } else {
                _publishDays.remove(i);
              }
              _publishDays.sort();
            });
          },
        )),
      ),
    ],
  );

  // ─── Step 3: Clustering ──────────────────────────

  Widget _buildStep3() => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(context.tr('Clustering Strategy'),
          style: Theme.of(context).textTheme.titleSmall),
      const SizedBox(height: 16),
      ...(_clusterModes.map((m) => ListTile(
        leading: Icon(
          _clusterMode == m ? Icons.radio_button_checked : Icons.radio_button_unchecked,
          color: _clusterMode == m ? Theme.of(context).colorScheme.primary : null,
        ),
        title: Text(switch (m) {
          'directory' => context.tr('By directory structure'),
          'tags' => context.tr('By frontmatter tags'),
          'auto' => context.tr('Auto (AI detects semantic cocoons)'),
          'none' => context.tr('No clustering (alphabetical)'),
          _ => m,
        }),
        subtitle: Text(switch (m) {
          'directory' => context.tr('Each folder becomes a cluster. index.md = pillar.'),
          'tags' => context.tr('First tag = cluster. Most tags = pillar.'),
          'auto' => context.tr('Topical Mesh Architect detects pillars & spokes.'),
          'none' => context.tr('Articles published in file order.'),
          _ => '',
        }, style: const TextStyle(fontSize: 12)),
        onTap: () => setState(() => _clusterMode = m),
      ))),
      const SizedBox(height: 8),
      SwitchListTile(
        title: Text(context.tr('Publish pillar before spokes')),
        value: _pillarFirst,
        onChanged: (v) => setState(() => _pillarFirst = v),
      ),
    ],
  );

  // ─── Step 4: Deploy ──────────────────────────────

  Widget _buildStep4() => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(context.tr('Deployment'), style: Theme.of(context).textTheme.titleSmall),
      const SizedBox(height: 16),
      DropdownButtonFormField<String>(
        initialValue: _framework,
        decoration: InputDecoration(
            labelText: context.tr('SSG Framework'),
            border: const OutlineInputBorder()),
        items: _frameworks.map((f) => DropdownMenuItem(value: f, child: Text(f[0].toUpperCase() + f.substring(1)))).toList(),
        onChanged: (v) => setState(() => _framework = v!),
      ),
      const SizedBox(height: 16),
      DropdownButtonFormField<String>(
        initialValue: _gatingMethod,
        decoration: InputDecoration(
            labelText: context.tr('Gating method'),
            border: const OutlineInputBorder()),
        items: _gatingMethods.map((g) => DropdownMenuItem(
          value: g,
          child: Text(switch (g) {
            'future_date' => context.tr('Future pubDate (recommended)'),
            'draft_flag' => context.tr('Draft flag'),
            'both' => context.tr('Both'),
            _ => g,
          }),
        )).toList(),
        onChanged: (v) => setState(() => _gatingMethod = v!),
      ),
      const SizedBox(height: 16),
      DropdownButtonFormField<String>(
        initialValue: _rebuildMethod,
        decoration: InputDecoration(
            labelText: context.tr('Rebuild method'),
            border: const OutlineInputBorder()),
        items: _rebuildMethods.map((r) => DropdownMenuItem(
          value: r,
          child: Text(switch (r) {
            'webhook' => context.tr('Webhook (Vercel/Netlify)'),
            'github_actions' => context.tr('GitHub Actions'),
            'manual' => context.tr('Manual'),
            _ => r,
          }),
        )).toList(),
        onChanged: (v) => setState(() => _rebuildMethod = v!),
      ),
      if (_rebuildMethod == 'webhook') ...[
        const SizedBox(height: 16),
        TextField(
          controller: _webhookUrlCtrl,
          decoration: InputDecoration(
            labelText: context.tr('Webhook URL'),
            border: const OutlineInputBorder(),
            hintText: context.tr('https://api.vercel.com/v1/integrations/deploy/...'),
          ),
        ),
      ],
      if (_rebuildMethod == 'github_actions') ...[
        const SizedBox(height: 16),
        TextField(
          controller: _githubRepoCtrl,
          decoration: InputDecoration(
            labelText: context.tr('GitHub repo'),
            border: const OutlineInputBorder(),
            hintText: context.tr('owner/repo'),
          ),
        ),
      ],
    ],
  );

  // ─── Submit ──────────────────────────────────────

  Future<void> _submit() async {
    setState(() => _submitting = true);
    final api = ref.read(apiServiceProvider);

    try {
      final result = await api.createDripPlan({
        'name': _nameCtrl.text.trim(),
        'cadence': {
          'mode': _cadenceMode,
          'items_per_day': _itemsPerDay,
          'start_date': _startDateCtrl.text.trim(),
          'publish_days': _publishDays,
          'publish_time': _publishTimeCtrl.text.trim(),
          'timezone': 'Europe/Paris',
        },
        'cluster_strategy': {
          'mode': _clusterMode,
          'pillar_first': _pillarFirst,
        },
        'ssg_config': {
          'framework': _framework,
          'gating_method': _gatingMethod,
          'rebuild_method': _rebuildMethod,
          if (_rebuildMethod == 'webhook') 'rebuild_webhook_url': _webhookUrlCtrl.text.trim(),
          if (_rebuildMethod == 'github_actions') 'rebuild_github_repo': _githubRepoCtrl.text.trim(),
          'content_directory': _directoryCtrl.text.trim(),
        },
      });

      if (mounted) {
        widget.onCreated?.call();
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              result['queued'] == true
                  ? context.tr(
                      'Drip plan queued. It will sync when FastAPI is back.',
                    )
                  : context.tr(
                      'Drip plan created! Import content to get started.',
                    ),
            ),
          ),
        );
      }
    } catch (error, stackTrace) {
      if (mounted) {
        showDiagnosticSnackBar(
          context,
          ref,
          message: context.tr('Error: {error}', {'error': '$error'}),
          scope: 'drip.create_plan',
          error: error,
          stackTrace: stackTrace,
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }
}

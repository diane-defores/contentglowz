import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/services/api_service.dart';
import '../../../providers/providers.dart';

const _cadenceModes = ['fixed', 'ramp_up'];
const _clusterModes = ['directory', 'tags', 'auto', 'none'];
const _frameworks = ['astro', 'next', 'hugo', 'jekyll', 'eleventy'];
const _gatingMethods = ['future_date', 'draft_flag', 'both'];
const _rebuildMethods = ['webhook', 'github_actions', 'manual'];
const _weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
                    'New Drip Plan — Step ${_step + 1}/4',
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
                    child: const Text('Back'),
                  ),
                const Spacer(),
                if (_step < 3)
                  FilledButton(
                    onPressed: _canAdvance ? () => setState(() => _step++) : null,
                    child: const Text('Next'),
                  ),
                if (_step == 3)
                  FilledButton(
                    onPressed: _submitting ? null : _submit,
                    child: _submitting
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Text('Create Plan'),
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

  // ─── Step 1: Basics ──────────────────────────────

  Widget _buildStep1() => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text('Name & Source', style: Theme.of(context).textTheme.titleSmall),
      const SizedBox(height: 16),
      TextField(
        controller: _nameCtrl,
        decoration: const InputDecoration(
          labelText: 'Plan name',
          hintText: 'e.g. GoCharbon Launch',
          border: OutlineInputBorder(),
        ),
        onChanged: (_) => setState(() {}),
      ),
      const SizedBox(height: 16),
      TextField(
        controller: _directoryCtrl,
        decoration: const InputDecoration(
          labelText: 'Content directory',
          hintText: 'e.g. src/data',
          border: OutlineInputBorder(),
          helperText: 'Absolute path to the Markdown files',
        ),
      ),
    ],
  );

  // ─── Step 2: Cadence ─────────────────────────────

  Widget _buildStep2() => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text('Cadence', style: Theme.of(context).textTheme.titleSmall),
      const SizedBox(height: 16),
      SegmentedButton<String>(
        segments: _cadenceModes.map((m) => ButtonSegment(value: m, label: Text(m == 'ramp_up' ? 'Ramp up' : 'Fixed'))).toList(),
        selected: {_cadenceMode},
        onSelectionChanged: (s) => setState(() => _cadenceMode = s.first),
      ),
      const SizedBox(height: 16),
      Row(
        children: [
          Expanded(
            child: TextField(
              decoration: const InputDecoration(
                labelText: 'Articles/day',
                border: OutlineInputBorder(),
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
              decoration: const InputDecoration(
                labelText: 'Start date',
                border: OutlineInputBorder(),
                hintText: 'YYYY-MM-DD',
              ),
            ),
          ),
        ],
      ),
      const SizedBox(height: 16),
      TextField(
        controller: _publishTimeCtrl,
        decoration: const InputDecoration(
          labelText: 'Publish time',
          border: OutlineInputBorder(),
          hintText: 'HH:MM',
        ),
      ),
      const SizedBox(height: 16),
      Text('Publish days', style: Theme.of(context).textTheme.bodyMedium),
      const SizedBox(height: 8),
      Wrap(
        spacing: 8,
        children: List.generate(7, (i) => FilterChip(
          label: Text(_weekDays[i]),
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
      Text('Clustering Strategy', style: Theme.of(context).textTheme.titleSmall),
      const SizedBox(height: 16),
      ...(_clusterModes.map((m) => ListTile(
        leading: Icon(
          _clusterMode == m ? Icons.radio_button_checked : Icons.radio_button_unchecked,
          color: _clusterMode == m ? Theme.of(context).colorScheme.primary : null,
        ),
        title: Text(switch (m) {
          'directory' => 'By directory structure',
          'tags' => 'By frontmatter tags',
          'auto' => 'Auto (AI detects semantic cocoons)',
          'none' => 'No clustering (alphabetical)',
          _ => m,
        }),
        subtitle: Text(switch (m) {
          'directory' => 'Each folder becomes a cluster. index.md = pillar.',
          'tags' => 'First tag = cluster. Most tags = pillar.',
          'auto' => 'Topical Mesh Architect detects pillars & spokes.',
          'none' => 'Articles published in file order.',
          _ => '',
        }, style: const TextStyle(fontSize: 12)),
        onTap: () => setState(() => _clusterMode = m),
      ))),
      const SizedBox(height: 8),
      SwitchListTile(
        title: const Text('Publish pillar before spokes'),
        value: _pillarFirst,
        onChanged: (v) => setState(() => _pillarFirst = v),
      ),
    ],
  );

  // ─── Step 4: Deploy ──────────────────────────────

  Widget _buildStep4() => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text('Deployment', style: Theme.of(context).textTheme.titleSmall),
      const SizedBox(height: 16),
      DropdownButtonFormField<String>(
        initialValue: _framework,
        decoration: const InputDecoration(labelText: 'SSG Framework', border: OutlineInputBorder()),
        items: _frameworks.map((f) => DropdownMenuItem(value: f, child: Text(f[0].toUpperCase() + f.substring(1)))).toList(),
        onChanged: (v) => setState(() => _framework = v!),
      ),
      const SizedBox(height: 16),
      DropdownButtonFormField<String>(
        initialValue: _gatingMethod,
        decoration: const InputDecoration(labelText: 'Gating method', border: OutlineInputBorder()),
        items: _gatingMethods.map((g) => DropdownMenuItem(
          value: g,
          child: Text(switch (g) {
            'future_date' => 'Future pubDate (recommended)',
            'draft_flag' => 'Draft flag',
            'both' => 'Both',
            _ => g,
          }),
        )).toList(),
        onChanged: (v) => setState(() => _gatingMethod = v!),
      ),
      const SizedBox(height: 16),
      DropdownButtonFormField<String>(
        initialValue: _rebuildMethod,
        decoration: const InputDecoration(labelText: 'Rebuild method', border: OutlineInputBorder()),
        items: _rebuildMethods.map((r) => DropdownMenuItem(
          value: r,
          child: Text(switch (r) {
            'webhook' => 'Webhook (Vercel/Netlify)',
            'github_actions' => 'GitHub Actions',
            'manual' => 'Manual',
            _ => r,
          }),
        )).toList(),
        onChanged: (v) => setState(() => _rebuildMethod = v!),
      ),
      if (_rebuildMethod == 'webhook') ...[
        const SizedBox(height: 16),
        TextField(
          controller: _webhookUrlCtrl,
          decoration: const InputDecoration(
            labelText: 'Webhook URL',
            border: OutlineInputBorder(),
            hintText: 'https://api.vercel.com/v1/integrations/deploy/...',
          ),
        ),
      ],
      if (_rebuildMethod == 'github_actions') ...[
        const SizedBox(height: 16),
        TextField(
          controller: _githubRepoCtrl,
          decoration: const InputDecoration(
            labelText: 'GitHub repo',
            border: OutlineInputBorder(),
            hintText: 'owner/repo',
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
      await api.createDripPlan({
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
          const SnackBar(content: Text('Drip plan created! Import content to get started.')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }
}

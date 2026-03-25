import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../data/demo/demo_seed.dart';
import '../../../data/models/project.dart';
import '../../../providers/providers.dart';
import '../../theme/app_theme.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _pageController = PageController();
  int _currentPage = 0;
  bool _isFinishing = false;

  // Page 1: GitHub repo
  final _repoUrlController = TextEditingController();
  final _projectNameController = TextEditingController();

  // Page 2: Content types
  late List<ContentTypeConfig> _contentTypes;
  late final bool _isDemoMode;

  @override
  void initState() {
    super.initState();
    _isDemoMode = ref.read(authSessionProvider).isDemo;
    if (_isDemoMode) {
      _projectNameController.text = DemoSeed.projectName;
      _repoUrlController.text = DemoSeed.repoUrl;
      _contentTypes = DemoSeed.contentTypes();
    } else {
      _contentTypes = ContentTypeConfig.defaults();
    }
    _projectNameController.addListener(_onProjectChanged);
    _repoUrlController.addListener(_onProjectChanged);
  }

  @override
  void dispose() {
    _projectNameController.removeListener(_onProjectChanged);
    _repoUrlController.removeListener(_onProjectChanged);
    _pageController.dispose();
    _repoUrlController.dispose();
    _projectNameController.dispose();
    super.dispose();
  }

  void _onProjectChanged() {
    if (mounted) {
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Setup'),
        leading: _currentPage > 0
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: _previousPage,
              )
            : null,
      ),
      body: Column(
        children: [
          // Progress indicator
          _buildProgressBar(),
          // Pages
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              onPageChanged: (i) => setState(() => _currentPage = i),
              children: [
                _buildProjectPage(),
                _buildContentTypesPage(),
                _buildSummaryPage(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      child: Row(
        children: List.generate(3, (i) {
          final isActive = i <= _currentPage;
          return Expanded(
            child: Container(
              height: 4,
              margin: const EdgeInsets.symmetric(horizontal: 3),
              decoration: BoxDecoration(
                color: isActive
                    ? AppTheme.approveColor
                    : Colors.white.withAlpha(20),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          );
        }),
      ),
    );
  }

  // ── Page 1: Project ──

  Widget _buildProjectPage() {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        if (_isDemoMode) ...[
          _buildDemoBanner(),
          const SizedBox(height: 24),
        ],
        const Text(
          'Connect your project',
          style: TextStyle(
              fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
        ),
        const SizedBox(height: 8),
        Text(
          'Link your GitHub repository so the AI can analyze your codebase and generate relevant content.',
          style: TextStyle(
              fontSize: 15, color: Colors.white.withAlpha(150), height: 1.5),
        ),
        const SizedBox(height: 32),
        TextField(
          controller: _projectNameController,
          readOnly: _isDemoMode,
          decoration: const InputDecoration(
            labelText: 'Project name',
            hintText: 'My Tech Blog',
            prefixIcon: Icon(Icons.folder_outlined),
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _repoUrlController,
          readOnly: _isDemoMode,
          decoration: const InputDecoration(
            labelText: 'GitHub URL',
            hintText: 'https://github.com/user/repo',
            prefixIcon: Icon(Icons.link),
          ),
          keyboardType: TextInputType.url,
        ),
        const SizedBox(height: 32),
        FilledButton(
          onPressed: _projectNameController.text.isNotEmpty ? _nextPage : null,
          style: FilledButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
            backgroundColor: AppTheme.approveColor,
          ),
          child: Text(_isDemoMode ? 'Review Demo Setup' : 'Continue'),
        ),
      ],
    );
  }

  Widget _buildDemoBanner() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.approveColor.withAlpha(24),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.approveColor.withAlpha(70)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Demo workspace locked',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'This onboarding uses a fixed public repo and pre-generated content. '
            'Users can explore the flow, but the demo data is intentionally read-only.',
            style: TextStyle(
              color: Colors.white.withAlpha(150),
              fontSize: 14,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  // ── Page 2: Content Types ──

  Widget _buildContentTypesPage() {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const Text(
          'What content do you want?',
          style: TextStyle(
              fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
        ),
        const SizedBox(height: 8),
        Text(
          'Choose the types of content the AI should generate for you, and how often.',
          style: TextStyle(
              fontSize: 15, color: Colors.white.withAlpha(150), height: 1.5),
        ),
        const SizedBox(height: 24),
        ...List.generate(_contentTypes.length, (i) {
          final ct = _contentTypes[i];
          return _buildContentTypeCard(ct, i);
        }),
        const SizedBox(height: 24),
        FilledButton(
          onPressed:
              _contentTypes.any((c) => c.enabled) ? _nextPage : null,
          style: FilledButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
            backgroundColor: AppTheme.approveColor,
          ),
          child: const Text('Continue'),
        ),
      ],
    );
  }

  Widget _buildContentTypeCard(ContentTypeConfig ct, int index) {
    final iconData = _iconForType(ct.icon);
    final color = AppTheme.colorForContentType(ct.label.split(' ').first);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: ct.enabled
            ? color.withAlpha(15)
            : const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: ct.enabled ? color.withAlpha(80) : Colors.white.withAlpha(15),
        ),
      ),
      child: Column(
        children: [
          // Toggle row
          ListTile(
            leading: Icon(iconData,
                color: ct.enabled ? color : Colors.white.withAlpha(80)),
            title: Text(ct.label,
                style: TextStyle(
                    color: ct.enabled ? Colors.white : Colors.white54)),
            trailing: Switch(
              value: ct.enabled,
              activeTrackColor: color,
              onChanged: _isDemoMode
                  ? null
                  : (val) {
                setState(() {
                  _contentTypes[index] = ct.copyWith(enabled: val);
                });
              },
            ),
          ),
          // Frequency slider (if enabled)
          if (ct.enabled)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Row(
                children: [
                  Text('${ct.frequencyPerWeek}/week',
                      style: TextStyle(
                          color: color,
                          fontWeight: FontWeight.w600,
                          fontSize: 14)),
                  Expanded(
                    child: Slider(
                      value: ct.frequencyPerWeek.toDouble(),
                      min: 1,
                      max: ct.type == 'social_post' ? 14 : 7,
                      divisions: (ct.type == 'social_post' ? 13 : 6),
                      activeColor: color,
                      onChanged: _isDemoMode
                          ? null
                          : (val) {
                        setState(() {
                          _contentTypes[index] =
                              ct.copyWith(frequencyPerWeek: val.round());
                        });
                      },
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  // ── Page 3: Summary ──

  Widget _buildSummaryPage() {
    final enabled = _contentTypes.where((c) => c.enabled).toList();
    final totalPerWeek =
        enabled.fold<int>(0, (sum, c) => sum + c.frequencyPerWeek);

    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const Text(
          'Ready to go!',
          style: TextStyle(
              fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
        ),
        const SizedBox(height: 8),
        Text(
          _isDemoMode
              ? 'Here is the fixed demo workspace that will be served to every demo user.'
              : 'Here\'s your content plan. You can change it anytime in Settings.',
          style: TextStyle(
              fontSize: 15, color: Colors.white.withAlpha(150), height: 1.5),
        ),
        const SizedBox(height: 24),
        // Project card
        _summaryCard(
          icon: Icons.folder_outlined,
          title: _projectNameController.text.isEmpty
              ? 'Project'
              : _projectNameController.text,
          subtitle: _repoUrlController.text.isEmpty
              ? 'No repo linked'
              : _isDemoMode
                  ? '${_repoUrlController.text}\nLive demo: ${DemoSeed.siteUrl}'
                  : _repoUrlController.text,
        ),
        const SizedBox(height: 12),
        // Content summary
        _summaryCard(
          icon: Icons.auto_awesome,
          title: '$totalPerWeek contents/week',
          subtitle: enabled.map((c) => c.label).join(', '),
        ),
        const SizedBox(height: 12),
        // Next steps
        _summaryCard(
          icon: Icons.checklist,
          title: 'Next steps',
          subtitle:
              '1. Set up your brand voice (weekly ritual)\n2. Create a customer persona\n3. Content starts flowing!',
        ),
        const SizedBox(height: 32),
        FilledButton(
          onPressed: _isFinishing ? null : _finish,
          style: FilledButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
            backgroundColor: AppTheme.approveColor,
          ),
          child: _isFinishing
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : Text(_isDemoMode ? 'Open Demo Workspace' : 'Start'),
        ),
      ],
    );
  }

  Widget _summaryCard(
      {required IconData icon,
      required String title,
      required String subtitle}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withAlpha(15)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppTheme.approveColor, size: 24),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 16)),
                const SizedBox(height: 4),
                Text(subtitle,
                    style: TextStyle(
                        color: Colors.white.withAlpha(120),
                        fontSize: 14,
                        height: 1.5)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  IconData _iconForType(String icon) => switch (icon) {
        'article' => Icons.article_outlined,
        'email' => Icons.email_outlined,
        'chat' => Icons.chat_bubble_outline,
        'videocam' => Icons.videocam_outlined,
        'slow_motion_video' => Icons.slow_motion_video,
        _ => Icons.auto_awesome,
      };

  void _nextPage() {
    _pageController.nextPage(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  void _previousPage() {
    _pageController.previousPage(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  Future<void> _finish() async {
    if (_isDemoMode) {
      ref.read(authSessionProvider.notifier).markOnboardingComplete();
      context.go('/feed');
      return;
    }

    setState(() => _isFinishing = true);
    try {
      final api = ref.read(apiServiceProvider);
      await api.onboardProject(
        _repoUrlController.text.trim(),
        _projectNameController.text.trim(),
      );
      ref.invalidate(projectsProvider);
      ref.invalidate(appBootstrapProvider);
      if (!mounted) return;
      context.go('/entry');
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Workspace creation failed: $error')),
      );
    } finally {
      if (mounted) {
        setState(() => _isFinishing = false);
      }
    }
  }
}

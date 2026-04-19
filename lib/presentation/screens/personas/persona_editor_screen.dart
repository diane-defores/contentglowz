import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../data/models/persona.dart';
import '../../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_error_view.dart';
import '../../../l10n/app_localizations.dart';

class PersonaEditorScreen extends ConsumerStatefulWidget {
  final String? personaId;

  const PersonaEditorScreen({super.key, this.personaId});

  @override
  ConsumerState<PersonaEditorScreen> createState() =>
      _PersonaEditorScreenState();
}

class _PersonaEditorScreenState extends ConsumerState<PersonaEditorScreen> {
  late TextEditingController _nameController;
  late TextEditingController _roleController;
  late TextEditingController _industryController;
  late TextEditingController _ageRangeController;
  late TextEditingController _experienceController;
  final List<TextEditingController> _painPointControllers = [];
  final List<TextEditingController> _goalControllers = [];
  final List<TextEditingController> _vocabularyControllers = [];
  final List<TextEditingController> _objectionControllers = [];
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
    _roleController = TextEditingController();
    _industryController = TextEditingController();
    _ageRangeController = TextEditingController();
    _experienceController = TextEditingController();
    // Start with 2 empty pain points and goals
    _painPointControllers
        .addAll([TextEditingController(), TextEditingController()]);
    _goalControllers
        .addAll([TextEditingController(), TextEditingController()]);
    _vocabularyControllers
        .addAll([TextEditingController(), TextEditingController()]);
    _objectionControllers
        .addAll([TextEditingController(), TextEditingController()]);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _roleController.dispose();
    _industryController.dispose();
    _ageRangeController.dispose();
    _experienceController.dispose();
    for (final c in _painPointControllers) {
      c.dispose();
    }
    for (final c in _goalControllers) {
      c.dispose();
    }
    for (final c in _vocabularyControllers) {
      c.dispose();
    }
    for (final c in _objectionControllers) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
            widget.personaId != null
                ? context.tr('Edit Persona')
                : context.tr('New Persona')),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        actions: [
          TextButton(
            onPressed: _isSaving ? null : _save,
            child: _isSaving
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(context.tr('Save')),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Name
          _sectionLabel(context.tr('Identity')),
          const SizedBox(height: 12),
          TextField(
            controller: _nameController,
            decoration: InputDecoration(
              labelText: context.tr('Persona name'),
              hintText: context.tr('e.g. Tech-Savvy Solopreneur'),
              prefixIcon: Icon(Icons.person_outline),
            ),
          ),

          const SizedBox(height: 28),

          // Demographics
          _sectionLabel(context.tr('Demographics')),
          const SizedBox(height: 12),
          TextField(
            controller: _roleController,
              decoration: InputDecoration(
                labelText: context.tr('Role'),
                hintText: context.tr('e.g. Indie developer, CTO, Content creator'),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _industryController,
                  decoration: InputDecoration(
                    labelText: context.tr('Industry'),
                    hintText: context.tr('SaaS, E-commerce...'),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextField(
                  controller: _ageRangeController,
                  decoration: InputDecoration(
                    labelText: context.tr('Age range'),
                    hintText: context.tr('25-40'),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _experienceController,
            decoration: InputDecoration(
              labelText: context.tr('Experience level'),
              hintText: context.tr('3-8 years'),
            ),
          ),

          const SizedBox(height: 28),

          // Pain Points
          _sectionLabel(context.tr('Pain Points (min. 2)')),
          const SizedBox(height: 4),
          Text(
            context.tr('Deep, real problems — not surface-level symptoms'),
            style:
                TextStyle(color: Colors.white.withAlpha(60), fontSize: 13),
          ),
          const SizedBox(height: 12),
          ..._buildListFields(
            controllers: _painPointControllers,
            hintPrefix: context.tr('Pain point'),
            color: AppTheme.rejectColor,
            onAdd: () => setState(
                () => _painPointControllers.add(TextEditingController())),
          ),

          const SizedBox(height: 28),

          // Goals
          _sectionLabel(context.tr('Goals (min. 2)')),
          const SizedBox(height: 4),
          Text(
            context.tr('Aspirations and desired outcomes'),
            style:
                TextStyle(color: Colors.white.withAlpha(60), fontSize: 13),
          ),
          const SizedBox(height: 12),
          ..._buildListFields(
            controllers: _goalControllers,
            hintPrefix: context.tr('Goal'),
            color: AppTheme.approveColor,
            onAdd: () => setState(
                () => _goalControllers.add(TextEditingController())),
          ),

          const SizedBox(height: 28),

          // Language — Vocabulary
          _sectionLabel(context.tr('Vocabulary')),
          const SizedBox(height: 4),
          Text(
            context.tr('Words and expressions this persona actually uses'),
            style:
                TextStyle(color: Colors.white.withAlpha(60), fontSize: 13),
          ),
          const SizedBox(height: 12),
          ..._buildListFields(
            controllers: _vocabularyControllers,
            hintPrefix: context.tr('Word or phrase'),
            color: const Color(0xFF0984E3),
            onAdd: () => setState(
                () => _vocabularyControllers.add(TextEditingController())),
          ),

          const SizedBox(height: 28),

          // Language — Objections
          _sectionLabel(context.tr('Objections')),
          const SizedBox(height: 4),
          Text(
            context.tr('Common pushbacks or doubts this persona has'),
            style:
                TextStyle(color: Colors.white.withAlpha(60), fontSize: 13),
          ),
          const SizedBox(height: 12),
          ..._buildListFields(
            controllers: _objectionControllers,
            hintPrefix: context.tr('Objection'),
            color: const Color(0xFFFDAA5E),
            onAdd: () => setState(
                () => _objectionControllers.add(TextEditingController())),
          ),

          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _sectionLabel(String label) {
    return Text(
      label,
      style: TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: Colors.white.withAlpha(100),
        letterSpacing: 1.2,
      ),
    );
  }

  List<Widget> _buildListFields({
    required List<TextEditingController> controllers,
    required String hintPrefix,
    required Color color,
    required VoidCallback onAdd,
  }) {
    return [
      ...List.generate(controllers.length, (i) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Row(
            children: [
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: color.withAlpha(30),
                ),
                child: Center(
                  child: Text(
                    '${i + 1}',
                    style: TextStyle(
                        color: color,
                        fontSize: 12,
                        fontWeight: FontWeight.w600),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: TextField(
                  controller: controllers[i],
                  decoration: InputDecoration(
                    hintText: '$hintPrefix ${i + 1}',
                  ),
                ),
              ),
              if (controllers.length > 2)
                IconButton(
                  icon: Icon(Icons.close,
                      size: 18, color: Colors.white.withAlpha(60)),
                  onPressed: () {
                    setState(() {
                      controllers[i].dispose();
                      controllers.removeAt(i);
                    });
                  },
                ),
            ],
          ),
        );
      }),
      TextButton.icon(
        onPressed: onAdd,
        icon: Icon(Icons.add, size: 18, color: color),
        label: Text(context.tr('Add'), style: TextStyle(color: color)),
      ),
    ];
  }

  Future<void> _save() async {
    if (_nameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.tr('Please enter a persona name'))),
      );
      return;
    }

    setState(() => _isSaving = true);

    final vocabulary = _vocabularyControllers
        .map((c) => c.text.trim())
        .where((s) => s.isNotEmpty)
        .toList();
    final objections = _objectionControllers
        .map((c) => c.text.trim())
        .where((s) => s.isNotEmpty)
        .toList();

    final persona = Persona(
      id: widget.personaId,
      name: _nameController.text.trim(),
      demographics: PersonaDemographics(
        role: _roleController.text.trimOrNull,
        industry: _industryController.text.trimOrNull,
        ageRange: _ageRangeController.text.trimOrNull,
        experienceLevel: _experienceController.text.trimOrNull,
      ),
      painPoints: _painPointControllers
          .map((c) => c.text.trim())
          .where((s) => s.isNotEmpty)
          .toList(),
      goals: _goalControllers
          .map((c) => c.text.trim())
          .where((s) => s.isNotEmpty)
          .toList(),
      language: (vocabulary.isNotEmpty || objections.isNotEmpty)
          ? PersonaLanguage(
              vocabulary: vocabulary,
              objections: objections,
            )
          : null,
    );

    try {
      final api = ref.read(apiServiceProvider);
      await api.savePersona(persona);

      ref.invalidate(personasProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content:
                Text(context.tr('Persona "{name}" saved', {'name': persona.name})),
            backgroundColor: AppTheme.approveColor.withAlpha(200),
            behavior: SnackBarBehavior.floating,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
        context.pop();
      }
    } catch (error, stackTrace) {
      if (mounted) {
        showDiagnosticSnackBar(
          context,
          ref,
          message: context.tr('Failed to save persona: {error}', {'error': '$error'}),
          scope: 'persona.save',
          error: error,
          stackTrace: stackTrace,
          contextData: {
            'personaName': persona.name,
            'personaId': widget.personaId ?? 'new',
          },
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }
}

extension on String {
  String? get trimOrNull {
    final t = trim();
    return t.isEmpty ? null : t;
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../l10n/app_localizations.dart';
import '../../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_error_view.dart';

class PersonasListScreen extends ConsumerWidget {
  const PersonasListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final personasAsync = ref.watch(personasProvider);

    return Scaffold(
      appBar: AppBar(title: Text(context.tr('Personas'))),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/personas/new'),
        child: const Icon(Icons.add),
      ),
      body: personasAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => Center(
          child: AppErrorView(
            scope: 'personas.load',
            title: context.tr('Failed to load personas'),
            error: error,
            stackTrace: stackTrace,
            onRetry: () => ref.invalidate(personasProvider),
          ),
        ),
        data: (personas) {
          if (personas.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.people_outline,
                      size: 64, color: Colors.white.withAlpha(40)),
                  const SizedBox(height: 16),
                  Text(
                    context.tr('No personas yet'),
                    style: TextStyle(fontSize: 18, color: Colors.white70),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    context.tr(
                      'Create a customer persona to help\nthe AI generate targeted content',
                    ),
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        fontSize: 14, color: Colors.white.withAlpha(100)),
                  ),
                  const SizedBox(height: 24),
                  FilledButton.icon(
                    onPressed: () => context.push('/personas/new'),
                    icon: const Icon(Icons.add),
                    label: Text(context.tr('Create Persona')),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: personas.length,
            itemBuilder: (context, index) {
              final p = personas[index];
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFF1A1A2E),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white.withAlpha(15)),
                ),
                child: ListTile(
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  leading: CircleAvatar(
                    backgroundColor:
                        const Color(0xFF6C5CE7).withAlpha(30),
                    child: Text(
                      p.avatar ?? p.name.substring(0, 1).toUpperCase(),
                      style: const TextStyle(fontSize: 20),
                    ),
                  ),
                  title: Text(p.name,
                      style: const TextStyle(
                          color: Colors.white, fontWeight: FontWeight.w600)),
                  subtitle: Text(
                    p.demographics?.role ?? context.tr('No role defined'),
                    style: TextStyle(color: Colors.white.withAlpha(100)),
                  ),
                  trailing: _confidenceBadge(p.confidence),
                  onTap: () => context.push('/personas/${p.id}'),
                ),
              );
            },
          );
        },
      ),
    );
  }

  Widget _confidenceBadge(int confidence) {
    final color = confidence >= 70
        ? AppTheme.approveColor
        : confidence >= 40
            ? const Color(0xFFFDAA5E)
            : AppTheme.rejectColor;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        '$confidence%',
        style:
            TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.w600),
      ),
    );
  }
}

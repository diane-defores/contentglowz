import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/in_app_tour/in_app_tour_controller.dart';
import '../../l10n/app_localizations.dart';
import '../theme/app_theme.dart';

class InAppTourOverlay extends ConsumerWidget {
  const InAppTourOverlay({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tour = ref.watch(inAppTourProvider);
    if (!tour.active) return const SizedBox.shrink();

    final step = tour.currentStep;
    final controller = ref.read(inAppTourProvider.notifier);

    return Align(
      alignment: Alignment.bottomCenter,
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
          child: Material(
            color: Colors.transparent,
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
              decoration: BoxDecoration(
                color: const Color(0xFF1A1A2E),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.approveColor.withAlpha(80)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withAlpha(120),
                    blurRadius: 24,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _buildHeader(context, tour, controller),
                  const SizedBox(height: 10),
                  _buildProgressBar(tour),
                  const SizedBox(height: 14),
                  Text(
                    step.title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    step.description,
                    style: TextStyle(
                      color: Colors.white.withAlpha(180),
                      fontSize: 13.5,
                      height: 1.45,
                    ),
                  ),
                  if (step.hint != null) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.approveColor.withAlpha(20),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: AppTheme.approveColor.withAlpha(60),
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.lightbulb_outline,
                            size: 16,
                            color: AppTheme.approveColor,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              step.hint!,
                              style: TextStyle(
                                color: AppTheme.approveColor,
                                fontSize: 12.5,
                                fontWeight: FontWeight.w500,
                                height: 1.35,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  _buildActions(context, tour, controller),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(
    BuildContext context,
    InAppTourState tour,
    InAppTourController controller,
  ) {
    return Row(
      children: [
        Icon(Icons.tour_rounded, size: 18, color: AppTheme.approveColor),
        const SizedBox(width: 8),
        Text(
          context.tr(
            'Guided tour · {current}/{total}',
            {
              'current': tour.stepIndex + 1,
              'total': tour.totalSteps,
            },
          ),
          style: TextStyle(
            color: Colors.white.withAlpha(160),
            fontSize: 12,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.4,
          ),
        ),
        const Spacer(),
        IconButton(
          tooltip: context.tr('Pause tour'),
          onPressed: controller.pause,
          icon: Icon(
            Icons.close_rounded,
            size: 18,
            color: Colors.white.withAlpha(140),
          ),
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
        ),
      ],
    );
  }

  Widget _buildProgressBar(InAppTourState tour) {
    return Row(
      children: List.generate(tour.totalSteps, (i) {
        final isActive = i <= tour.stepIndex;
        return Expanded(
          child: Container(
            height: 3,
            margin: const EdgeInsets.symmetric(horizontal: 1.5),
            decoration: BoxDecoration(
              color: isActive
                  ? AppTheme.approveColor
                  : Colors.white.withAlpha(20),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        );
      }),
    );
  }

  Widget _buildActions(
    BuildContext context,
    InAppTourState tour,
    InAppTourController controller,
  ) {
    return Row(
      children: [
        if (!tour.isFirst)
          TextButton.icon(
            onPressed: () => controller.previous(context),
            icon: const Icon(Icons.arrow_back_rounded, size: 16),
            label: Text(context.tr('Previous')),
            style: TextButton.styleFrom(
              foregroundColor: Colors.white.withAlpha(200),
              padding: const EdgeInsets.symmetric(horizontal: 10),
            ),
          ),
        TextButton(
          onPressed: controller.skip,
          style: TextButton.styleFrom(
            foregroundColor: Colors.white.withAlpha(140),
            padding: const EdgeInsets.symmetric(horizontal: 10),
          ),
          child: Text(context.tr('Skip tour')),
        ),
        const Spacer(),
        FilledButton.icon(
          onPressed: () => controller.next(context),
          icon: Icon(
            tour.isLast ? Icons.check_rounded : Icons.arrow_forward_rounded,
            size: 16,
          ),
          label: Text(context.tr(tour.isLast ? 'Finish' : 'Next')),
          style: FilledButton.styleFrom(
            backgroundColor: AppTheme.approveColor,
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
          ),
        ),
      ],
    );
  }
}

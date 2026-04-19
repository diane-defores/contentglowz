import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/models/app_access_state.dart';
import '../../../data/models/auth_session.dart';
import '../../../providers/providers.dart';

class UptimeScreen extends ConsumerStatefulWidget {
  const UptimeScreen({super.key});

  @override
  ConsumerState<UptimeScreen> createState() => _UptimeScreenState();
}

class _UptimeScreenState extends ConsumerState<UptimeScreen> {
  final List<_PingResult> _history = [];
  bool _checking = false;

  @override
  void initState() {
    super.initState();
    _checkOnce();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final authSession = ref.watch(authSessionProvider);
    final appAccess = ref.watch(appAccessStateProvider);
    final statusAsync = ref.watch(backendStatusProvider);
    final accessState = appAccess.valueOrNull;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Uptime'),
        actions: [
          IconButton(
            icon: _checking
                ? const SizedBox(
                    height: 18, width: 18,
                    child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.refresh),
            onPressed: _checking ? null : _refreshAccessState,
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Access State', style: theme.textTheme.titleSmall),
                  const SizedBox(height: 8),
                  Text('Stage: ${accessState?.diagnosticsLabel ?? 'loading'}'),
                  const SizedBox(height: 4),
                  Text('Session: ${authSession.status.name}'),
                  if (authSession.email != null) ...[
                    const SizedBox(height: 4),
                    Text('Email: ${authSession.email}'),
                  ],
                  if (accessState?.message case final message?) ...[
                    const SizedBox(height: 8),
                    Text(
                      'Last backend message: $message',
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          // Current status
          statusAsync.when(
            loading: () => const LinearProgressIndicator(),
            error: (error, stackTrace) =>
                _StatusBanner(online: false, theme: theme),
            data: (data) {
              final online = data['status'] == 'ok' || data['status'] == 'healthy';
              return _StatusBanner(online: online, theme: theme);
            },
          ),
          const SizedBox(height: 20),

          // API details
          statusAsync.when(
            loading: () => const SizedBox.shrink(),
            error: (error, stackTrace) => const SizedBox.shrink(),
            data: (data) {
              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('API Details', style: theme.textTheme.titleSmall),
                      const SizedBox(height: 8),
                      ...data.entries
                          .where((e) => e.key != 'status')
                          .map((e) => Padding(
                                padding: const EdgeInsets.only(bottom: 4),
                                child: Row(
                                  children: [
                                    Text('${e.key}: ',
                                        style: TextStyle(
                                            fontSize: 12,
                                            color: theme.colorScheme.onSurfaceVariant)),
                                    Expanded(
                                      child: Text('${e.value}',
                                          style: const TextStyle(fontSize: 12)),
                                    ),
                                  ],
                                ),
                              )),
                    ],
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 20),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              FilledButton.icon(
                onPressed: _checking ? null : _refreshAccessState,
                icon: const Icon(Icons.sync_rounded),
                label: const Text('Retry backend'),
              ),
              OutlinedButton.icon(
                onPressed: () => _copyDiagnostics(authSession, accessState),
                icon: const Icon(Icons.copy_rounded),
                label: const Text('Copy diagnostics'),
              ),
              OutlinedButton.icon(
                onPressed: () => ref.read(authSessionProvider.notifier).signOut(),
                icon: const Icon(Icons.logout_rounded),
                label: const Text('Sign out'),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Ping history
          if (_history.isNotEmpty) ...[
            Text('Ping History', style: theme.textTheme.titleMedium),
            const SizedBox(height: 12),
            ..._history.reversed.map((ping) => Card(
                  margin: const EdgeInsets.only(bottom: 6),
                  child: ListTile(
                    dense: true,
                    leading: Icon(
                      ping.online ? Icons.check_circle : Icons.error,
                      color: ping.online ? Colors.green : Colors.red,
                      size: 20,
                    ),
                    title: Text(
                      ping.online ? 'Online' : 'Offline',
                      style: const TextStyle(fontSize: 13),
                    ),
                    subtitle: Text(
                      '${ping.latencyMs}ms · ${ping.timestamp.hour}:${ping.timestamp.minute.toString().padLeft(2, '0')}:${ping.timestamp.second.toString().padLeft(2, '0')}',
                      style: theme.textTheme.bodySmall,
                    ),
                  ),
                )),
          ],

          const SizedBox(height: 20),
          OutlinedButton.icon(
            onPressed: _checking ? null : _refreshAccessState,
            icon: const Icon(Icons.speed),
            label: const Text('Ping again'),
          ),
        ],
      ),
    );
  }

  Future<void> _checkOnce() async {
    setState(() => _checking = true);
    final api = ref.read(apiServiceProvider);
    final sw = Stopwatch()..start();
    try {
      final data = await api.healthCheck();
      sw.stop();
      final online = data['status'] == 'ok' || data['status'] == 'healthy';
      setState(() {
        _history.add(_PingResult(
          online: online,
          latencyMs: sw.elapsedMilliseconds,
          timestamp: DateTime.now(),
        ));
      });
    } catch (_) {
      sw.stop();
      setState(() {
        _history.add(_PingResult(
          online: false,
          latencyMs: sw.elapsedMilliseconds,
          timestamp: DateTime.now(),
        ));
      });
    }
    ref.invalidate(backendStatusProvider);
    setState(() => _checking = false);
  }

  Future<void> _refreshAccessState() async {
    await _checkOnce();
    await ref.read(appAccessStateProvider.notifier).refresh();
  }

  Future<void> _copyDiagnostics(
    AuthSession authSession,
    AppAccessState? accessState,
  ) async {
    final lines = [
      'ContentFlow system status diagnostics',
      'Session state: ${authSession.status.name}',
      'Session email: ${authSession.email ?? 'none'}',
      'Access stage: ${accessState?.diagnosticsLabel ?? 'loading'}',
      'Backend reachable: ${accessState?.backendReachable == true ? 'yes' : 'no'}',
      'Backend status: ${accessState?.backendStatusLabel ?? 'unknown'}',
      'Bootstrap status: ${accessState?.bootstrapStatusLabel ?? 'not_started'}',
      'Last API status code: ${accessState?.statusCode?.toString() ?? 'none'}',
      'Last API message: ${accessState?.message ?? 'none'}',
    ];
    await Clipboard.setData(ClipboardData(text: lines.join('\n')));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Diagnostics copied to clipboard.')),
    );
  }
}

class _PingResult {
  final bool online;
  final int latencyMs;
  final DateTime timestamp;

  const _PingResult({
    required this.online,
    required this.latencyMs,
    required this.timestamp,
  });
}

class _StatusBanner extends StatelessWidget {
  const _StatusBanner({required this.online, required this.theme});
  final bool online;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: (online ? Colors.green : Colors.red).withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            online ? Icons.cloud_done : Icons.cloud_off,
            color: online ? Colors.green : Colors.red,
            size: 32,
          ),
          const SizedBox(width: 12),
          Text(
            online ? 'API Online' : 'API Offline',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: online ? Colors.green : Colors.red,
            ),
          ),
        ],
      ),
    );
  }
}

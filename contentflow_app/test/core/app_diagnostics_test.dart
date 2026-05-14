import 'package:contentflow_app/core/app_diagnostics.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('redacts signed playback URL query tokens in diagnostics context', () {
    final diagnostics = AppDiagnostics();

    diagnostics.error(
      scope: 'api.error',
      message: 'Render status failed.',
      context: {
        'responseBody':
            '{"artifact":{"playback_url":"https://assets.example.test/render.mp4?token=secret-token&expires=123"}}',
      },
    );

    final entry = diagnostics.snapshot(limit: 1).single;
    final body = entry.context['responseBody'];

    expect(body, contains('https://assets.example.test/render.mp4?[redacted]'));
    expect(body, isNot(contains('secret-token')));
    expect(body, isNot(contains('expires=123')));
  });
}

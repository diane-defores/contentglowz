import 'package:flutter_test/flutter_test.dart';

import 'package:contentflow_app/core/project_onboarding_validation.dart';

void main() {
  group('normalizeOptionalText', () {
    test('returns null for blank input', () {
      expect(normalizeOptionalText('   '), isNull);
    });

    test('trims non-empty input', () {
      expect(
        normalizeOptionalText('  https://github.com/openai/openai  '),
        'https://github.com/openai/openai',
      );
    });
  });

  group('isValidGithubRepositoryUrl', () {
    test('accepts a standard github repository URL', () {
      expect(
        isValidGithubRepositoryUrl('https://github.com/openai/openai'),
        isTrue,
      );
    });

    test('rejects blank input', () {
      expect(isValidGithubRepositoryUrl(''), isFalse);
    });

    test('rejects non-github hosts', () {
      expect(
        isValidGithubRepositoryUrl('https://gitlab.com/openai/openai'),
        isFalse,
      );
    });

    test('rejects github URLs without owner and repo segments', () {
      expect(isValidGithubRepositoryUrl('https://github.com/openai'), isFalse);
    });
  });

  group('extractApiDetailMessage', () {
    test('formats FastAPI validation detail arrays', () {
      expect(
        extractApiDetailMessage([
          {
            'loc': ['body', 'github_url'],
            'msg': 'Input should be a valid URL',
          },
        ]),
        'github url: Input should be a valid URL',
      );
    });

    test('returns plain string details unchanged', () {
      expect(
        extractApiDetailMessage('Workspace already exists'),
        'Workspace already exists',
      );
    });
  });
}

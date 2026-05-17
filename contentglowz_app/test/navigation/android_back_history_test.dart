import 'package:contentglowz_app/presentation/screens/app_shell.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('shouldConfirmShellExit', () {
    test('returns true on shell root when no back history exists', () {
      expect(
        shouldConfirmShellExit(routeIsFirst: true, routerCanPop: false),
        isTrue,
      );
    });

    test('returns false when router can pop pushed history', () {
      expect(
        shouldConfirmShellExit(routeIsFirst: true, routerCanPop: true),
        isFalse,
      );
    });

    test('returns false when route is not first', () {
      expect(
        shouldConfirmShellExit(routeIsFirst: false, routerCanPop: false),
        isFalse,
      );
    });
  });
}

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/attendance/checkin_page.dart';
import 'package:mobile/auth/auth_controller.dart';
import 'package:mobile/core/api/api_client.dart';
import 'package:mobile/core/api/buildpulse_api.dart';
import 'package:mobile/core/app_scope.dart';
import 'package:mobile/core/i18n.dart';
import 'package:mobile/core/theme_controller.dart';
import 'package:mobile/messaging/messaging_controller.dart';

const _testApiBaseUrl = 'http://localhost:4000/api';

void main() {
  testWidgets(
    'try again on an unsuccessful attendance scan returns to the scanner',
    (tester) async {
      await tester.pumpWidget(
        _routerHost(
          initialLocation: '/checkin',
          routes: [
            GoRoute(
              path: '/checkin',
              builder: (context, state) => const CheckinPage(qrToken: ''),
            ),
            GoRoute(
              path: '/scan',
              builder: (context, state) => const Scaffold(
                body: Center(child: Text('Scanner screen')),
              ),
            ),
          ],
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Invalid QR code.'), findsOneWidget);
      expect(find.widgetWithText(FilledButton, 'Try again'), findsOneWidget);

      await tester.tap(find.widgetWithText(FilledButton, 'Try again'));
      await tester.pumpAndSettle();

      expect(find.text('Scanner screen'), findsOneWidget);
    },
  );
}

Widget _routerHost({
  required String initialLocation,
  required List<RouteBase> routes,
}) {
  final apiClient = ApiClient.inMemory(baseUrl: _testApiBaseUrl);
  final api = BuildPulseApi(apiClient);
  final auth = AuthController(api);
  final messaging = MessagingController(api, auth);
  final theme = ThemeController();
  final language = LanguageController(systemLocale: const Locale('en'));
  final router = GoRouter(initialLocation: initialLocation, routes: routes);

  return AppScope(
    api: api,
    auth: auth,
    messaging: messaging,
    theme: theme,
    language: language,
    child: MaterialApp.router(
      supportedLocales: supportedAppLocales,
      localizationsDelegates: appLocalizationsDelegates,
      routerConfig: router,
    ),
  );
}

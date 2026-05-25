import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'auth/auth_controller.dart';
import 'core/api/api_client.dart';
import 'core/api/buildpulse_api.dart';
import 'core/app_config.dart';
import 'core/app_router.dart';
import 'core/app_scope.dart';
import 'core/i18n.dart';
import 'core/theme_controller.dart';
import 'messaging/messaging_controller.dart';
import 'messaging/push_notifications_controller.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting();
  await AppConfig.load();

  final apiClient = await ApiClient.create();
  final api = BuildPulseApi(apiClient);
  final auth = AuthController(api);
  await auth.bootstrap();
  final messaging = MessagingController(api, auth);
  final pushNotifications = PushNotificationsController(
    api: api,
    auth: auth,
    messaging: messaging,
  );
  await pushNotifications.initialize();
  final theme = ThemeController();
  final language = LanguageController();

  runApp(
    AppScope(
      api: api,
      auth: auth,
      messaging: messaging,
      theme: theme,
      language: language,
      child: BuildPulseApp(auth: auth, pushNotifications: pushNotifications),
    ),
  );
}

class BuildPulseApp extends StatefulWidget {
  const BuildPulseApp({
    required this.auth,
    required this.pushNotifications,
    super.key,
  });

  final AuthController auth;
  final PushNotificationsController pushNotifications;

  @override
  State<BuildPulseApp> createState() => _BuildPulseAppState();
}

class _BuildPulseAppState extends State<BuildPulseApp> {
  late final _router = createAppRouter(widget.auth);

  @override
  void initState() {
    super.initState();
    widget.pushNotifications.onOpenChat = _openChat;
  }

  @override
  void dispose() {
    widget.pushNotifications.onOpenChat = null;
    super.dispose();
  }

  void _openChat(String chatId) {
    _router.go('/messages?chatId=${Uri.encodeComponent(chatId)}');
  }

  @override
  Widget build(BuildContext context) {
    final theme = AppScope.themeOf(context);
    final language = AppScope.languageOf(context);

    return AnimatedBuilder(
      animation: Listenable.merge([theme, language]),
      builder: (context, _) {
        return MaterialApp.router(
          title: 'BuildPulse',
          debugShowCheckedModeBanner: false,
          themeMode: theme.mode,
          theme: buildPulseTheme(Brightness.light),
          darkTheme: buildPulseTheme(Brightness.dark),
          locale: language.locale,
          supportedLocales: supportedAppLocales,
          localizationsDelegates: appLocalizationsDelegates,
          routerConfig: _router,
        );
      },
    );
  }
}

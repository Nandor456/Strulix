import 'package:flutter/widgets.dart';

import '../auth/auth_controller.dart';
import '../attendance/attendance_location_monitor_controller.dart';
import '../messaging/messaging_controller.dart';
import 'api/buildpulse_api.dart';
import 'i18n.dart';
import 'theme_controller.dart';

class AppScope extends InheritedWidget {
  const AppScope({
    required this.api,
    required this.auth,
    required this.messaging,
    required this.attendanceMonitor,
    required this.theme,
    required this.language,
    required super.child,
    super.key,
  });

  final BuildPulseApi api;
  final AuthController auth;
  final MessagingController messaging;
  final AttendanceLocationMonitorController attendanceMonitor;
  final ThemeController theme;
  final LanguageController language;

  static AppScope of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<AppScope>();
    assert(scope != null, 'AppScope was not found in the widget tree.');
    return scope!;
  }

  static BuildPulseApi apiOf(BuildContext context) => of(context).api;

  static AuthController authOf(BuildContext context) => of(context).auth;

  static MessagingController messagingOf(BuildContext context) =>
      of(context).messaging;

  static AttendanceLocationMonitorController attendanceMonitorOf(
    BuildContext context,
  ) => of(context).attendanceMonitor;

  static ThemeController themeOf(BuildContext context) => of(context).theme;

  static LanguageController languageOf(BuildContext context) =>
      of(context).language;

  @override
  bool updateShouldNotify(AppScope oldWidget) {
    return api != oldWidget.api ||
        auth != oldWidget.auth ||
        messaging != oldWidget.messaging ||
        attendanceMonitor != oldWidget.attendanceMonitor ||
        theme != oldWidget.theme ||
        language != oldWidget.language;
  }
}

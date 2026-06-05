import 'package:flutter/material.dart';

class ThemeController extends ChangeNotifier {
  ThemeMode _mode = ThemeMode.system;

  ThemeMode get mode => _mode;

  bool get isDark => _mode == ThemeMode.dark;

  void setMode(ThemeMode mode) {
    if (_mode == mode) return;
    _mode = mode;
    notifyListeners();
  }

  void toggle() {
    setMode(_mode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark);
  }
}

ThemeData buildPulseTheme(Brightness brightness) {
  final isDark = brightness == Brightness.dark;
  final scheme = isDark ? _darkScheme : _lightScheme;

  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    colorScheme: scheme,
    scaffoldBackgroundColor: scheme.surface,
    appBarTheme: AppBarTheme(
      centerTitle: false,
      elevation: 0,
      backgroundColor: scheme.surface,
      foregroundColor: scheme.onSurface,
    ),
    cardTheme: CardThemeData(
      color: scheme.surfaceContainerLow,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: scheme.outlineVariant),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      filled: true,
      fillColor: scheme.surfaceContainerHighest,
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: scheme.surfaceContainerLow,
      indicatorColor: scheme.primaryContainer,
      labelTextStyle: WidgetStateProperty.all(const TextStyle(fontSize: 12)),
    ),
  );
}

const _lightScheme = ColorScheme(
  brightness: Brightness.light,
  primary: Color(0xffbb6648),
  onPrimary: Color(0xfffdfbf4),
  primaryContainer: Color(0xfff4d1c3),
  onPrimaryContainer: Color(0xff4d2a1d),
  secondary: Color(0xffd7ebdc),
  onSecondary: Color(0xff28473a),
  secondaryContainer: Color(0xffe7f4e9),
  onSecondaryContainer: Color(0xff28473a),
  tertiary: Color(0xffdbc78b),
  onTertiary: Color(0xff41381f),
  tertiaryContainer: Color(0xffefe3b8),
  onTertiaryContainer: Color(0xff41381f),
  error: Color(0xffa34d35),
  onError: Color(0xfffdfbf4),
  errorContainer: Color(0xfff2d2c9),
  onErrorContainer: Color(0xff56271b),
  surface: Color(0xfffbfbef),
  onSurface: Color(0xff1f2933),
  surfaceContainerLowest: Color(0xffffffff),
  surfaceContainerLow: Color(0xfff8f8ea),
  surfaceContainer: Color(0xfff5f5e4),
  surfaceContainerHigh: Color(0xfff1f1df),
  surfaceContainerHighest: Color(0xffececd8),
  onSurfaceVariant: Color(0xff6c756d),
  outline: Color(0xffd8dbca),
  outlineVariant: Color(0xffe1e4d5),
  shadow: Color(0x1a1f2933),
  scrim: Color(0x661f2933),
  inverseSurface: Color(0xff283129),
  onInverseSurface: Color(0xfff7f7ed),
  inversePrimary: Color(0xffd28569),
  surfaceTint: Color(0xffbb6648),
);

const _darkScheme = ColorScheme(
  brightness: Brightness.dark,
  primary: Color(0xffcb6e54),
  onPrimary: Color(0xff18211c),
  primaryContainer: Color(0xff5a2d22),
  onPrimaryContainer: Color(0xfff0d1c7),
  secondary: Color(0xff385b4c),
  onSecondary: Color(0xffedf4ee),
  secondaryContainer: Color(0xff263f35),
  onSecondaryContainer: Color(0xffd7e7da),
  tertiary: Color(0xffb9a66f),
  onTertiary: Color(0xff1d1d14),
  tertiaryContainer: Color(0xff4a4329),
  onTertiaryContainer: Color(0xffe7ddb3),
  error: Color(0xffbb5e45),
  onError: Color(0xff170f0d),
  errorContainer: Color(0xff5b2d21),
  onErrorContainer: Color(0xffefcdc3),
  surface: Color(0xff1f2522),
  onSurface: Color(0xffedf0e9),
  surfaceContainerLowest: Color(0xff161b18),
  surfaceContainerLow: Color(0xff232a26),
  surfaceContainer: Color(0xff272f2b),
  surfaceContainerHigh: Color(0xff2c3530),
  surfaceContainerHighest: Color(0xff313a35),
  onSurfaceVariant: Color(0xffb6beb6),
  outline: Color(0x1affffff),
  outlineVariant: Color(0x24ffffff),
  shadow: Color(0x66000000),
  scrim: Color(0x99000000),
  inverseSurface: Color(0xffeff2eb),
  onInverseSurface: Color(0xff1a211d),
  inversePrimary: Color(0xffbb6648),
  surfaceTint: Color(0xffcb6e54),
);

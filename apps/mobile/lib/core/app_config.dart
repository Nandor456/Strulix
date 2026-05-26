import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  static const _defaultApiBaseUrl = 'http://localhost:4000/api';
  static bool _loaded = false;

  static Future<void> load() async {
    if (_loaded) return;
    _loaded = true;
    final envFile = _envFileName();
    try {
      await dotenv.load(fileName: envFile);
    } catch (_) {
      // Allow missing env files for local defaults or unsupported targets.
    }
  }

  static String get apiBaseUrl {
    final value = dotenv.env['BUILD_PULSE_API_BASE_URL'];
    if (value == null || value.trim().isEmpty) return _defaultApiBaseUrl;
    return value;
  }

  static Uri get apiBaseUri => Uri.parse(apiBaseUrl);

  static String get apiOrigin {
    final uri = apiBaseUri;
    return '${uri.scheme}://${uri.authority}';
  }

  static String resolveApiUrl(String path) {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    final normalized = path.startsWith('/') ? path : '/$path';
    if (normalized.startsWith('/uploads/')) {
      return '$apiOrigin$normalized';
    }

    return '${apiBaseUrl.replaceFirst(RegExp(r'/$'), '')}$normalized';
  }

  static String _envFileName() {
    final mode = kReleaseMode ? 'prod' : 'dev';
    final platform = _platformKey();
    return '.env.$mode.$platform';
  }

  static String _platformKey() {
    if (kIsWeb) return 'web';
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'android';
      case TargetPlatform.iOS:
        return 'ios';
      default:
        return 'ios';
    }
  }
}

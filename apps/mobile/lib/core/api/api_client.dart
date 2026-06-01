import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:path_provider/path_provider.dart';

import '../app_config.dart';

class ApiClient {
  ApiClient({required this.dio, required this.cookieJar}) {
    dio.interceptors.add(CookieManager(cookieJar));
    dio.interceptors.add(
      InterceptorsWrapper(
        onError: (error, handler) async {
          final request = error.requestOptions;
          final isUnauthorized = error.response?.statusCode == 401;
          final alreadyRetried = request.extra['authRetry'] == true;

          if (isUnauthorized &&
              !alreadyRetried &&
              !_skipsAuthRefresh(request)) {
            request.extra['authRetry'] = true;
            try {
              await refreshSession();
              final response = await dio.fetch<dynamic>(request);
              handler.resolve(response);
              return;
            } catch (_) {
              await clearCookies();
              onUnauthorized?.call();
            }
          }

          handler.next(error);
        },
      ),
    );
  }

  final Dio dio;
  final CookieJar cookieJar;
  Future<void>? _refreshFuture;
  void Function()? onUnauthorized;

  static const accessTokenCookie = 'bp_access_token';
  static const refreshTokenCookie = 'bp_refresh_token';

  static Future<ApiClient> create() async {
    final supportDir = await getApplicationSupportDirectory();
    final cookieJar = PersistCookieJar(
      storage: FileStorage('${supportDir.path}/buildpulse_cookies'),
    );
    return ApiClient(dio: _buildDio(), cookieJar: cookieJar);
  }

  factory ApiClient.inMemory({String? baseUrl}) {
    return ApiClient(
      dio: _buildDio(baseUrl: baseUrl ?? AppConfig.apiBaseUrl),
      cookieJar: CookieJar(),
    );
  }

  static Dio _buildDio({String? baseUrl}) {
    final resolvedBaseUrl = (baseUrl ?? AppConfig.apiBaseUrl).replaceFirst(
      RegExp(r'/$'),
      '',
    );
    return Dio(
      BaseOptions(
        baseUrl: resolvedBaseUrl,
        connectTimeout: const Duration(seconds: 12),
        receiveTimeout: const Duration(seconds: 30),
        sendTimeout: const Duration(seconds: 30),
        contentType: Headers.jsonContentType,
      ),
    );
  }

  bool _skipsAuthRefresh(RequestOptions options) {
    if (options.extra['skipAuthRefresh'] == true) return true;
    final path = Uri.tryParse(options.path)?.path ?? options.path;
    return const {
      '/auth/forgot-password',
      '/auth/login',
      '/auth/register',
      '/auth/reset-password',
      '/auth/refresh',
      '/auth/logout',
    }.any(path.endsWith);
  }

  Future<void> refreshSession() {
    _refreshFuture ??= dio
        .post<dynamic>(
          '/auth/refresh',
          options: Options(extra: {'skipAuthRefresh': true}),
        )
        .then((_) {})
        .whenComplete(() => _refreshFuture = null);
    return _refreshFuture!;
  }

  Future<void> clearCookies() => cookieJar.deleteAll();

  Future<String?> cookieValue(String name) async {
    final cookies = await cookieJar.loadForRequest(AppConfig.apiBaseUri);
    for (final cookie in cookies) {
      if (cookie.name == name) return cookie.value;
    }
    return null;
  }

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) {
    return dio.get<T>(path, queryParameters: queryParameters, options: options);
  }

  Future<Response<T>> post<T>(
    String path, {
    Object? data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) {
    return dio.post<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response<T>> put<T>(String path, {Object? data, Options? options}) {
    return dio.put<T>(path, data: data, options: options);
  }

  Future<Response<T>> patch<T>(String path, {Object? data, Options? options}) {
    return dio.patch<T>(path, data: data, options: options);
  }

  Future<Response<T>> delete<T>(String path, {Object? data, Options? options}) {
    return dio.delete<T>(path, data: data, options: options);
  }

  Future<Uint8List> getBytes(String path) async {
    final response = await dio.get<List<int>>(
      AppConfig.resolveApiUrl(path),
      options: Options(responseType: ResponseType.bytes),
    );
    return Uint8List.fromList(response.data ?? const []);
  }

  Future<File> download(
    String path, {
    Map<String, dynamic>? queryParameters,
    required String filename,
  }) async {
    final directory = await getTemporaryDirectory();
    final safeName = filename.replaceAll(RegExp(r'[^\w.\-]+'), '-');
    final file = File('${directory.path}/$safeName');
    await dio.download(
      AppConfig.resolveApiUrl(path),
      file.path,
      queryParameters: queryParameters,
    );
    return file;
  }
}

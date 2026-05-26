import 'dart:io';

import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/api/api_client.dart';
import 'package:mobile/core/api/buildpulse_api.dart';
import 'package:mobile/core/app_config.dart';

const _testApiBaseUrl = 'http://localhost:4000/api';

void main() {
  setUpAll(() {
    dotenv.testLoad(fileInput: '');
  });

  test('upload URLs resolve against the API origin without query fragments', () {
    expect(
      AppConfig.resolveApiUrl('/uploads/messaging/attachment-1.pdf'),
      'http://localhost:4000/uploads/messaging/attachment-1.pdf',
    );
  });

  test('message attachment download keeps valid relative upload paths', () async {
    final client = _RecordingApiClient();
    final api = BuildPulseApi(client);

    await api.downloadMessageAttachment(
      attachmentUrl: '/uploads/messaging/attachment-1.pdf',
      filename: 'attachment.pdf',
    );

    expect(client.lastPath, '/uploads/messaging/attachment-1.pdf');
    expect(client.lastFilename, 'attachment.pdf');
  });

  test('message attachment download normalizes valid absolute upload URLs', () async {
    final client = _RecordingApiClient();
    final api = BuildPulseApi(client);

    await api.downloadMessageAttachment(
      attachmentUrl: 'https://api.example.com/uploads/messaging/attachment-1.pdf',
      filename: 'attachment.pdf',
    );

    expect(client.lastPath, '/uploads/messaging/attachment-1.pdf');
  });

  test('message attachment download rejects root and query-only URLs', () {
    final api = BuildPulseApi(_RecordingApiClient());

    expect(
      () => api.downloadMessageAttachment(
        attachmentUrl: '/?',
        filename: 'attachment.pdf',
      ),
      throwsArgumentError,
    );
    expect(
      () => api.downloadMessageAttachment(
        attachmentUrl: '?',
        filename: 'attachment.pdf',
      ),
      throwsArgumentError,
    );
  });
}

class _RecordingApiClient extends ApiClient {
  _RecordingApiClient()
    : super(
        dio: Dio(BaseOptions(baseUrl: _testApiBaseUrl)),
        cookieJar: CookieJar(),
      );

  String? lastPath;
  String? lastFilename;

  @override
  Future<File> download(
    String path, {
    Map<String, dynamic>? queryParameters,
    required String filename,
  }) async {
    lastPath = path;
    lastFilename = filename;
    return File('/tmp/$filename');
  }
}

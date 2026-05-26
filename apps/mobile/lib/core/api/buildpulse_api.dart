import 'dart:io';
import 'dart:typed_data';

import 'package:dio/dio.dart';

import '../app_config.dart';
import '../models.dart';
import 'api_client.dart';

class BuildPulseApi {
  const BuildPulseApi(this.client);

  final ApiClient client;

  Map<String, dynamic> _responseMap(Response<dynamic> response) {
    final data = response.data;
    if (data is Map<String, dynamic>) return data;
    if (data is Map) {
      return data.map((key, value) => MapEntry(key.toString(), value));
    }
    return <String, dynamic>{};
  }

  List<dynamic> _responseList(Response<dynamic> response) {
    final data = response.data;
    return data is List ? data : const [];
  }

  String fileUrl(String path) => AppConfig.resolveApiUrl(path);

  Future<User?> currentUser() async {
    final response = await client.get<dynamic>('/auth/user');
    final data = _responseMap(response);
    final user = data['user'];
    if (user == null) return null;
    return User.fromJson(user as Map<String, dynamic>);
  }

  Future<void> login({
    required String username,
    required String password,
  }) async {
    await client.post<dynamic>(
      '/auth/login',
      data: {'username': username, 'password': password},
    );
  }

  Future<void> register({
    required String username,
    required String email,
    required String password,
    String? token,
  }) async {
    await client.post<dynamic>(
      '/auth/register',
      data: {
        'username': username,
        'email': email,
        'password': password,
        if (token != null && token.isNotEmpty) 'token': token,
      },
    );
  }

  Future<void> logout() async {
    try {
      await client.post<dynamic>('/auth/logout');
    } finally {
      await client.clearCookies();
    }
  }

  Future<List<WorkPointSummary>> listWorkPoints() async {
    final response = await client.get<dynamic>('/workpoints');
    final data = _responseMap(response);
    return (data['workPoints'] as List? ?? const [])
        .map(
          (item) =>
              WorkPointSummary.fromJson(Map<String, dynamic>.from(item as Map)),
        )
        .toList();
  }

  Future<List<AssignedWorkPointSummary>> listMyWorkPoints() async {
    final response = await client.get<dynamic>('/workpoints/me');
    final data = _responseMap(response);
    return (data['workPoints'] as List? ?? const [])
        .map(
          (item) => AssignedWorkPointSummary.fromJson(
            Map<String, dynamic>.from(item as Map),
          ),
        )
        .toList();
  }

  Future<WorkPointDetail> getWorkPoint(String id) async {
    final response = await client.get<dynamic>('/workpoints/$id');
    return WorkPointDetail.fromJson(
      Map<String, dynamic>.from(_responseMap(response)['workPoint'] as Map),
    );
  }

  Future<WorkPointDetail> createWorkPoint(Map<String, dynamic> data) async {
    final response = await client.post<dynamic>('/workpoints', data: data);
    return WorkPointDetail.fromJson(
      Map<String, dynamic>.from(_responseMap(response)['workPoint'] as Map),
    );
  }

  Future<WorkPointDetail> updateWorkPoint(
    String id,
    Map<String, dynamic> data,
  ) async {
    final response = await client.put<dynamic>('/workpoints/$id', data: data);
    return WorkPointDetail.fromJson(
      Map<String, dynamic>.from(_responseMap(response)['workPoint'] as Map),
    );
  }

  Future<void> deleteWorkPoint(String id) async {
    await client.delete<dynamic>('/workpoints/$id');
  }

  Future<List<WorkerSummary>> listWorkers() async {
    final response = await client.get<dynamic>('/workers');
    final data = _responseMap(response);
    return (data['workers'] as List? ?? const [])
        .map(
          (item) =>
              WorkerSummary.fromJson(Map<String, dynamic>.from(item as Map)),
        )
        .toList();
  }

  Future<List<WorkerSummary>> listWorkPointWorkers(String workPointId) async {
    final response = await client.get<dynamic>(
      '/workpoints/$workPointId/workers',
    );
    final data = _responseMap(response);
    return (data['workers'] as List? ?? const [])
        .map(
          (item) =>
              WorkerSummary.fromJson(Map<String, dynamic>.from(item as Map)),
        )
        .toList();
  }

  Future<List<WorkerSummary>> assignWorker(
    String workPointId,
    String workerId,
  ) async {
    final response = await client.post<dynamic>(
      '/workpoints/$workPointId/workers',
      data: {'workerId': workerId},
    );
    final data = _responseMap(response);
    return (data['workers'] as List? ?? const [])
        .map(
          (item) =>
              WorkerSummary.fromJson(Map<String, dynamic>.from(item as Map)),
        )
        .toList();
  }

  Future<List<WorkerSummary>> removeWorker(
    String workPointId,
    String workerId,
  ) async {
    final response = await client.delete<dynamic>(
      '/workpoints/$workPointId/workers/$workerId',
    );
    final data = _responseMap(response);
    return (data['workers'] as List? ?? const [])
        .map(
          (item) =>
              WorkerSummary.fromJson(Map<String, dynamic>.from(item as Map)),
        )
        .toList();
  }

  Future<WorkerSummary> updateWorker(
    String workerId,
    Map<String, dynamic> data,
  ) async {
    final response = await client.put<dynamic>(
      '/workers/$workerId',
      data: data,
    );
    return WorkerSummary.fromJson(
      Map<String, dynamic>.from(_responseMap(response)['worker'] as Map),
    );
  }

  Future<void> deleteWorker(String workerId) async {
    await client.delete<dynamic>('/workers/$workerId');
  }

  Future<List<Invitation>> listInvitations() async {
    final response = await client.get<dynamic>('/invitations');
    final data = _responseMap(response);
    return (data['invitations'] as List? ?? const [])
        .map(
          (item) => Invitation.fromJson(Map<String, dynamic>.from(item as Map)),
        )
        .toList();
  }

  Future<Invitation> createInvitation({
    required String email,
    required String role,
  }) async {
    final response = await client.post<dynamic>(
      '/invitations',
      data: {'email': email, 'role': role},
    );
    return Invitation.fromJson(
      Map<String, dynamic>.from(_responseMap(response)['invitation'] as Map),
    );
  }

  Future<Invitation> revokeInvitation(String id) async {
    final response = await client.delete<dynamic>('/invitations/$id');
    return Invitation.fromJson(
      Map<String, dynamic>.from(_responseMap(response)['invitation'] as Map),
    );
  }

  Future<ScanResult> checkin(
    String qrToken, {
    required double lat,
    required double lng,
  }) async {
    final response = await client.post<dynamic>(
      '/attendance/checkin',
      data: {'qrToken': qrToken, 'lat': lat, 'lng': lng},
    );
    return ScanResult.fromJson(_responseMap(response));
  }

  Future<List<AttendanceRecord>> listAttendance(
    String workPointId, {
    String? from,
    String? to,
  }) async {
    final queryParameters = <String, dynamic>{};
    if (from != null) queryParameters['from'] = from;
    if (to != null) queryParameters['to'] = to;
    final response = await client.get<dynamic>(
      '/attendance/workpoint/$workPointId',
      queryParameters: queryParameters,
    );
    return _responseList(response)
        .map(
          (item) =>
              AttendanceRecord.fromJson(Map<String, dynamic>.from(item as Map)),
        )
        .toList();
  }

  Future<AttendanceRecord> manualAttendance({
    required String workPointId,
    required String workerId,
    required String date,
    String? checkedInAt,
    String? checkedOutAt,
  }) async {
    final response = await client.post<dynamic>(
      '/attendance/workpoint/$workPointId/manual',
      data: {
        'workerId': workerId,
        'date': date,
        if (checkedInAt != null && checkedInAt.isNotEmpty)
          'checkedInAt': checkedInAt,
        if (checkedOutAt != null && checkedOutAt.isNotEmpty)
          'checkedOutAt': checkedOutAt,
      },
    );
    return AttendanceRecord.fromJson(_responseMap(response));
  }

  Future<AttendanceRecord> updateCheckout(
    String attendanceId,
    String checkedOutAt,
  ) async {
    final response = await client.patch<dynamic>(
      '/attendance/$attendanceId/checkout',
      data: {'checkedOutAt': checkedOutAt},
    );
    return AttendanceRecord.fromJson(_responseMap(response));
  }

  Future<void> deleteAttendance(String id) async {
    await client.delete<dynamic>('/attendance/$id');
  }

  Future<QrData> getQr(String workPointId) async {
    final response = await client.get<dynamic>(
      '/attendance/workpoint/$workPointId/qr',
    );
    return QrData.fromJson(_responseMap(response));
  }

  Future<QrData> rotateQr(String workPointId) async {
    final response = await client.post<dynamic>(
      '/attendance/workpoint/$workPointId/qr/rotate',
    );
    return QrData.fromJson(_responseMap(response));
  }

  Future<File> exportAttendance({
    required String workPointId,
    required String from,
    required String to,
    required String filename,
  }) {
    return client.download(
      '/attendance/workpoint/$workPointId/export',
      queryParameters: {'from': from, 'to': to},
      filename: filename,
    );
  }

  Future<List<DailyStatRow>> myDailyStats(int year, int month) async {
    final response = await client.get<dynamic>(
      '/attendance/me/daily',
      queryParameters: {'year': year, 'month': month},
    );
    return _responseList(response)
        .map(
          (item) =>
              DailyStatRow.fromJson(Map<String, dynamic>.from(item as Map)),
        )
        .toList();
  }

  Future<MonthlySummary> myMonthlySummary(int year, int month) async {
    final response = await client.get<dynamic>(
      '/attendance/me/monthly',
      queryParameters: {'year': year, 'month': month},
    );
    return MonthlySummary.fromJson(_responseMap(response));
  }

  Future<List<WorkerDocumentSummary>> listMyDocuments() async {
    final response = await client.get<dynamic>('/worker-documents/me');
    final data = _responseMap(response);
    return (data['documents'] as List? ?? const [])
        .map(
          (item) => WorkerDocumentSummary.fromJson(
            Map<String, dynamic>.from(item as Map),
          ),
        )
        .toList();
  }

  Future<List<WorkerDocumentSummary>> listWorkerDocuments(
    String workerId,
  ) async {
    final response = await client.get<dynamic>('/workers/$workerId/documents');
    final data = _responseMap(response);
    return (data['documents'] as List? ?? const [])
        .map(
          (item) => WorkerDocumentSummary.fromJson(
            Map<String, dynamic>.from(item as Map),
          ),
        )
        .toList();
  }

  Future<WorkerDocumentSummary> uploadWorkerDocument({
    required String workerId,
    required String path,
    required String filename,
  }) async {
    final response = await client.post<dynamic>(
      '/workers/$workerId/documents',
      data: FormData.fromMap({
        'file': await MultipartFile.fromFile(path, filename: filename),
      }),
      options: Options(contentType: Headers.multipartFormDataContentType),
    );
    return WorkerDocumentSummary.fromJson(
      Map<String, dynamic>.from(_responseMap(response)['document'] as Map),
    );
  }

  Future<void> deleteWorkerDocument(String documentId) async {
    await client.delete<dynamic>('/worker-documents/$documentId');
  }

  Future<File> downloadWorkerDocument(
    WorkerDocumentSummary document, {
    bool download = false,
  }) {
    return client.download(
      '/worker-documents/${Uri.encodeComponent(document.id)}/file',
      queryParameters: download ? {'download': '1'} : null,
      filename: document.originalName,
    );
  }

  Future<Uint8List> workerDocumentBytes(String documentId) {
    return client.getBytes(
      '/worker-documents/${Uri.encodeComponent(documentId)}/file',
    );
  }

  Future<List<ChatListItem>> listChats() async {
    final response = await client.get<dynamic>('/messaging/chats');
    return _responseList(response)
        .map(
          (item) =>
              ChatListItem.fromJson(Map<String, dynamic>.from(item as Map)),
        )
        .toList();
  }

  Future<String> createDirectChat(String userId) async {
    final response = await client.post<dynamic>(
      '/messaging/chats/direct',
      data: {'userId': userId},
    );
    return _responseMap(response)['chatId'].toString();
  }

  Future<MessagesPage> getMessages(
    String chatId, {
    String? cursor,
    int? limit,
  }) async {
    final queryParameters = <String, dynamic>{};
    if (cursor != null) queryParameters['cursor'] = cursor;
    if (limit != null) queryParameters['limit'] = limit;
    final response = await client.get<dynamic>(
      '/messaging/chats/$chatId/messages',
      queryParameters: queryParameters,
    );
    return MessagesPage.fromJson(_responseMap(response));
  }

  Future<Message> sendMessage(
    String chatId, {
    required String body,
    String? replyToId,
    String? attachmentUrl,
    String? attachmentName,
    String? attachmentType,
    String? clientNonce,
  }) async {
    final payload = <String, dynamic>{'body': body};
    if (replyToId != null) payload['replyToId'] = replyToId;
    if (attachmentUrl != null) payload['attachmentUrl'] = attachmentUrl;
    if (attachmentName != null) payload['attachmentName'] = attachmentName;
    if (attachmentType != null) payload['attachmentType'] = attachmentType;
    if (clientNonce != null) payload['clientNonce'] = clientNonce;
    final response = await client.post<dynamic>(
      '/messaging/chats/$chatId/messages',
      data: payload,
    );
    return Message.fromJson(_responseMap(response));
  }

  Future<void> markRead(String chatId) async {
    await client.post<dynamic>('/messaging/chats/$chatId/read');
  }

  Future<UploadedAttachment> uploadAttachment({
    required String chatId,
    required String path,
    required String filename,
  }) async {
    final response = await client.post<dynamic>(
      '/messaging/chats/$chatId/attachment',
      data: FormData.fromMap({
        'file': await MultipartFile.fromFile(path, filename: filename),
      }),
      options: Options(contentType: Headers.multipartFormDataContentType),
    );
    return UploadedAttachment.fromJson(_responseMap(response));
  }

  Future<File> downloadMessageAttachment({
    required String attachmentUrl,
    required String filename,
  }) {
    return client.download(
      _messageAttachmentPath(attachmentUrl),
      filename: filename,
    );
  }

  Future<void> registerPushDevice({
    required String token,
    required String platform,
  }) async {
    await client.post<dynamic>(
      '/push/devices',
      data: {'token': token, 'platform': platform},
    );
  }

  Future<void> unregisterPushDevice(String token) async {
    await client.delete<dynamic>('/push/devices', data: {'token': token});
  }

  Future<List<ChatUser>> listMessagingUsers() async {
    final response = await client.get<dynamic>('/messaging/users');
    return _responseList(response)
        .map(
          (item) => ChatUser.fromJson(Map<String, dynamic>.from(item as Map)),
        )
        .toList();
  }
}

String _messageAttachmentPath(String attachmentUrl) {
  final uri = Uri.tryParse(attachmentUrl.trim());
  final rawPath = uri?.path ?? '';
  final path = rawPath.startsWith('/') ? rawPath : '/$rawPath';
  if (!path.startsWith('/uploads/messaging/')) {
    throw ArgumentError('Invalid message attachment URL.');
  }
  return path;
}

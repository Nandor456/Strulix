import 'attendance_math.dart';

typedef JsonMap = Map<String, dynamic>;

String _string(dynamic value, [String fallback = '']) => value?.toString() ?? fallback;

String? _nullableString(dynamic value) => value?.toString();

int _int(dynamic value, [int fallback = 0]) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value?.toString() ?? '') ?? fallback;
}

double _double(dynamic value, [double fallback = 0]) {
  if (value is double) return value;
  if (value is num) return value.toDouble();
  return double.tryParse(value?.toString() ?? '') ?? fallback;
}

double? _nullableDouble(dynamic value) {
  if (value == null) return null;
  if (value is num) return value.toDouble();
  return double.tryParse(value.toString());
}

bool _bool(dynamic value, [bool fallback = false]) {
  if (value is bool) return value;
  return fallback;
}

JsonMap _map(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) {
    return value.map((key, value) => MapEntry(key.toString(), value));
  }
  return <String, dynamic>{};
}

List<JsonMap> _mapList(dynamic value) {
  if (value is! List) return const [];
  return value.map(_map).toList(growable: false);
}

enum UserRole {
  admin('ADMIN'),
  leader('LEADER'),
  worker('WORKER');

  const UserRole(this.wireName);

  final String wireName;

  static UserRole fromWire(String value) {
    return UserRole.values.firstWhere(
      (role) => role.wireName == value,
      orElse: () => UserRole.worker,
    );
  }
}

class User {
  const User({
    required this.id,
    required this.username,
    required this.email,
    required this.role,
  });

  final String id;
  final String username;
  final String email;
  final UserRole role;

  factory User.fromJson(JsonMap json) {
    return User(
      id: _string(json['id']),
      username: _string(json['username']),
      email: _string(json['email']),
      role: UserRole.fromWire(_string(json['role'])),
    );
  }
}

class PublicUserSummary {
  const PublicUserSummary({
    required this.id,
    required this.username,
    required this.email,
    required this.role,
  });

  final String id;
  final String username;
  final String email;
  final String role;

  factory PublicUserSummary.fromJson(JsonMap json) {
    return PublicUserSummary(
      id: _string(json['id']),
      username: _string(json['username']),
      email: _string(json['email']),
      role: _string(json['role']),
    );
  }
}

class WorkPointWorker extends PublicUserSummary {
  const WorkPointWorker({
    required super.id,
    required super.username,
    required super.email,
    required super.role,
    required this.hourlyWage,
  });

  final double? hourlyWage;

  factory WorkPointWorker.fromJson(JsonMap json) {
    return WorkPointWorker(
      id: _string(json['id']),
      username: _string(json['username']),
      email: _string(json['email']),
      role: _string(json['role']),
      hourlyWage: _nullableDouble(json['hourlyWage']),
    );
  }
}

class WorkPointSummary {
  const WorkPointSummary({
    required this.id,
    required this.name,
    required this.address,
    required this.lat,
    required this.lng,
    required this.description,
    required this.userId,
    required this.uploadedAt,
    required this.deadline,
    required this.owner,
    required this.workerCount,
    required this.attendanceCount,
  });

  final String id;
  final String name;
  final String address;
  final double? lat;
  final double? lng;
  final String? description;
  final String? userId;
  final String uploadedAt;
  final String? deadline;
  final PublicUserSummary? owner;
  final int workerCount;
  final int attendanceCount;

  factory WorkPointSummary.fromJson(JsonMap json) {
    return WorkPointSummary(
      id: _string(json['id']),
      name: _string(json['name']),
      address: _string(json['address']),
      lat: _nullableDouble(json['lat']),
      lng: _nullableDouble(json['lng']),
      description: _nullableString(json['description']),
      userId: _nullableString(json['userId']),
      uploadedAt: _string(json['uploadedAt']),
      deadline: _nullableString(json['deadline']),
      owner: json['owner'] == null ? null : PublicUserSummary.fromJson(_map(json['owner'])),
      workerCount: _int(json['workerCount']),
      attendanceCount: _int(json['attendanceCount']),
    );
  }
}

class AssignedWorkPointSummary {
  const AssignedWorkPointSummary({
    required this.id,
    required this.name,
    required this.address,
    required this.lat,
    required this.lng,
    required this.description,
    required this.userId,
    required this.uploadedAt,
    required this.deadline,
    required this.owner,
  });

  final String id;
  final String name;
  final String address;
  final double? lat;
  final double? lng;
  final String? description;
  final String? userId;
  final String uploadedAt;
  final String? deadline;
  final PublicUserSummary? owner;

  factory AssignedWorkPointSummary.fromJson(JsonMap json) {
    return AssignedWorkPointSummary(
      id: _string(json['id']),
      name: _string(json['name']),
      address: _string(json['address']),
      lat: _nullableDouble(json['lat']),
      lng: _nullableDouble(json['lng']),
      description: _nullableString(json['description']),
      userId: _nullableString(json['userId']),
      uploadedAt: _string(json['uploadedAt']),
      deadline: _nullableString(json['deadline']),
      owner: json['owner'] == null ? null : PublicUserSummary.fromJson(_map(json['owner'])),
    );
  }
}

class WorkPointDetail extends WorkPointSummary {
  const WorkPointDetail({
    required super.id,
    required super.name,
    required super.address,
    required super.lat,
    required super.lng,
    required super.description,
    required super.userId,
    required super.uploadedAt,
    required super.deadline,
    required super.owner,
    required super.workerCount,
    required super.attendanceCount,
    required this.workers,
  });

  final List<WorkPointWorker> workers;

  factory WorkPointDetail.fromJson(JsonMap json) {
    return WorkPointDetail(
      id: _string(json['id']),
      name: _string(json['name']),
      address: _string(json['address']),
      lat: _nullableDouble(json['lat']),
      lng: _nullableDouble(json['lng']),
      description: _nullableString(json['description']),
      userId: _nullableString(json['userId']),
      uploadedAt: _string(json['uploadedAt']),
      deadline: _nullableString(json['deadline']),
      owner: json['owner'] == null ? null : PublicUserSummary.fromJson(_map(json['owner'])),
      workerCount: _int(json['workerCount']),
      attendanceCount: _int(json['attendanceCount']),
      workers: _mapList(json['workers']).map(WorkPointWorker.fromJson).toList(),
    );
  }
}

class WorkerSummary {
  const WorkerSummary({
    required this.id,
    required this.username,
    required this.email,
    required this.role,
    required this.assignedWorkPointCount,
    required this.hourlyWage,
  });

  final String id;
  final String username;
  final String email;
  final String role;
  final int assignedWorkPointCount;
  final double? hourlyWage;

  factory WorkerSummary.fromJson(JsonMap json) {
    return WorkerSummary(
      id: _string(json['id']),
      username: _string(json['username']),
      email: _string(json['email']),
      role: _string(json['role']),
      assignedWorkPointCount: _int(json['assignedWorkPointCount']),
      hourlyWage: _nullableDouble(json['hourlyWage']),
    );
  }
}

class Invitation {
  const Invitation({
    required this.id,
    required this.email,
    required this.role,
    required this.status,
    required this.expiresAt,
    required this.acceptedAt,
    required this.revokedAt,
    required this.createdAt,
    required this.inviteUrl,
  });

  final String id;
  final String email;
  final String role;
  final String status;
  final String expiresAt;
  final String? acceptedAt;
  final String? revokedAt;
  final String createdAt;
  final String inviteUrl;

  factory Invitation.fromJson(JsonMap json) {
    return Invitation(
      id: _string(json['id']),
      email: _string(json['email']),
      role: _string(json['role']),
      status: _string(json['status']),
      expiresAt: _string(json['expiresAt']),
      acceptedAt: _nullableString(json['acceptedAt']),
      revokedAt: _nullableString(json['revokedAt']),
      createdAt: _string(json['createdAt']),
      inviteUrl: _string(json['inviteUrl']),
    );
  }
}

class AttendanceRecord {
  const AttendanceRecord({
    required this.id,
    required this.workerId,
    required this.workPointId,
    required this.date,
    required this.checkedInAt,
    required this.checkedOutAt,
    required this.checkoutSource,
    required this.source,
    required this.worker,
  });

  final String id;
  final String workerId;
  final String workPointId;
  final String date;
  final String checkedInAt;
  final String? checkedOutAt;
  final String? checkoutSource;
  final String source;
  final PublicUserSummary worker;

  factory AttendanceRecord.fromJson(JsonMap json) {
    return AttendanceRecord(
      id: _string(json['id']),
      workerId: _string(json['workerId']),
      workPointId: _string(json['workPointId']),
      date: _string(json['date']),
      checkedInAt: _string(json['checkedInAt']),
      checkedOutAt: _nullableString(json['checkedOutAt']),
      checkoutSource: _nullableString(json['checkoutSource']),
      source: _string(json['source']),
      worker: PublicUserSummary.fromJson(_map(json['worker'])),
    );
  }

  double? get hours {
    final end = DateTime.tryParse(checkedOutAt ?? '');
    final start = DateTime.tryParse(checkedInAt);
    if (start == null || end == null) return null;
    return billableHoursBetween(start, end);
  }
}

class QrData {
  const QrData({required this.qrToken, required this.qrPng});

  final String qrToken;
  final String qrPng;

  factory QrData.fromJson(JsonMap json) {
    return QrData(qrToken: _string(json['qrToken']), qrPng: _string(json['qrPng']));
  }
}

class ScanResult {
  const ScanResult({
    required this.event,
    required this.workPointName,
    required this.date,
    required this.checkedInAt,
    this.checkedOutAt,
    this.checkoutSource,
    this.hours,
    this.earnings,
  });

  final String event;
  final String workPointName;
  final String date;
  final String checkedInAt;
  final String? checkedOutAt;
  final String? checkoutSource;
  final double? hours;
  final double? earnings;

  bool get isCheckIn => event == 'CHECK_IN';

  bool get isCompleted => event != 'CHECK_IN';

  factory ScanResult.fromJson(JsonMap json) {
    return ScanResult(
      event: _string(json['event']),
      workPointName: _string(json['workPointName']),
      date: _string(json['date']),
      checkedInAt: _string(json['checkedInAt']),
      checkedOutAt: _nullableString(json['checkedOutAt']),
      checkoutSource: _nullableString(json['checkoutSource']),
      hours: _nullableDouble(json['hours']),
      earnings: _nullableDouble(json['earnings']),
    );
  }
}

class DailyStatRow {
  const DailyStatRow({
    required this.id,
    required this.date,
    required this.workPoint,
    required this.checkedInAt,
    required this.checkedOutAt,
    required this.checkoutSource,
    required this.hours,
    required this.earnings,
    required this.complete,
  });

  final String id;
  final String date;
  final WorkPointRef workPoint;
  final String checkedInAt;
  final String? checkedOutAt;
  final String? checkoutSource;
  final double hours;
  final double earnings;
  final bool complete;

  factory DailyStatRow.fromJson(JsonMap json) {
    return DailyStatRow(
      id: _string(json['id']),
      date: _string(json['date']),
      workPoint: WorkPointRef.fromJson(_map(json['workPoint'])),
      checkedInAt: _string(json['checkedInAt']),
      checkedOutAt: _nullableString(json['checkedOutAt']),
      checkoutSource: _nullableString(json['checkoutSource']),
      hours: _double(json['hours']),
      earnings: _double(json['earnings']),
      complete: _bool(json['complete']),
    );
  }
}

class WorkPointRef {
  const WorkPointRef({required this.id, required this.name});

  final String id;
  final String name;

  factory WorkPointRef.fromJson(JsonMap json) {
    return WorkPointRef(id: _string(json['id']), name: _string(json['name']));
  }
}

class MonthlySummary {
  const MonthlySummary({
    required this.totalDays,
    required this.completeDays,
    required this.totalHours,
    required this.totalEarnings,
    required this.hourlyWage,
  });

  final int totalDays;
  final int completeDays;
  final double totalHours;
  final double totalEarnings;
  final double? hourlyWage;

  factory MonthlySummary.fromJson(JsonMap json) {
    return MonthlySummary(
      totalDays: _int(json['totalDays']),
      completeDays: _int(json['completeDays']),
      totalHours: _double(json['totalHours']),
      totalEarnings: _double(json['totalEarnings']),
      hourlyWage: _nullableDouble(json['hourlyWage']),
    );
  }
}

class WorkerDocumentSummary {
  const WorkerDocumentSummary({
    required this.id,
    required this.workerId,
    required this.originalName,
    required this.mimeType,
    required this.sizeBytes,
    required this.createdAt,
    required this.uploadedBy,
  });

  final String id;
  final String workerId;
  final String originalName;
  final String mimeType;
  final int sizeBytes;
  final String createdAt;
  final PublicUserSummary? uploadedBy;

  bool get isImage => mimeType.startsWith('image/');

  bool get isPdf => mimeType == 'application/pdf';

  factory WorkerDocumentSummary.fromJson(JsonMap json) {
    return WorkerDocumentSummary(
      id: _string(json['id']),
      workerId: _string(json['workerId']),
      originalName: _string(json['originalName']),
      mimeType: _string(json['mimeType']),
      sizeBytes: _int(json['sizeBytes']),
      createdAt: _string(json['createdAt']),
      uploadedBy:
          json['uploadedBy'] == null ? null : PublicUserSummary.fromJson(_map(json['uploadedBy'])),
    );
  }
}

class ChatParticipant {
  const ChatParticipant({required this.id, required this.username});

  final String id;
  final String username;

  factory ChatParticipant.fromJson(JsonMap json) {
    return ChatParticipant(id: _string(json['id']), username: _string(json['username']));
  }
}

class LastMessage {
  const LastMessage({
    required this.id,
    required this.body,
    required this.senderId,
    required this.senderUsername,
    required this.createdAt,
    required this.attachmentName,
  });

  final String id;
  final String body;
  final String senderId;
  final String senderUsername;
  final String createdAt;
  final String? attachmentName;

  factory LastMessage.fromJson(JsonMap json) {
    return LastMessage(
      id: _string(json['id']),
      body: _string(json['body']),
      senderId: _string(json['senderId']),
      senderUsername: _string(json['senderUsername']),
      createdAt: _string(json['createdAt']),
      attachmentName: _nullableString(json['attachmentName']),
    );
  }
}

class ChatListItem {
  const ChatListItem({
    required this.id,
    required this.type,
    required this.name,
    required this.workPointId,
    required this.lastMessage,
    required this.lastMessageAt,
    required this.unreadCount,
    required this.participants,
    required this.otherUserId,
  });

  final String id;
  final String type;
  final String name;
  final String? workPointId;
  final LastMessage? lastMessage;
  final String? lastMessageAt;
  final int unreadCount;
  final List<ChatParticipant> participants;
  final String? otherUserId;

  ChatListItem copyWith({
    LastMessage? lastMessage,
    String? lastMessageAt,
    int? unreadCount,
  }) {
    return ChatListItem(
      id: id,
      type: type,
      name: name,
      workPointId: workPointId,
      lastMessage: lastMessage ?? this.lastMessage,
      lastMessageAt: lastMessageAt ?? this.lastMessageAt,
      unreadCount: unreadCount ?? this.unreadCount,
      participants: participants,
      otherUserId: otherUserId,
    );
  }

  factory ChatListItem.fromJson(JsonMap json) {
    return ChatListItem(
      id: _string(json['id']),
      type: _string(json['type']),
      name: _string(json['name']),
      workPointId: _nullableString(json['workPointId']),
      lastMessage:
          json['lastMessage'] == null ? null : LastMessage.fromJson(_map(json['lastMessage'])),
      lastMessageAt: _nullableString(json['lastMessageAt']),
      unreadCount: _int(json['unreadCount']),
      participants: _mapList(json['participants']).map(ChatParticipant.fromJson).toList(),
      otherUserId: _nullableString(json['otherUserId']),
    );
  }
}

class ReplyTo {
  const ReplyTo({required this.id, required this.body, required this.senderUsername});

  final String id;
  final String body;
  final String senderUsername;

  factory ReplyTo.fromJson(JsonMap json) {
    return ReplyTo(
      id: _string(json['id']),
      body: _string(json['body']),
      senderUsername: _string(json['senderUsername']),
    );
  }
}

class Message {
  const Message({
    required this.id,
    required this.chatId,
    required this.senderId,
    required this.senderUsername,
    required this.body,
    required this.attachmentUrl,
    required this.attachmentName,
    required this.attachmentType,
    required this.replyToId,
    required this.replyTo,
    required this.createdAt,
    required this.editedAt,
    required this.clientNonce,
    this.pending = false,
  });

  final String id;
  final String chatId;
  final String senderId;
  final String senderUsername;
  final String body;
  final String? attachmentUrl;
  final String? attachmentName;
  final String? attachmentType;
  final String? replyToId;
  final ReplyTo? replyTo;
  final String createdAt;
  final String? editedAt;
  final String? clientNonce;
  final bool pending;

  Message copyWith({bool? pending}) {
    return Message(
      id: id,
      chatId: chatId,
      senderId: senderId,
      senderUsername: senderUsername,
      body: body,
      attachmentUrl: attachmentUrl,
      attachmentName: attachmentName,
      attachmentType: attachmentType,
      replyToId: replyToId,
      replyTo: replyTo,
      createdAt: createdAt,
      editedAt: editedAt,
      clientNonce: clientNonce,
      pending: pending ?? this.pending,
    );
  }

  factory Message.fromJson(JsonMap json) {
    return Message(
      id: _string(json['id']),
      chatId: _string(json['chatId']),
      senderId: _string(json['senderId']),
      senderUsername: _string(json['senderUsername']),
      body: _string(json['body']),
      attachmentUrl: _nullableString(json['attachmentUrl']),
      attachmentName: _nullableString(json['attachmentName']),
      attachmentType: _nullableString(json['attachmentType']),
      replyToId: _nullableString(json['replyToId']),
      replyTo: json['replyTo'] == null ? null : ReplyTo.fromJson(_map(json['replyTo'])),
      createdAt: _string(json['createdAt']),
      editedAt: _nullableString(json['editedAt']),
      clientNonce: _nullableString(json['clientNonce']),
      pending: _bool(json['pending']),
    );
  }
}

class MessagesPage {
  const MessagesPage({required this.messages, required this.hasMore, required this.nextCursor});

  final List<Message> messages;
  final bool hasMore;
  final String? nextCursor;

  factory MessagesPage.fromJson(JsonMap json) {
    return MessagesPage(
      messages: _mapList(json['messages']).map(Message.fromJson).toList(),
      hasMore: _bool(json['hasMore']),
      nextCursor: _nullableString(json['nextCursor']),
    );
  }
}

class ChatUser {
  const ChatUser({
    required this.id,
    required this.username,
    required this.email,
    required this.role,
  });

  final String id;
  final String username;
  final String email;
  final String role;

  factory ChatUser.fromJson(JsonMap json) {
    return ChatUser(
      id: _string(json['id']),
      username: _string(json['username']),
      email: _string(json['email']),
      role: _string(json['role']),
    );
  }
}

class UploadedAttachment {
  const UploadedAttachment({
    required this.attachmentUrl,
    required this.attachmentName,
    required this.attachmentType,
  });

  final String attachmentUrl;
  final String attachmentName;
  final String attachmentType;

  factory UploadedAttachment.fromJson(JsonMap json) {
    return UploadedAttachment(
      attachmentUrl: _string(json['attachmentUrl']),
      attachmentName: _string(json['attachmentName']),
      attachmentType: _string(json['attachmentType']),
    );
  }

  JsonMap toJson() {
    return {
      'attachmentUrl': attachmentUrl,
      'attachmentName': attachmentName,
      'attachmentType': attachmentType,
    };
  }
}

import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as socket_io;

import '../auth/auth_controller.dart';
import '../core/api/api_client.dart';
import '../core/api/buildpulse_api.dart';
import '../core/app_config.dart';
import '../core/models.dart';

class MessagingController extends ChangeNotifier {
  MessagingController(this._api, this._auth) {
    _authUserId = _auth.user?.id;
    _auth.addListener(_handleAuthChanged);
  }

  final BuildPulseApi _api;
  final AuthController _auth;

  socket_io.Socket? _socket;
  String? _socketUserId;
  String? _authUserId;
  bool _isConnected = false;
  bool _isConnecting = false;
  bool _isRefreshingSocketAuth = false;
  bool _isLoadingChats = false;
  String? _activeChatId;
  int _leaveRequestChangeVersion = 0;
  LeaveRequestChange? _latestLeaveRequestChange;

  final Map<String, List<Message>> _messagesByChat = {};
  final Map<String, String?> _nextCursorByChat = {};
  final Map<String, bool> _hasMoreByChat = {};
  final Set<String> _loadingMessageChats = {};
  final Set<String> _loadingOlderChats = {};
  final Set<String> _typingUsers = {};

  List<ChatListItem> _chats = const [];

  bool get isConnected => _isConnected;

  bool get isLoadingChats => _isLoadingChats;

  List<ChatListItem> get chats => _chats;

  int get leaveRequestChangeVersion => _leaveRequestChangeVersion;

  LeaveRequestChange? get latestLeaveRequestChange => _latestLeaveRequestChange;

  String? get activeChatId => _activeChatId;

  ChatListItem? get activeChat {
    final id = _activeChatId;
    if (id == null) return null;
    return _chats.where((chat) => chat.id == id).firstOrNull;
  }

  List<Message> messagesFor(String chatId) =>
      List.unmodifiable(_messagesByChat[chatId] ?? const []);

  bool isLoadingMessages(String chatId) =>
      _loadingMessageChats.contains(chatId);

  bool isLoadingOlder(String chatId) => _loadingOlderChats.contains(chatId);

  bool hasMoreMessages(String chatId) => _hasMoreByChat[chatId] ?? false;

  bool get isTypingInActiveChat => _typingUsers.isNotEmpty;

  bool get _isSocketForCurrentUser =>
      _socket != null && _socketUserId == _auth.user?.id;

  Future<void> connect() async {
    final userId = _auth.user?.id;
    if (userId == null || _isConnecting) return;
    if (_socket != null && _socketUserId != userId) {
      disconnect();
    }
    if (_socket != null) return;
    _isConnecting = true;
    final token = await _api.client.cookieValue(ApiClient.accessTokenCookie);
    if (_auth.user?.id != userId) {
      _isConnecting = false;
      notifyListeners();
      return;
    }
    final socket = socket_io.io(
      AppConfig.apiOrigin,
      socket_io.OptionBuilder()
          .enableForceNew()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setReconnectionAttempts(10)
          .setReconnectionDelay(1500)
          .setAuth({'token': token})
          .build(),
    );

    socket.onConnect((_) {
      if (!_isActiveSocket(socket, userId)) {
        socket.dispose();
        return;
      }
      _isConnected = true;
      _isConnecting = false;
      notifyListeners();
      for (final chat in _chats) {
        socket.emit('chat:join', {'chatId': chat.id});
      }
    });
    socket.onDisconnect((_) {
      if (!_isActiveSocket(socket, userId)) return;
      _isConnected = false;
      notifyListeners();
    });
    socket.onConnectError((error) async {
      if (!_isActiveSocket(socket, userId) ||
          _isRefreshingSocketAuth ||
          error.toString() != 'Unauthorized') {
        return;
      }
      _isRefreshingSocketAuth = true;
      try {
        await _api.client.refreshSession();
        if (!_isActiveSocket(socket, userId)) return;
        final nextToken = await _api.client.cookieValue(
          ApiClient.accessTokenCookie,
        );
        socket.auth = {'token': nextToken};
        if (socket.disconnected) socket.connect();
      } catch (_) {
        if (_isActiveSocket(socket, userId)) {
          await _auth.logout();
        }
      } finally {
        _isRefreshingSocketAuth = false;
      }
    });
    socket.on('message:new', (payload) {
      if (!_isActiveSocket(socket, userId)) return;
      if (payload is Map) {
        _upsertMessage(Message.fromJson(Map<String, dynamic>.from(payload)));
      }
    });
    socket.on('chat:bumped', (payload) {
      if (!_isActiveSocket(socket, userId)) return;
      if (payload is! Map) return;
      final data = Map<String, dynamic>.from(payload);
      final chatId = data['chatId']?.toString();
      final lastMessageAt = data['lastMessageAt']?.toString();
      if (chatId == null) return;
      _chats = _sortedChats(
        _chats
            .map(
              (chat) => chat.id == chatId
                  ? chat.copyWith(
                      lastMessageAt: lastMessageAt,
                      unreadCount: chat.id == _activeChatId
                          ? 0
                          : chat.unreadCount + 1,
                    )
                  : chat,
            )
            .toList(),
      );
      notifyListeners();
    });
    socket.on('presence:online', (_) {
      if (_isActiveSocket(socket, userId)) notifyListeners();
    });
    socket.on('presence:offline', (_) {
      if (_isActiveSocket(socket, userId)) notifyListeners();
    });
    socket.on('leave-request:changed', (payload) {
      if (!_isActiveSocket(socket, userId)) return;
      if (payload is! Map) return;
      _latestLeaveRequestChange = LeaveRequestChange.fromJson(
        Map<String, dynamic>.from(payload),
      );
      _leaveRequestChangeVersion += 1;
      notifyListeners();
    });
    socket.on('typing', (payload) {
      if (!_isActiveSocket(socket, userId)) return;
      if (payload is! Map) return;
      final data = Map<String, dynamic>.from(payload);
      if (data['chatId']?.toString() != _activeChatId) return;
      final typingUserId = data['userId']?.toString();
      if (typingUserId == null || typingUserId == _auth.user?.id) return;
      if (data['isTyping'] == true) {
        _typingUsers.add(typingUserId);
        Timer(const Duration(seconds: 3), () {
          if (!_isActiveSocket(socket, userId)) return;
          _typingUsers.remove(typingUserId);
          notifyListeners();
        });
      } else {
        _typingUsers.remove(typingUserId);
      }
      notifyListeners();
    });

    _socket = socket;
    _socketUserId = userId;
    socket.connect();
  }

  Future<void> loadChats() async {
    if (!_auth.isAuthenticated) return;
    _isLoadingChats = true;
    notifyListeners();
    try {
      _chats = _sortedChats(await _api.listChats());
    } finally {
      _isLoadingChats = false;
      notifyListeners();
    }
  }

  Future<void> selectChat(String chatId) async {
    _activeChatId = chatId;
    _typingUsers.clear();
    _markChatReadLocally(chatId);
    notifyListeners();
    await connect();
    if (_socket?.connected == true && _isSocketForCurrentUser) {
      _socket?.emit('chat:join', {'chatId': chatId});
      _socket?.emit('chat:read', {'chatId': chatId});
    }
    await _api.markRead(chatId);
    if (!_messagesByChat.containsKey(chatId)) {
      await loadMessages(chatId);
    }
  }

  void clearActiveChat() {
    _activeChatId = null;
    _typingUsers.clear();
    notifyListeners();
  }

  Future<void> loadMessages(String chatId) async {
    _loadingMessageChats.add(chatId);
    notifyListeners();
    try {
      final page = await _api.getMessages(chatId);
      _messagesByChat[chatId] = page.messages;
      _nextCursorByChat[chatId] = page.nextCursor;
      _hasMoreByChat[chatId] = page.hasMore;
    } finally {
      _loadingMessageChats.remove(chatId);
      notifyListeners();
    }
  }

  Future<void> loadOlderMessages(String chatId) async {
    if (!hasMoreMessages(chatId) || _loadingOlderChats.contains(chatId)) return;
    _loadingOlderChats.add(chatId);
    notifyListeners();
    try {
      final page = await _api.getMessages(
        chatId,
        cursor: _nextCursorByChat[chatId],
      );
      _messagesByChat[chatId] = [
        ...page.messages,
        ...(_messagesByChat[chatId] ?? const []),
      ];
      _nextCursorByChat[chatId] = page.nextCursor;
      _hasMoreByChat[chatId] = page.hasMore;
    } finally {
      _loadingOlderChats.remove(chatId);
      notifyListeners();
    }
  }

  Future<void> createDirectChat(String userId) async {
    final chatId = await _api.createDirectChat(userId);
    await loadChats();
    await selectChat(chatId);
  }

  Future<List<ChatUser>> listUsers() => _api.listMessagingUsers();

  Future<UploadedAttachment> uploadAttachment({
    required String chatId,
    required String path,
    required String filename,
  }) {
    return _api.uploadAttachment(
      chatId: chatId,
      path: path,
      filename: filename,
    );
  }

  Future<void> sendMessage({
    required String chatId,
    required String body,
    String? replyToId,
    String? attachmentUrl,
    String? attachmentName,
    String? attachmentType,
  }) async {
    final nonce =
        '${DateTime.now().millisecondsSinceEpoch}-${Object().hashCode}';
    final payload = <String, dynamic>{
      'chatId': chatId,
      'body': body,
      'clientNonce': nonce,
    };
    if (replyToId != null) payload['replyToId'] = replyToId;
    if (attachmentUrl != null) payload['attachmentUrl'] = attachmentUrl;
    if (attachmentName != null) payload['attachmentName'] = attachmentName;
    if (attachmentType != null) payload['attachmentType'] = attachmentType;

    if (_socket?.connected == true && _isSocketForCurrentUser) {
      _socket?.emit('message:send', payload);
    } else {
      if (_socket != null && !_isSocketForCurrentUser) {
        disconnect();
      }
      final message = await _api.sendMessage(
        chatId,
        body: body,
        replyToId: replyToId,
        attachmentUrl: attachmentUrl,
        attachmentName: attachmentName,
        attachmentType: attachmentType,
        clientNonce: nonce,
      );
      _upsertMessage(message);
    }
  }

  void sendTyping(String chatId, bool isTyping) {
    if (_socket?.connected != true || !_isSocketForCurrentUser) return;
    _socket?.emit('message:typing', {'chatId': chatId, 'isTyping': isTyping});
  }

  void disconnect() {
    _socket?.dispose();
    _socket = null;
    _socketUserId = null;
    _isConnected = false;
    _isConnecting = false;
    _activeChatId = null;
    _typingUsers.clear();
    _messagesByChat.clear();
    _nextCursorByChat.clear();
    _hasMoreByChat.clear();
    _chats = const [];
    notifyListeners();
  }

  void _handleAuthChanged() {
    final nextUserId = _auth.user?.id;
    final didUserChange = nextUserId != _authUserId;
    _authUserId = nextUserId;
    if (didUserChange) {
      disconnect();
    }
  }

  bool _isActiveSocket(socket_io.Socket socket, String userId) {
    return identical(_socket, socket) &&
        _socketUserId == userId &&
        _auth.user?.id == userId;
  }

  void _upsertMessage(Message message) {
    final current = [...(_messagesByChat[message.chatId] ?? const <Message>[])];
    final nonceIndex = current.indexWhere(
      (item) =>
          item.clientNonce != null && item.clientNonce == message.clientNonce,
    );
    final idIndex = current.indexWhere((item) => item.id == message.id);
    if (nonceIndex >= 0) {
      current[nonceIndex] = message;
    } else if (idIndex >= 0) {
      current[idIndex] = message;
    } else {
      current.add(message);
    }
    current.sort((a, b) => a.createdAt.compareTo(b.createdAt));
    _messagesByChat[message.chatId] = current;

    final last = LastMessage(
      id: message.id,
      body: message.body,
      senderId: message.senderId,
      senderUsername: message.senderUsername,
      createdAt: message.createdAt,
      attachmentName: message.attachmentName,
    );
    _chats = _sortedChats(
      _chats
          .map(
            (chat) => chat.id == message.chatId
                ? chat.copyWith(
                    lastMessage: last,
                    lastMessageAt: message.createdAt,
                    unreadCount: message.chatId == _activeChatId
                        ? 0
                        : chat.unreadCount,
                  )
                : chat,
          )
          .toList(),
    );
    notifyListeners();
  }

  void _markChatReadLocally(String chatId) {
    _chats = _chats
        .map((chat) => chat.id == chatId ? chat.copyWith(unreadCount: 0) : chat)
        .toList();
  }

  List<ChatListItem> _sortedChats(List<ChatListItem> chats) {
    final sorted = [...chats];
    sorted.sort((a, b) {
      final aTime = DateTime.tryParse(a.lastMessageAt ?? '');
      final bTime = DateTime.tryParse(b.lastMessageAt ?? '');
      if (aTime == null && bTime == null) return a.name.compareTo(b.name);
      if (aTime == null) return 1;
      if (bTime == null) return -1;
      return bTime.compareTo(aTime);
    });
    return sorted;
  }

  @override
  void dispose() {
    _auth.removeListener(_handleAuthChanged);
    _socket?.dispose();
    super.dispose();
  }
}

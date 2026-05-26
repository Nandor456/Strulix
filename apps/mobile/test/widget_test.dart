import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/auth/auth_controller.dart';
import 'package:mobile/auth/auth_pages.dart';
import 'package:mobile/core/api/api_client.dart';
import 'package:mobile/core/api/buildpulse_api.dart';
import 'package:mobile/core/app_router.dart';
import 'package:mobile/core/app_scope.dart';
import 'package:mobile/core/formatters.dart';
import 'package:mobile/core/i18n.dart';
import 'package:mobile/core/models.dart';
import 'package:mobile/core/theme_controller.dart';
import 'package:mobile/messaging/messaging_controller.dart';

const _testApiBaseUrl = 'http://localhost:4000/api';

void main() {
  testWidgets('login screen renders BuildPulse sign in form', (tester) async {
    await tester.pumpWidget(_host(const LoginPage()));

    expect(find.text('Sign in'), findsWidgets);
    expect(find.byKey(const Key('login-username')), findsOneWidget);
    expect(find.byKey(const Key('login-password')), findsOneWidget);
    expect(find.byKey(const Key('login-submit')), findsOneWidget);
  });

  testWidgets('register screen renders invitation context', (tester) async {
    await tester.pumpWidget(
      _host(
        const RegisterPage(
          token: 'invite-token',
          prefilledEmail: 'worker@example.com',
        ),
      ),
    );

    expect(find.text('Create your account'), findsWidgets);
    expect(find.textContaining('accepting an invitation'), findsOneWidget);
    expect(
      find.widgetWithText(TextFormField, 'worker@example.com'),
      findsOneWidget,
    );
  });

  test('route guard redirects unauthenticated users to login', () {
    final redirect = buildPulseRedirect(
      isAuthenticated: false,
      role: null,
      uri: Uri.parse('/workpoints/abc'),
    );

    expect(redirect, '/login?redirect=%2Fworkpoints%2Fabc');
  });

  test('route guard blocks worker-only documents for leaders', () {
    final redirect = buildPulseRedirect(
      isAuthenticated: true,
      role: UserRole.leader,
      uri: Uri.parse('/documents'),
    );

    expect(redirect, '/');
  });

  test('formatters and user model mirror web behavior', () {
    expect(formatHours(2.75), '2.75h');
    expect(formatMoney(null), 'Not set');

    final user = User.fromJson({
      'id': 'u1',
      'username': 'worker',
      'email': 'worker@example.com',
      'role': 'WORKER',
    });
    expect(user.role, UserRole.worker);
  });

  test('messaging resets when the authenticated user changes', () async {
    final api = _FakeBuildPulseApi()
      ..currentUserValue = const User(
        id: 'admin-1',
        username: 'admin',
        email: 'admin@example.com',
        role: UserRole.admin,
      )
      ..chatsValue = const [
        ChatListItem(
          id: 'chat-1',
          type: 'DIRECT',
          name: 'Worker',
          workPointId: null,
          lastMessage: null,
          lastMessageAt: null,
          unreadCount: 0,
          participants: [],
          otherUserId: 'worker-1',
        ),
      ]
      ..messagesPageValue = const MessagesPage(
        messages: [
          Message(
            id: 'message-1',
            chatId: 'chat-1',
            senderId: 'admin-1',
            senderUsername: 'admin',
            body: 'hello',
            attachmentUrl: null,
            attachmentName: null,
            attachmentType: null,
            replyToId: null,
            replyTo: null,
            createdAt: '2026-05-24T10:00:00.000Z',
            editedAt: null,
            clientNonce: null,
          ),
        ],
        hasMore: false,
        nextCursor: null,
      );
    final auth = AuthController(api);
    await auth.bootstrap();
    final messaging = MessagingController(api, auth);

    await messaging.loadChats();
    await messaging.loadMessages('chat-1');

    expect(messaging.chats, hasLength(1));
    expect(messaging.messagesFor('chat-1'), hasLength(1));

    api.currentUserValue = const User(
      id: 'worker-1',
      username: 'worker',
      email: 'worker@example.com',
      role: UserRole.worker,
    );
    await auth.refreshUser();

    expect(auth.user?.id, 'worker-1');
    expect(messaging.chats, isEmpty);
    expect(messaging.messagesFor('chat-1'), isEmpty);
    expect(messaging.activeChatId, isNull);
  });

  test('logout clears messaging before the API logout finishes', () async {
    final api = _FakeBuildPulseApi()
      ..currentUserValue = const User(
        id: 'admin-1',
        username: 'admin',
        email: 'admin@example.com',
        role: UserRole.admin,
      )
      ..chatsValue = const [
        ChatListItem(
          id: 'chat-1',
          type: 'DIRECT',
          name: 'Worker',
          workPointId: null,
          lastMessage: null,
          lastMessageAt: null,
          unreadCount: 0,
          participants: [],
          otherUserId: 'worker-1',
        ),
      ];
    final logoutCompleter = Completer<void>();
    api.logoutCompleter = logoutCompleter;
    final auth = AuthController(api);
    await auth.bootstrap();
    final messaging = MessagingController(api, auth);

    await messaging.loadChats();
    expect(messaging.chats, hasLength(1));

    final logoutFuture = auth.logout();

    expect(auth.user, isNull);
    expect(messaging.chats, isEmpty);

    logoutCompleter.complete();
    await logoutFuture;
  });
}

Widget _host(Widget child) {
  final apiClient = ApiClient.inMemory(baseUrl: _testApiBaseUrl);
  final api = BuildPulseApi(apiClient);
  final auth = AuthController(api);
  final messaging = MessagingController(api, auth);
  final theme = ThemeController();
  final language = LanguageController(systemLocale: const Locale('en'));

  return AppScope(
    api: api,
    auth: auth,
    messaging: messaging,
    theme: theme,
    language: language,
    child: MaterialApp(home: child),
  );
}

class _FakeBuildPulseApi extends BuildPulseApi {
  _FakeBuildPulseApi() : super(ApiClient.inMemory(baseUrl: _testApiBaseUrl));

  User? currentUserValue;
  List<ChatListItem> chatsValue = const [];
  Completer<void>? logoutCompleter;
  MessagesPage messagesPageValue = const MessagesPage(
    messages: [],
    hasMore: false,
    nextCursor: null,
  );

  @override
  Future<User?> currentUser() async => currentUserValue;

  @override
  Future<void> logout() async {
    currentUserValue = null;
    await logoutCompleter?.future;
  }

  @override
  Future<List<ChatListItem>> listChats() async => chatsValue;

  @override
  Future<MessagesPage> getMessages(
    String chatId, {
    String? cursor,
    int? limit,
  }) async {
    return messagesPageValue;
  }
}

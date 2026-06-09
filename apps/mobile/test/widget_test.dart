import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/attendance/attendance_location_monitor_controller.dart';
import 'package:mobile/auth/auth_controller.dart';
import 'package:mobile/auth/auth_pages.dart';
import 'package:mobile/core/api/api_client.dart';
import 'package:mobile/core/api/buildpulse_api.dart';
import 'package:mobile/core/app_router.dart';
import 'package:mobile/core/app_scope.dart';
import 'package:mobile/core/formatters.dart';
import 'package:mobile/core/i18n.dart';
import 'package:mobile/core/leave_dates.dart';
import 'package:mobile/core/models.dart';
import 'package:mobile/core/theme_controller.dart';
import 'package:mobile/messaging/messaging_controller.dart';
import 'package:mobile/settings/settings_page.dart';

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

  testWidgets('forgot password screen renders email form', (tester) async {
    await tester.pumpWidget(_host(const ForgotPasswordPage()));

    expect(find.text('Forgot password?'), findsWidgets);
    expect(find.byKey(const Key('forgot-email')), findsOneWidget);
    expect(find.byKey(const Key('forgot-submit')), findsOneWidget);
  });

  testWidgets('settings shows admin billing controls', (tester) async {
    final api = _FakeBuildPulseApi()
      ..currentUserValue = const User(
        id: 'admin-1',
        username: 'admin',
        email: 'admin@example.com',
        role: UserRole.admin,
      )
      ..billingStatusValue = const BillingStatusResponse(
        billingStatus: 'ACTIVE',
        paymentProvider: 'stripe',
        hasStripeCustomer: true,
        hasStripeSubscription: true,
        paidSeatCount: 2,
        activeUserCount: 2,
        paidUntil: null,
      );

    await tester.pumpWidget(await _hostWithApi(api, const SettingsPage()));
    await tester.pumpAndSettle();

    expect(find.text('Settings'), findsOneWidget);
    await tester.drag(find.byType(ListView), const Offset(0, -500));
    await tester.pumpAndSettle();

    expect(find.text('Billing'), findsOneWidget);
    expect(find.text('Manage billing'), findsOneWidget);
  });

  test('route guard redirects unauthenticated users to login', () {
    final redirect = buildPulseRedirect(
      isAuthenticated: false,
      role: null,
      uri: Uri.parse('/workpoints/abc'),
    );

    expect(redirect, '/login?redirect=%2Fworkpoints%2Fabc');
  });

  test('route guard allows attendance participant routes for leaders', () {
    final documentsRedirect = buildPulseRedirect(
      isAuthenticated: true,
      role: UserRole.leader,
      uri: Uri.parse('/documents'),
    );
    final scanRedirect = buildPulseRedirect(
      isAuthenticated: true,
      role: UserRole.leader,
      uri: Uri.parse('/scan'),
    );

    expect(documentsRedirect, isNull);
    expect(scanRedirect, isNull);
  });

  test(
    'route guard allows the shared leave calendar for workers and leaders',
    () {
      expect(
        buildPulseRedirect(
          isAuthenticated: true,
          role: UserRole.worker,
          uri: Uri.parse('/leave-calendar'),
        ),
        isNull,
      );
      expect(
        buildPulseRedirect(
          isAuthenticated: true,
          role: UserRole.leader,
          uri: Uri.parse('/leave-calendar'),
        ),
        isNull,
      );
    },
  );

  test('route guard allows unauthenticated forgot password route', () {
    final redirect = buildPulseRedirect(
      isAuthenticated: false,
      role: null,
      uri: Uri.parse('/forgot-password'),
    );

    expect(redirect, isNull);
  });

  test('formatters and user model mirror web behavior', () {
    expect(formatHours(2.75), '2h 45min');
    expect(formatMoney(null), 'Not set');

    final user = User.fromJson({
      'id': 'u1',
      'username': 'worker',
      'email': 'worker@example.com',
      'role': 'WORKER',
    });
    expect(user.role, UserRole.worker);
  });

  test('leave date helpers count inclusive days and detect overlaps', () {
    expect(countInclusiveDays('2026-06-15', '2026-06-17'), 3);

    final request = LeaveRequest.fromJson({
      'id': 'leave-1',
      'userId': 'worker-1',
      'userName': 'worker',
      'userEmail': 'worker@example.com',
      'type': 'VACATION',
      'startDate': '2026-06-15',
      'endDate': '2026-06-20',
      'days': 6,
      'status': 'PENDING',
      'createdAt': '2026-05-27T10:00:00.000Z',
    });

    expect(
      selectedRangeOverlapsRequest(
        startDate: '2026-06-20',
        endDate: '2026-06-24',
        request: request,
      ),
      isTrue,
    );
    expect(
      selectedRangeOverlapsRequest(
        startDate: '2026-06-21',
        endDate: '2026-06-24',
        request: request,
      ),
      isFalse,
    );
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
  final attendanceMonitor = AttendanceLocationMonitorController(
    api: api,
    auth: auth,
  );
  final theme = ThemeController();
  final language = LanguageController(systemLocale: const Locale('en'));

  return AppScope(
    api: api,
    auth: auth,
    messaging: messaging,
    attendanceMonitor: attendanceMonitor,
    theme: theme,
    language: language,
    child: MaterialApp(home: child),
  );
}

Future<Widget> _hostWithApi(BuildPulseApi api, Widget child) async {
  final auth = AuthController(api);
  await auth.bootstrap();
  final messaging = MessagingController(api, auth);
  final attendanceMonitor = AttendanceLocationMonitorController(
    api: api,
    auth: auth,
  );
  final theme = ThemeController();
  final language = LanguageController(systemLocale: const Locale('en'));

  return AppScope(
    api: api,
    auth: auth,
    messaging: messaging,
    attendanceMonitor: attendanceMonitor,
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
  BillingStatusResponse billingStatusValue = const BillingStatusResponse(
    billingStatus: 'UNPAID',
    paymentProvider: null,
    hasStripeCustomer: false,
    hasStripeSubscription: false,
    paidSeatCount: 0,
    activeUserCount: 0,
    paidUntil: null,
  );
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
  Future<BillingStatusResponse> billingStatus() async => billingStatusValue;

  @override
  Future<void> requestPasswordReset(String email) async {}

  @override
  Future<MessagesPage> getMessages(
    String chatId, {
    String? cursor,
    int? limit,
  }) async {
    return messagesPageValue;
  }
}

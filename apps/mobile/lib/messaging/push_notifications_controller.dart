// ignore_for_file: prefer_initializing_formals

import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../auth/auth_controller.dart';
import '../core/api/buildpulse_api.dart';
import 'messaging_controller.dart';

const _messageChannel = AndroidNotificationChannel(
  'buildpulse_messages',
  'Strulix messages',
  description: 'Message notifications from Strulix conversations.',
  importance: Importance.high,
);

void _pushLog(String message) {
  debugPrint('[push] $message');
}

String _maskToken(String? token) {
  if (token == null || token.isEmpty) return '<none>';
  if (token.length <= 12) return token;
  return '${token.substring(0, 6)}...${token.substring(token.length - 6)}';
}

String _notificationSettingsSummary(NotificationSettings settings) {
  return 'authorization=${settings.authorizationStatus.name} '
      'alert=${settings.alert.name} '
      'badge=${settings.badge.name} '
      'sound=${settings.sound.name} '
      'announcement=${settings.announcement.name} '
      'carPlay=${settings.carPlay.name} '
      'criticalAlert=${settings.criticalAlert.name} '
      'lockScreen=${settings.lockScreen.name} '
      'notificationCenter=${settings.notificationCenter.name} '
      'showPreviews=${settings.showPreviews.name} '
      'timeSensitive=${settings.timeSensitive.name}';
}

String _messageSummary(RemoteMessage message) {
  final title = message.notification?.title ?? '';
  final body = message.notification?.body ?? '';
  return 'id=${message.messageId ?? '<none>'} '
      'from=${message.from ?? '<none>'} '
      'sent=${message.sentTime?.toIso8601String() ?? '<none>'} '
      'title="$title" body="$body" data=${message.data}';
}

@pragma('vm:entry-point')
Future<void> buildPulseFirebaseMessagingBackgroundHandler(
  RemoteMessage message,
) async {
  _pushLog('background message received ${_messageSummary(message)}');
  try {
    await Firebase.initializeApp();
    final app = Firebase.app();
    _pushLog(
      'background firebase initialized app=${app.name} '
      'project=${app.options.projectId} appId=${app.options.appId}',
    );
  } catch (_) {
    // Firebase may be unavailable in local builds without native config files.
  }
}

class PushNotificationsController with WidgetsBindingObserver {
  PushNotificationsController({
    required BuildPulseApi api,
    required AuthController auth,
    required MessagingController messaging,
  }) : _api = api,
       _auth = auth,
       _messaging = messaging {
    _auth.onBeforeLogout = unregisterCurrentDevice;
  }

  final BuildPulseApi _api;
  final AuthController _auth;
  final MessagingController _messaging;
  final _localNotifications = FlutterLocalNotificationsPlugin();

  StreamSubscription<RemoteMessage>? _messageSubscription;
  StreamSubscription<RemoteMessage>? _openedSubscription;
  StreamSubscription<String>? _tokenSubscription;
  Timer? _registrationRetryTimer;
  bool _isInitialized = false;
  String? _registeredToken;
  String? _pendingRegistrationToken;
  String? _pendingChatId;
  int _registrationRetryAttempt = 0;
  void Function(String chatId)? _onOpenChat;

  static const _registrationRetryDelays = [
    Duration(seconds: 2),
    Duration(seconds: 5),
    Duration(seconds: 15),
    Duration(seconds: 30),
    Duration(minutes: 1),
    Duration(minutes: 2),
  ];

  set onOpenChat(void Function(String chatId)? handler) {
    _onOpenChat = handler;
    final chatId = _pendingChatId;
    if (handler != null && chatId != null) {
      _pendingChatId = null;
      handler(chatId);
    }
  }

  Future<void> initialize() async {
    final platform = _platform;
    if (platform == null) {
      _pushLog('initialize skipped platform=<unsupported>');
      return;
    }
    _pushLog('initialize start platform=$platform');

    try {
      _pushLog('registering background message handler');
      FirebaseMessaging.onBackgroundMessage(
        buildPulseFirebaseMessagingBackgroundHandler,
      );
      _pushLog('initializing Firebase app');
      await Firebase.initializeApp();
      final app = Firebase.app();
      _pushLog(
        'firebase initialized app=${app.name} '
        'project=${app.options.projectId} appId=${app.options.appId}',
      );
      await _initializeLocalNotifications();
      await _requestPermissions();
      await FirebaseMessaging.instance
          .setForegroundNotificationPresentationOptions(
            alert: false,
            badge: true,
            sound: false,
          );
      _pushLog('foreground presentation options configured');

      _messageSubscription = FirebaseMessaging.onMessage.listen(
        _handleForegroundMessage,
      );
      _pushLog('foreground message listener attached');
      _openedSubscription = FirebaseMessaging.onMessageOpenedApp.listen(
        _handleNotificationOpen,
      );
      _pushLog('notification open listener attached');
      _tokenSubscription = FirebaseMessaging.instance.onTokenRefresh.listen((
        token,
      ) {
        _pushLog('FCM token refresh received token=${_maskToken(token)}');
        unawaited(_handleTokenRefresh(token));
      });
      _pushLog('token refresh listener attached');
      _auth.addListener(_handleAuthChanged);
      WidgetsBinding.instance.addObserver(this);
      _isInitialized = true;
      _pushLog('controller initialized auth=${_auth.isAuthenticated}');

      await _syncCurrentToken();
      final initialMessage = await FirebaseMessaging.instance
          .getInitialMessage();
      if (initialMessage != null) {
        _pushLog('initial launch message ${_messageSummary(initialMessage)}');
        _handleNotificationOpen(initialMessage);
      } else {
        _pushLog('initial launch message <none>');
      }
    } catch (error, stackTrace) {
      _pushLog('push notifications disabled error=$error');
      _pushLog('push notifications disabled stack=$stackTrace');
    }
  }

  Future<void> _initializeLocalNotifications() async {
    _pushLog('initializing local notifications');
    await _localNotifications
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.createNotificationChannel(_messageChannel);
    _pushLog('android notification channel ensured id=${_messageChannel.id}');

    await _localNotifications.initialize(
      const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
        iOS: DarwinInitializationSettings(),
      ),
      onDidReceiveNotificationResponse: (response) {
        final chatId = response.payload;
        _pushLog(
          'local notification opened '
          'payload=${response.payload} action=${response.actionId}',
        );
        if (chatId != null && chatId.isNotEmpty) _openChat(chatId);
      },
    );
    _pushLog('local notifications initialized');
  }

  Future<void> _requestPermissions() async {
    _pushLog('requesting notification permissions');
    final settings = await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    _pushLog(
      'firebase permission result ${_notificationSettingsSummary(settings)}',
    );
    final androidGranted = await _localNotifications
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.requestNotificationsPermission();
    _pushLog('android local notification permission granted=$androidGranted');
    await _logCurrentPermissionState('request');
    await _logApnsToken('permission');
  }

  Future<void> _syncCurrentToken() async {
    if (!_isInitialized || !_auth.isAuthenticated) {
      _pushLog(
        'sync token skipped initialized=$_isInitialized '
        'authenticated=${_auth.isAuthenticated}',
      );
      return;
    }
    _pushLog('syncing current tokens');
    try {
      await _logCurrentPermissionState('sync');
      await _logApnsToken('sync-before-getToken');
      final token = await FirebaseMessaging.instance.getToken();
      _pushLog('current FCM token=${_maskToken(token)}');
      if (token != null) {
        await _registerToken(token);
      } else {
        _pushLog('current FCM token is <none>');
      }
      await _logApnsToken('sync-after-getToken');
    } catch (error, stackTrace) {
      _pushLog('push token sync failed error=$error');
      _pushLog('push token sync failed stack=$stackTrace');
    }
  }

  Future<bool> _registerToken(String token) async {
    final platform = _platform;
    if (!_auth.isAuthenticated || platform == null) {
      _pushLog(
        'register token deferred platform=$platform '
        'authenticated=${_auth.isAuthenticated} token=${_maskToken(token)}',
      );
      _pendingRegistrationToken = token;
      return false;
    }
    _pendingRegistrationToken = token;
    _registrationRetryTimer?.cancel();
    _pushLog(
      'registering push device platform=$platform '
      'user=${_auth.user?.id ?? '<none>'} token=${_maskToken(token)}',
    );
    try {
      await _api.registerPushDevice(token: token, platform: platform);
      _registeredToken = token;
      if (_pendingRegistrationToken == token) {
        _pendingRegistrationToken = null;
      }
      _registrationRetryAttempt = 0;
      _pushLog('push device registered token=${_maskToken(token)}');
      return true;
    } catch (error, stackTrace) {
      _pushLog('push device registration failed error=$error');
      _pushLog('push device registration failed stack=$stackTrace');
      _scheduleRegistrationRetry();
      return false;
    }
  }

  Future<void> _handleTokenRefresh(String token) async {
    _pushLog(
      'handling token refresh old=${_maskToken(_registeredToken)} '
      'new=${_maskToken(token)}',
    );
    final previousToken = _registeredToken;
    final registered = await _registerToken(token);
    if (!registered || previousToken == null || previousToken == token) return;
    try {
      await _api.unregisterPushDevice(previousToken);
      _pushLog(
        'old push device unregistered token=${_maskToken(previousToken)}',
      );
    } catch (error, stackTrace) {
      _pushLog('old push device unregister failed error=$error');
      _pushLog('old push device unregister failed stack=$stackTrace');
    }
  }

  void _scheduleRegistrationRetry() {
    final token = _pendingRegistrationToken;
    if (!_auth.isAuthenticated || token == null) {
      _pushLog(
        'registration retry skipped authenticated=${_auth.isAuthenticated} '
        'token=${_maskToken(token)}',
      );
      return;
    }

    _registrationRetryTimer?.cancel();
    final index = _registrationRetryAttempt
        .clamp(0, _registrationRetryDelays.length - 1)
        .toInt();
    final delay = _registrationRetryDelays[index];
    _registrationRetryAttempt += 1;
    _pushLog(
      'scheduling registration retry attempt=$_registrationRetryAttempt '
      'delay=${delay.inSeconds}s token=${_maskToken(token)}',
    );
    _registrationRetryTimer = Timer(delay, () {
      _pushLog(
        'running registration retry attempt=$_registrationRetryAttempt '
        'token=${_maskToken(token)}',
      );
      unawaited(_registerToken(token));
    });
  }

  Future<void> unregisterCurrentDevice() async {
    _pushLog(
      'unregister current device start registered=${_maskToken(_registeredToken)}',
    );
    _registrationRetryTimer?.cancel();
    _pendingRegistrationToken = null;
    _registrationRetryAttempt = 0;
    final token = _registeredToken ?? await _safeCurrentToken();
    if (token == null) {
      _pushLog('unregister current device skipped token=<none>');
      return;
    }
    await _api.unregisterPushDevice(token);
    if (_registeredToken == token) _registeredToken = null;
    _pushLog('current device unregistered token=${_maskToken(token)}');
  }

  Future<String?> _safeCurrentToken() async {
    if (!_isInitialized) return null;
    try {
      return FirebaseMessaging.instance.getToken();
    } catch (_) {
      return null;
    }
  }

  void _handleAuthChanged() {
    if (!_isInitialized) return;
    _pushLog(
      'auth changed authenticated=${_auth.isAuthenticated} '
      'user=${_auth.user?.id ?? '<none>'}',
    );
    if (_auth.isAuthenticated) {
      unawaited(_syncCurrentToken());
      _refreshMessagingState();
    } else {
      _registrationRetryTimer?.cancel();
      _pendingRegistrationToken = null;
      _registrationRetryAttempt = 0;
    }
  }

  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    _pushLog('foreground message ${_messageSummary(message)}');
    if (message.data['type'] != 'message') return;
    _refreshMessagingState();
    final chatId = message.data['chatId']?.toString();
    if (chatId == null || chatId == _messaging.activeChatId) {
      _pushLog(
        'foreground message will not show local notification '
        'chatId=$chatId activeChat=${_messaging.activeChatId}',
      );
      return;
    }

    final notification = message.notification;
    await _localNotifications.show(
      message.hashCode,
      notification?.title ?? 'Strulix',
      notification?.body ?? 'New message',
      NotificationDetails(
        android: AndroidNotificationDetails(
          _messageChannel.id,
          _messageChannel.name,
          channelDescription: _messageChannel.description,
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: const DarwinNotificationDetails(),
      ),
      payload: chatId,
    );
    _pushLog('foreground local notification shown chatId=$chatId');
  }

  void _handleNotificationOpen(RemoteMessage message) {
    _pushLog('notification opened ${_messageSummary(message)}');
    if (message.data['type'] != 'message') return;
    final chatId = message.data['chatId']?.toString();
    if (chatId == null || chatId.isEmpty) {
      _pushLog('notification open ignored chatId=<empty>');
      return;
    }
    _openChat(chatId);
  }

  void _openChat(String chatId) {
    _pushLog('open chat requested chatId=$chatId');
    final handler = _onOpenChat;
    if (handler == null) {
      _pushLog('open chat deferred chatId=$chatId');
      _pendingChatId = chatId;
      return;
    }
    _pushLog('open chat dispatched chatId=$chatId');
    handler(chatId);
  }

  void _refreshMessagingState() {
    if (!_auth.isAuthenticated) return;
    unawaited(_refreshMessagingStateNow());
  }

  Future<void> _refreshMessagingStateNow() async {
    try {
      await _messaging.loadChats();
      _pushLog('messaging state refreshed after push');
    } catch (error, stackTrace) {
      _pushLog('messaging refresh after push failed error=$error');
      _pushLog('messaging refresh after push failed stack=$stackTrace');
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    _pushLog('lifecycle state=$state');
    if (!_isInitialized || state != AppLifecycleState.resumed) return;
    unawaited(_syncCurrentToken());
    _refreshMessagingState();
  }

  String? get _platform {
    if (kIsWeb) return null;
    return switch (defaultTargetPlatform) {
      TargetPlatform.android => 'android',
      TargetPlatform.iOS => 'ios',
      _ => null,
    };
  }

  Future<void> dispose() async {
    _pushLog('disposing push notifications controller');
    WidgetsBinding.instance.removeObserver(this);
    _auth.removeListener(_handleAuthChanged);
    if (_auth.onBeforeLogout == unregisterCurrentDevice) {
      _auth.onBeforeLogout = null;
    }
    await _messageSubscription?.cancel();
    await _openedSubscription?.cancel();
    await _tokenSubscription?.cancel();
    _registrationRetryTimer?.cancel();
  }

  Future<void> _logCurrentPermissionState(String reason) async {
    try {
      final settings = await FirebaseMessaging.instance
          .getNotificationSettings();
      _pushLog(
        'notification settings reason=$reason '
        '${_notificationSettingsSummary(settings)}',
      );
    } catch (error) {
      _pushLog('notification settings read failed reason=$reason error=$error');
    }
  }

  Future<void> _logApnsToken(String reason) async {
    if (_platform != 'ios') return;
    try {
      final token = await FirebaseMessaging.instance.getAPNSToken();
      _pushLog('APNs token reason=$reason token=${_maskToken(token)}');
    } catch (error) {
      _pushLog('APNs token read failed reason=$reason error=$error');
    }
  }
}

// ignore_for_file: prefer_initializing_formals

import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../auth/auth_controller.dart';
import '../core/api/buildpulse_api.dart';
import 'messaging_controller.dart';

const _messageChannel = AndroidNotificationChannel(
  'buildpulse_messages',
  'BuildPulse messages',
  description: 'Message notifications from BuildPulse conversations.',
  importance: Importance.high,
);

@pragma('vm:entry-point')
Future<void> buildPulseFirebaseMessagingBackgroundHandler(
  RemoteMessage message,
) async {
  try {
    await Firebase.initializeApp();
  } catch (_) {
    // Firebase may be unavailable in local builds without native config files.
  }
}

class PushNotificationsController {
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
  bool _isInitialized = false;
  String? _registeredToken;
  String? _pendingChatId;
  void Function(String chatId)? _onOpenChat;

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
    if (platform == null) return;

    try {
      FirebaseMessaging.onBackgroundMessage(
        buildPulseFirebaseMessagingBackgroundHandler,
      );
      await Firebase.initializeApp();
      await _initializeLocalNotifications();
      await _requestPermissions();
      await FirebaseMessaging.instance.setForegroundNotificationPresentationOptions(
        alert: false,
        badge: true,
        sound: false,
      );

      _messageSubscription = FirebaseMessaging.onMessage.listen(
        _handleForegroundMessage,
      );
      _openedSubscription = FirebaseMessaging.onMessageOpenedApp.listen(
        _handleNotificationOpen,
      );
      _tokenSubscription = FirebaseMessaging.instance.onTokenRefresh.listen(
        (token) => _registerToken(token),
      );
      _auth.addListener(_handleAuthChanged);
      _isInitialized = true;

      await _syncCurrentToken();
      final initialMessage = await FirebaseMessaging.instance.getInitialMessage();
      if (initialMessage != null) _handleNotificationOpen(initialMessage);
    } catch (error) {
      debugPrint('Push notifications disabled: $error');
    }
  }

  Future<void> _initializeLocalNotifications() async {
    await _localNotifications
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.createNotificationChannel(_messageChannel);

    await _localNotifications.initialize(
      const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
        iOS: DarwinInitializationSettings(),
      ),
      onDidReceiveNotificationResponse: (response) {
        final chatId = response.payload;
        if (chatId != null && chatId.isNotEmpty) _openChat(chatId);
      },
    );
  }

  Future<void> _requestPermissions() async {
    await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    await _localNotifications
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.requestNotificationsPermission();
  }

  Future<void> _syncCurrentToken() async {
    if (!_isInitialized || !_auth.isAuthenticated) return;
    final token = await FirebaseMessaging.instance.getToken();
    if (token != null) await _registerToken(token);
  }

  Future<void> _registerToken(String token) async {
    final platform = _platform;
    if (!_auth.isAuthenticated || platform == null) return;
    await _api.registerPushDevice(token: token, platform: platform);
    _registeredToken = token;
  }

  Future<void> unregisterCurrentDevice() async {
    final token = _registeredToken ?? await _safeCurrentToken();
    if (token == null) return;
    await _api.unregisterPushDevice(token);
    if (_registeredToken == token) _registeredToken = null;
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
    if (_auth.isAuthenticated) {
      unawaited(_syncCurrentToken());
    }
  }

  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    if (message.data['type'] != 'message') return;
    final chatId = message.data['chatId']?.toString();
    if (chatId == null || chatId == _messaging.activeChatId) return;

    final notification = message.notification;
    await _localNotifications.show(
      message.hashCode,
      notification?.title ?? 'BuildPulse',
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
  }

  void _handleNotificationOpen(RemoteMessage message) {
    if (message.data['type'] != 'message') return;
    final chatId = message.data['chatId']?.toString();
    if (chatId == null || chatId.isEmpty) return;
    _openChat(chatId);
  }

  void _openChat(String chatId) {
    final handler = _onOpenChat;
    if (handler == null) {
      _pendingChatId = chatId;
      return;
    }
    handler(chatId);
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
    _auth.removeListener(_handleAuthChanged);
    if (_auth.onBeforeLogout == unregisterCurrentDevice) {
      _auth.onBeforeLogout = null;
    }
    await _messageSubscription?.cancel();
    await _openedSubscription?.cancel();
    await _tokenSubscription?.cancel();
  }
}

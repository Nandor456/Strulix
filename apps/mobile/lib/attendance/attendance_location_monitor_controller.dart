// ignore_for_file: prefer_initializing_formals

import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:geolocator/geolocator.dart';
import 'package:path_provider/path_provider.dart';

import '../auth/auth_controller.dart';
import '../core/api/buildpulse_api.dart';
import '../core/models.dart';

class AttendanceLocationMonitorController with WidgetsBindingObserver {
  AttendanceLocationMonitorController({
    required BuildPulseApi api,
    required AuthController auth,
  }) : _api = api,
       _auth = auth;

  final BuildPulseApi _api;
  final AuthController _auth;

  Timer? _timer;
  File? _queueFile;
  List<OpenAttendanceMonitoring> _openAttendances = const [];
  final List<_QueuedLocationCheck> _queue = [];
  final Set<String> _submittedDueKeys = {};
  bool _isSyncing = false;
  bool _isInitialized = false;

  Future<void> initialize() async {
    if (_isInitialized || kIsWeb) return;
    _isInitialized = true;
    WidgetsBinding.instance.addObserver(this);
    _auth.addListener(_handleAuthChanged);
    final supportDir = await getApplicationSupportDirectory();
    _queueFile = File('${supportDir.path}/attendance_location_queue.json');
    await _loadQueue();
    if (_auth.isAttendanceParticipant) {
      unawaited(syncOpenAttendances());
    }
  }

  Future<void> syncOpenAttendances() async {
    if (!_auth.isAttendanceParticipant) {
      await _stop(clearQueue: !_auth.isAuthenticated);
      return;
    }
    if (_isSyncing) return;
    _isSyncing = true;
    try {
      _openAttendances = await _api.listOpenAttendances();
      await _flushQueue();
      _scheduleNext();
    } catch (_) {
      _scheduleNext(fallback: const Duration(minutes: 5));
    } finally {
      _isSyncing = false;
    }
  }

  Future<void> handleCheckInResult(ScanResult result) async {
    if (result.event != 'CHECK_IN') return;
    await syncOpenAttendances();
  }

  void _handleAuthChanged() {
    if (_auth.isAttendanceParticipant) {
      unawaited(syncOpenAttendances());
    } else {
      unawaited(_stop(clearQueue: !_auth.isAuthenticated));
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && _auth.isAttendanceParticipant) {
      unawaited(syncOpenAttendances());
    }
  }

  Future<void> _stop({required bool clearQueue}) async {
    _timer?.cancel();
    _timer = null;
    _openAttendances = const [];
    _submittedDueKeys.clear();
    if (clearQueue) {
      _queue.clear();
      await _saveQueue();
    }
  }

  void _scheduleNext({Duration? fallback}) {
    _timer?.cancel();
    if (!_auth.isAttendanceParticipant) return;
    if (fallback != null) {
      _timer = Timer(fallback, () => unawaited(syncOpenAttendances()));
      return;
    }

    final now = DateTime.now().toUtc();
    DateTime? nextDue;
    for (final attendance in _activeAttendances) {
      final dueAt = _checkpointDueForNow(attendance, now);
      if (nextDue == null || dueAt.isBefore(nextDue)) nextDue = dueAt;
    }

    if (nextDue == null) return;
    final delay = nextDue.isAfter(now)
        ? nextDue.difference(now)
        : const Duration(seconds: 1);
    _timer = Timer(delay, () => unawaited(_runDueChecks()));
  }

  Iterable<OpenAttendanceMonitoring> get _activeAttendances {
    return _openAttendances.where(
      (attendance) => attendance.monitoringStatus == 'ACTIVE',
    );
  }

  DateTime _checkpointDueForNow(
    OpenAttendanceMonitoring attendance,
    DateTime now,
  ) {
    final checkedInAt = DateTime.parse(attendance.checkedInAt).toUtc();
    final interval = Duration(
      minutes: attendance.intervalMinutes <= 0
          ? 60
          : attendance.intervalMinutes,
    );
    final grace = Duration(
      minutes: attendance.graceMinutes <= 0 ? 15 : attendance.graceMinutes,
    );
    final elapsed = now.difference(checkedInAt);
    if (elapsed < interval) return checkedInAt.add(interval);

    final completedIntervals =
        elapsed.inMilliseconds ~/ interval.inMilliseconds;
    var dueAt = checkedInAt.add(interval * completedIntervals);
    if (now.isAfter(dueAt.add(grace))) dueAt = dueAt.add(interval);
    return dueAt;
  }

  Future<void> _runDueChecks() async {
    final now = DateTime.now().toUtc();
    for (final attendance in _activeAttendances) {
      final dueAt = _checkpointDueForNow(attendance, now);
      final grace = Duration(
        minutes: attendance.graceMinutes <= 0 ? 15 : attendance.graceMinutes,
      );
      if (now.isBefore(dueAt) || now.isAfter(dueAt.add(grace))) continue;
      final dueKey = '${attendance.attendanceId}:${dueAt.toIso8601String()}';
      if (_submittedDueKeys.contains(dueKey)) continue;
      await _captureAndSubmit(attendance, dueAt, dueKey);
    }
    await _flushQueue();
    _scheduleNext();
  }

  Future<void> _captureAndSubmit(
    OpenAttendanceMonitoring attendance,
    DateTime dueAt,
    String dueKey,
  ) async {
    if (!await _ensureLocationPermission()) return;
    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: _locationSettings(),
      );
      final capturedAt = DateTime.now().toUtc();
      final sample = _QueuedLocationCheck(
        attendanceId: attendance.attendanceId,
        dueAt: dueAt.toIso8601String(),
        capturedAt: capturedAt.toIso8601String(),
        lat: position.latitude,
        lng: position.longitude,
      );
      await _submitOrQueue(sample);
      _submittedDueKeys.add(dueKey);
    } catch (_) {
      // The backend will create a missed-check alert if no valid sample arrives.
    }
  }

  LocationSettings _locationSettings() {
    if (defaultTargetPlatform == TargetPlatform.android) {
      return AndroidSettings(
        accuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 20),
        foregroundNotificationConfig: const ForegroundNotificationConfig(
          notificationTitle: 'Strulix attendance monitoring',
          notificationText: 'Submitting hourly workpoint location checks.',
          notificationChannelName: 'Attendance monitoring',
          enableWakeLock: true,
          setOngoing: true,
        ),
      );
    }
    if (defaultTargetPlatform == TargetPlatform.iOS) {
      return AppleSettings(
        accuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 20),
        activityType: ActivityType.other,
        allowBackgroundLocationUpdates: true,
        showBackgroundLocationIndicator: true,
      );
    }
    return const LocationSettings(
      accuracy: LocationAccuracy.high,
      timeLimit: Duration(seconds: 20),
    );
  }

  Future<bool> _ensureLocationPermission() async {
    if (!await Geolocator.isLocationServiceEnabled()) return false;
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.whileInUse) {
      permission = await Geolocator.requestPermission();
    }
    return permission == LocationPermission.always ||
        permission == LocationPermission.whileInUse;
  }

  Future<void> _submitOrQueue(_QueuedLocationCheck sample) async {
    try {
      await _api.recordAttendanceLocationCheck(
        attendanceId: sample.attendanceId,
        dueAt: sample.dueAt,
        capturedAt: sample.capturedAt,
        lat: sample.lat,
        lng: sample.lng,
      );
    } catch (_) {
      _queue.add(sample);
      await _saveQueue();
    }
  }

  Future<void> _flushQueue() async {
    if (_queue.isEmpty) return;
    final pending = List<_QueuedLocationCheck>.from(_queue);
    _queue.clear();
    for (final sample in pending) {
      try {
        await _api.recordAttendanceLocationCheck(
          attendanceId: sample.attendanceId,
          dueAt: sample.dueAt,
          capturedAt: sample.capturedAt,
          lat: sample.lat,
          lng: sample.lng,
        );
      } catch (_) {
        _queue.add(sample);
      }
    }
    await _saveQueue();
  }

  Future<void> _loadQueue() async {
    final file = _queueFile;
    if (file == null || !await file.exists()) return;
    try {
      final raw = jsonDecode(await file.readAsString());
      if (raw is! List) return;
      _queue
        ..clear()
        ..addAll(
          raw
              .whereType<Map>()
              .map((item) => _QueuedLocationCheck.fromJson(item))
              .whereType<_QueuedLocationCheck>(),
        );
    } catch (_) {
      _queue.clear();
    }
  }

  Future<void> _saveQueue() async {
    final file = _queueFile;
    if (file == null) return;
    await file.writeAsString(
      jsonEncode(_queue.map((sample) => sample.toJson()).toList()),
    );
  }

  Future<void> dispose() async {
    WidgetsBinding.instance.removeObserver(this);
    _auth.removeListener(_handleAuthChanged);
    _timer?.cancel();
    await _saveQueue();
  }
}

class _QueuedLocationCheck {
  const _QueuedLocationCheck({
    required this.attendanceId,
    required this.dueAt,
    required this.capturedAt,
    required this.lat,
    required this.lng,
  });

  final String attendanceId;
  final String dueAt;
  final String capturedAt;
  final double lat;
  final double lng;

  static _QueuedLocationCheck? fromJson(Map<dynamic, dynamic> json) {
    final attendanceId = json['attendanceId']?.toString();
    final dueAt = json['dueAt']?.toString();
    final capturedAt = json['capturedAt']?.toString();
    final lat = (json['lat'] as num?)?.toDouble();
    final lng = (json['lng'] as num?)?.toDouble();
    if (attendanceId == null ||
        dueAt == null ||
        capturedAt == null ||
        lat == null ||
        lng == null) {
      return null;
    }
    return _QueuedLocationCheck(
      attendanceId: attendanceId,
      dueAt: dueAt,
      capturedAt: capturedAt,
      lat: lat,
      lng: lng,
    );
  }

  Map<String, dynamic> toJson() => {
    'attendanceId': attendanceId,
    'dueAt': dueAt,
    'capturedAt': capturedAt,
    'lat': lat,
    'lng': lng,
  };
}

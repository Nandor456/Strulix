import 'dart:async';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';

import '../core/app_scope.dart';
import '../core/formatters.dart';
import '../core/i18n.dart';
import '../core/models.dart';
import '../core/widgets.dart';

class CheckinPage extends StatefulWidget {
  const CheckinPage({required this.qrToken, super.key});

  final String qrToken;

  @override
  State<CheckinPage> createState() => _CheckinPageState();
}

class _CheckinPageState extends State<CheckinPage> {
  bool _isLoading = true;
  String? _error;
  ScanResult? _result;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _scan());
  }

  Future<void> _scan() async {
    final l10n = context.l10n;
    if (widget.qrToken.isEmpty) {
      setState(() {
        _isLoading = false;
        _error = l10n.t('Invalid QR code.');
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
      _result = null;
    });

    try {
      final api = AppScope.apiOf(context);
      final position = await _currentPosition();
      final result = await api.checkin(
        widget.qrToken,
        lat: position.latitude,
        lng: position.longitude,
      );
      if (mounted) setState(() => _result = result);
    } catch (error) {
      if (mounted) setState(() => _error = _scanErrorMessage(error));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<Position> _currentPosition() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw _LocationScanException(
        translate('Turn on location services to scan attendance.'),
      );
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.denied) {
      throw _LocationScanException(
        translate('Allow location access to scan attendance.'),
      );
    }

    if (permission == LocationPermission.deniedForever) {
      throw _LocationScanException(
        translate(
          'Location access is blocked. Enable it in device settings to scan attendance.',
        ),
      );
    }

    return Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        timeLimit: Duration(seconds: 12),
      ),
    );
  }

  String _scanErrorMessage(Object error) {
    if (error is _LocationScanException) return error.message;
    if (error is TimeoutException) {
      return translate(
        'Location timed out. Move somewhere with a clearer signal and try again.',
      );
    }
    if (error is LocationServiceDisabledException) {
      return translate('Turn on location services to scan attendance.');
    }
    if (error is PermissionDeniedException) {
      return translate('Allow location access to scan attendance.');
    }
    return errorMessage(error, 'Unable to record attendance.');
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final result = _result;
    final icon = _error != null
        ? Icons.cancel_outlined
        : result != null
        ? Icons.check_circle_outline
        : Icons.schedule;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.t('Attendance scan')),
        actions: const [AppLanguageMenuButton()],
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 440),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      icon,
                      size: 52,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      l10n.t('Attendance scan'),
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _isLoading
                          ? l10n.t('Recording attendance...')
                          : result?.workPointName ?? l10n.t('Scan result'),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 20),
                    if (_isLoading)
                      const LoadingView()
                    else if (_error != null) ...[
                      ErrorBanner(_error!),
                      const SizedBox(height: 12),
                      FilledButton.icon(
                        onPressed: () => context.go('/scan'),
                        icon: const Icon(Icons.refresh),
                        label: Text(l10n.t('Try again')),
                      ),
                    ] else if (result != null) ...[
                      _ResultDetails(result: result),
                      const SizedBox(height: 16),
                      FilledButton(
                        onPressed: () => context.go('/messages'),
                        child: Text(l10n.t('Done')),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _LocationScanException implements Exception {
  _LocationScanException(this.message);

  final String message;
}

class _ResultDetails extends StatelessWidget {
  const _ResultDetails({required this.result});

  final ScanResult result;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final label = switch (result.event) {
      'CHECK_IN' => l10n.t('Checked in'),
      'CHECK_OUT' => l10n.t('Checked out'),
      'ALREADY_COMPLETED' => l10n.t('Already completed today'),
      _ => result.event,
    };

    return Column(
      children: [
        Chip(label: Text(label)),
        const SizedBox(height: 12),
        _DetailRow(label: l10n.t('Workpoint'), value: result.workPointName),
        _DetailRow(label: l10n.t('Date'), value: formatDate(result.date)),
        _DetailRow(
          label: l10n.t('Checked in'),
          value: formatDateTime(result.checkedInAt),
        ),
        if (result.isCompleted) ...[
          _DetailRow(
            label: l10n.t('Checked out'),
            value: formatDateTime(result.checkedOutAt),
          ),
          _DetailRow(label: l10n.t('Hours'), value: formatHours(result.hours)),
          _DetailRow(
            label: l10n.t('Earnings'),
            value: formatMoney(result.earnings),
          ),
        ],
        if (result.checkoutSource == 'AUTO') ...[
          const SizedBox(height: 8),
          ErrorBanner(
            l10n.t(
              'This attendance was automatically closed at 22:00 and may need review.',
            ),
          ),
        ],
      ],
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(
            child: Text(label, style: Theme.of(context).textTheme.bodySmall),
          ),
          const SizedBox(width: 12),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

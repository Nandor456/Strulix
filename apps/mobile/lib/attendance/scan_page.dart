import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../core/i18n.dart';

class ScanPage extends StatefulWidget {
  const ScanPage({super.key});

  @override
  State<ScanPage> createState() => _ScanPageState();
}

class _ScanPageState extends State<ScanPage> {
  final MobileScannerController _controller = MobileScannerController(
    formats: const [BarcodeFormat.qrCode],
  );
  bool _isHandlingScan = false;
  String? _error;

  @override
  void dispose() {
    unawaited(_controller.dispose());
    super.dispose();
  }

  Future<void> _handleDetection(BarcodeCapture capture) async {
    if (_isHandlingScan) return;

    final rawValue = capture.barcodes
        .map((barcode) => barcode.rawValue)
        .whereType<String>()
        .firstWhere((value) => value.trim().isNotEmpty, orElse: () => '');
    final qrToken = _extractQrToken(rawValue);

    if (qrToken == null) {
      if (mounted) {
        setState(() => _error = translate('Scan a BuildPulse attendance QR code.'));
      }
      return;
    }

    _isHandlingScan = true;
    await _controller.stop();
    if (mounted) context.go('/checkin/$qrToken');
  }

  String? _extractQrToken(String value) {
    final trimmed = value.trim();
    final uuidPattern = RegExp(
      r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
    );
    if (uuidPattern.hasMatch(trimmed)) return trimmed;

    final uri = Uri.tryParse(trimmed);
    if (uri == null) return null;

    final checkinIndex = uri.pathSegments.indexOf('checkin');
    if (checkinIndex == -1 || checkinIndex + 1 >= uri.pathSegments.length) {
      return null;
    }

    final token = uri.pathSegments[checkinIndex + 1];
    return uuidPattern.hasMatch(token) ? token : null;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.t('Scan attendance')),
        actions: const [AppLanguageMenuButton()],
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          MobileScanner(controller: _controller, onDetect: _handleDetection),
          IgnorePointer(
            child: Center(
              child: Container(
                width: 260,
                height: 260,
                decoration: BoxDecoration(
                  border: Border.all(
                    color: Theme.of(context).colorScheme.primary,
                    width: 3,
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
          ),
          Positioned(
            left: 16,
            right: 16,
            bottom: 24,
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      l10n.t('Place the attendance QR code inside the frame.'),
                      textAlign: TextAlign.center,
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        _error!,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.error,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

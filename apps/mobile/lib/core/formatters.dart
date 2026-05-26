import 'package:intl/intl.dart';

import 'attendance_math.dart';

String _activeLocale = 'en';
String Function(String key, [Map<String, String>? params]) _translate =
    _defaultTranslate;

String _defaultTranslate(String key, [Map<String, String>? params]) {
  if (params == null || params.isEmpty) return key;
  var result = key;
  for (final entry in params.entries) {
    result = result.replaceAll('{${entry.key}}', entry.value);
  }
  return result;
}

void configureFormatters({
  required String locale,
  required String Function(String key, [Map<String, String>? params]) translate,
}) {
  _activeLocale = locale;
  _translate = translate;
}

String formatDate(String? value) {
  if (value == null || value.isEmpty) return _translate('Pending');
  final date = DateTime.tryParse(value);
  if (date == null) return _translate('Invalid date');
  return DateFormat('dd MMM yyyy', _activeLocale).format(date.toLocal());
}

String formatDateTime(String? value) {
  if (value == null || value.isEmpty) return _translate('Open');
  final date = DateTime.tryParse(value);
  if (date == null) return _translate('Invalid date');
  return DateFormat('dd MMM HH:mm', _activeLocale).format(date.toLocal());
}

String formatMonthLabel(int year, int month) {
  return DateFormat('MMMM yyyy', _activeLocale).format(DateTime(year, month));
}

String formatHours(num? value) {
  if (value == null) return '0h';
  final hours = roundToQuarterHours(value);
  return '${NumberFormat.decimalPattern(_activeLocale).format(hours)}h';
}

String formatMoney(num? value, {bool precise = false}) {
  if (value == null) return _translate('Not set');
  return NumberFormat.currency(
    locale: _activeLocale,
    symbol: 'RON',
    decimalDigits: precise ? 2 : 0,
  ).format(value);
}

String formatFileSize(num? value) {
  if (value == null) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  var size = value.toDouble();
  var index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  final digits = index == 0 ? 0 : 1;
  return '${size.toStringAsFixed(digits)} ${units[index]}';
}

String currentPeriod() {
  final now = DateTime.now();
  return '${now.year}-${now.month.toString().padLeft(2, '0')}';
}

(int, int) parsePeriod(String period) {
  final parts = period.split('-');
  if (parts.length != 2) {
    final now = DateTime.now();
    return (now.year, now.month);
  }
  final year = int.tryParse(parts[0]);
  final month = int.tryParse(parts[1]);
  if (year == null || month == null || month < 1 || month > 12) {
    final now = DateTime.now();
    return (now.year, now.month);
  }
  return (year, month);
}

({String from, String to}) monthBounds(String period) {
  final (year, month) = parsePeriod(period);
  final lastDay = DateTime(year, month + 1, 0).day;
  final paddedMonth = month.toString().padLeft(2, '0');
  return (
    from: '$year-$paddedMonth-01',
    to: '$year-$paddedMonth-${lastDay.toString().padLeft(2, '0')}',
  );
}

String periodAfter(String period, int deltaMonths) {
  final (year, month) = parsePeriod(period);
  final next = DateTime(year, month + deltaMonths);
  return '${next.year}-${next.month.toString().padLeft(2, '0')}';
}

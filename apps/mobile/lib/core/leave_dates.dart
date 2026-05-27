import 'models.dart';

class CalendarDay {
  const CalendarDay({
    required this.date,
    required this.dateKey,
    required this.dayNumber,
    required this.isCurrentMonth,
  });

  final DateTime date;
  final String dateKey;
  final int dayNumber;
  final bool isCurrentMonth;
}

String dateKey(DateTime date) {
  return '${date.year.toString().padLeft(4, '0')}-'
      '${date.month.toString().padLeft(2, '0')}-'
      '${date.day.toString().padLeft(2, '0')}';
}

DateTime parseDateKey(String value) {
  final parts = value.split('-');
  if (parts.length != 3) return DateTime.now();
  final year = int.tryParse(parts[0]) ?? DateTime.now().year;
  final month = int.tryParse(parts[1]) ?? DateTime.now().month;
  final day = int.tryParse(parts[2]) ?? DateTime.now().day;
  return DateTime(year, month, day);
}

String todayKey() => dateKey(DateTime.now());

DateTime monthAfterDate(DateTime date, int deltaMonths) {
  return DateTime(date.year, date.month + deltaMonths);
}

List<CalendarDay> buildMonthGrid(DateTime monthDate) {
  final firstOfMonth = DateTime(monthDate.year, monthDate.month);
  final mondayOffset = firstOfMonth.weekday - DateTime.monday;
  final firstGridDay = firstOfMonth.subtract(Duration(days: mondayOffset));

  return List.generate(42, (index) {
    final date = firstGridDay.add(Duration(days: index));
    return CalendarDay(
      date: date,
      dateKey: dateKey(date),
      dayNumber: date.day,
      isCurrentMonth: date.month == monthDate.month,
    );
  });
}

bool isDateInRange(String value, String? startDate, String? endDate) {
  if (startDate == null || endDate == null) return false;
  return value.compareTo(startDate) >= 0 && value.compareTo(endDate) <= 0;
}

int countInclusiveDays(String startDate, String endDate) {
  final start = parseDateKey(startDate);
  final end = parseDateKey(endDate);
  return end.difference(start).inDays + 1;
}

bool selectedRangeOverlapsRequest({
  required String startDate,
  required String endDate,
  required LeaveRequest request,
}) {
  return startDate.compareTo(request.endDate) <= 0 &&
      endDate.compareTo(request.startDate) >= 0;
}

List<LeaveRequest> leaveRequestsForDate(
  String value,
  List<LeaveRequest> requests,
) {
  return requests
      .where(
        (request) =>
            request.status != LeaveRequestStatus.rejected &&
            request.startDate.compareTo(value) <= 0 &&
            request.endDate.compareTo(value) >= 0,
      )
      .toList(growable: false);
}

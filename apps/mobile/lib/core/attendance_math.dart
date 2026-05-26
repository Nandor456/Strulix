const _quarterHourMs = Duration.millisecondsPerMinute * 15;

double roundToQuarterHours(num value) {
  return (value * 4).round() / 4;
}

double billableHoursBetween(DateTime checkedInAt, DateTime checkedOutAt) {
  final milliseconds = checkedOutAt.difference(checkedInAt).inMilliseconds;
  if (milliseconds <= 0) return 0;
  return (milliseconds / _quarterHourMs).round() / 4;
}

double? earningsForHours(num hours, num? hourlyWage) {
  if (hourlyWage == null) return null;
  return roundToQuarterHours(hours) * hourlyWage;
}

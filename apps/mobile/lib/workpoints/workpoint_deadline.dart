String workPointDeadlineToInput(String? value) {
  if (value == null || value.isEmpty) return '';
  final deadline = DateTime.tryParse(value);
  if (deadline == null) return '';
  return deadline.toLocal().toIso8601String().substring(0, 10);
}

String? workPointDeadlineToApi(String value) {
  if (value.isEmpty) return null;
  return DateTime.parse('${value}T00:00:00').toUtc().toIso8601String();
}

import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/workpoints/workpoint_deadline.dart';

void main() {
  test('deadline roundtrips between form input and API payload', () {
    const input = '2026-06-02';

    final apiValue = workPointDeadlineToApi(input);

    expect(apiValue, isNotNull);
    expect(apiValue, endsWith('Z'));
    expect(workPointDeadlineToInput(apiValue), input);
  });

  test('empty deadline stays empty', () {
    expect(workPointDeadlineToApi(''), isNull);
    expect(workPointDeadlineToInput(null), isEmpty);
    expect(workPointDeadlineToInput(''), isEmpty);
  });
}

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/attendance_math.dart';
import '../core/app_scope.dart';
import '../core/formatters.dart';
import '../core/i18n.dart';
import '../core/models.dart';
import '../core/widgets.dart';

class WorkerHomePage extends StatefulWidget {
  const WorkerHomePage({super.key});

  @override
  State<WorkerHomePage> createState() => _WorkerHomePageState();
}

class _WorkerHomePageState extends State<WorkerHomePage> {
  String _period = currentPeriod();
  bool _isLoading = true;
  String? _error;
  List<AssignedWorkPointSummary> _workPoints = const [];
  List<DailyStatRow> _rows = const [];
  MonthlySummary? _summary;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    final api = AppScope.apiOf(context);
    final (year, month) = parsePeriod(_period);
    try {
      final results = await Future.wait([
        api.listMyWorkPoints(),
        api.myDailyStats(year, month),
        api.myMonthlySummary(year, month),
      ]);
      setState(() {
        _workPoints = results[0] as List<AssignedWorkPointSummary>;
        _rows = results[1] as List<DailyStatRow>;
        _summary = results[2] as MonthlySummary;
      });
    } catch (error) {
      setState(
        () => _error = errorMessage(
          error,
          'Failed to load your worker dashboard.',
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final (year, month) = parsePeriod(_period);
    final summary = _summary;
    final hourlyWage = summary?.hourlyWage;
    final hasWage = hourlyWage != null;
    final openRecords =
        ((summary?.totalDays ?? 0) - (summary?.completeDays ?? 0)).clamp(
          0,
          9999,
        );

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SectionCard(
            title: l10n.t('Your BuildPulse home'),
            subtitle: l10n.t(
              'Attendance, hours, assigned workpoints, and wage-based earnings.',
            ),
            trailing: IconButton.outlined(
              tooltip: l10n.t('Refresh'),
              onPressed: _load,
              icon: const Icon(Icons.refresh),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    IconButton.filledTonal(
                      onPressed: () {
                        setState(() => _period = periodAfter(_period, -1));
                        _load();
                      },
                      icon: const Icon(Icons.chevron_left),
                    ),
                    Expanded(
                      child: Center(
                        child: Text(
                          formatMonthLabel(year, month),
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                      ),
                    ),
                    IconButton.filledTonal(
                      onPressed: () {
                        setState(() => _period = periodAfter(_period, 1));
                        _load();
                      },
                      icon: const Icon(Icons.chevron_right),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: () => context.go('/scan'),
                  icon: const Icon(Icons.qr_code_scanner),
                  label: Text(l10n.t('Scan attendance')),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          if (_isLoading)
            LoadingView(label: l10n.t('Loading dashboard...'))
          else if (_error != null)
            ErrorBanner(_error!)
          else ...[
            GridView.count(
              crossAxisCount: MediaQuery.sizeOf(context).width > 640 ? 3 : 2,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              childAspectRatio: 1.25,
              children: [
                StatTile(
                  label: l10n.t('Earnings'),
                  value: hasWage
                      ? formatMoney(
                          earningsForHours(
                            summary?.totalHours ?? 0,
                            hourlyWage,
                          ),
                          precise: true,
                        )
                      : l10n.t('Unavailable'),
                  icon: Icons.payments_outlined,
                  helper: hasWage
                      ? l10n.t('Completed attendances')
                      : l10n.t('Ask an admin to set your wage'),
                ),
                StatTile(
                  label: l10n.t('Hourly wage'),
                  value: formatMoney(summary?.hourlyWage, precise: true),
                  icon: Icons.price_check_outlined,
                  helper: l10n.t('Worker profile'),
                ),
                StatTile(
                  label: l10n.t('Hours'),
                  value: formatHours(summary?.totalHours),
                  icon: Icons.schedule,
                  helper: l10n.t('{count} complete days', {
                    'count': '${summary?.completeDays ?? 0}',
                  }),
                ),
                StatTile(
                  label: l10n.t('Days'),
                  value: '${summary?.totalDays ?? 0}',
                  icon: Icons.calendar_month_outlined,
                  helper: l10n.t('{count} complete', {
                    'count': '${summary?.completeDays ?? 0}',
                  }),
                ),
                StatTile(
                  label: l10n.t('Open records'),
                  value: '$openRecords',
                  icon: Icons.warning_amber_outlined,
                  helper: l10n.t('Missing checkout'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _AssignedWorkpoints(
              workPoints: _workPoints,
              rows: _rows,
              hasWage: hasWage,
              hourlyWage: hourlyWage,
            ),
            const SizedBox(height: 16),
            _AttendanceByWorkpoint(
              workPoints: _workPoints,
              rows: _rows,
              hasWage: hasWage,
              hourlyWage: hourlyWage,
              periodLabel: formatMonthLabel(year, month),
            ),
          ],
        ],
      ),
    );
  }
}

class _AssignedWorkpoints extends StatelessWidget {
  const _AssignedWorkpoints({
    required this.workPoints,
    required this.rows,
    required this.hasWage,
    required this.hourlyWage,
  });

  final List<AssignedWorkPointSummary> workPoints;
  final List<DailyStatRow> rows;
  final bool hasWage;
  final double? hourlyWage;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    if (workPoints.isEmpty) {
      return EmptyState(
        icon: Icons.business_outlined,
        title: l10n.t('No workpoints assigned'),
        message: l10n.t('Your assignments will show up here.'),
      );
    }

    return SectionCard(
      title: l10n.t('Assigned workpoints'),
      subtitle: l10n.t('Current workpoints assigned to you.'),
      child: Column(
        children: workPoints.map((workPoint) {
          final workPointRows = rows
              .where((row) => row.workPoint.id == workPoint.id)
              .toList();
          final hours = workPointRows.fold<double>(
            0,
            (sum, row) => sum + row.hours,
          );
          final earnings = earningsForHours(hours, hourlyWage);
          final complete = workPointRows.where((row) => row.complete).length;
          return ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const CircleAvatar(child: Icon(Icons.business_outlined)),
            title: Text(workPoint.name),
            subtitle: Text(
              '${workPoint.address}\n${l10n.t('Deadline')}: ${formatDate(workPoint.deadline)}',
            ),
            isThreeLine: true,
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  formatHours(hours),
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                Text(
                  hasWage
                      ? formatMoney(earnings, precise: true)
                      : l10n.t('{count} complete', {'count': '$complete'}),
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _AttendanceByWorkpoint extends StatelessWidget {
  const _AttendanceByWorkpoint({
    required this.workPoints,
    required this.rows,
    required this.hasWage,
    required this.hourlyWage,
    required this.periodLabel,
  });

  final List<AssignedWorkPointSummary> workPoints;
  final List<DailyStatRow> rows;
  final bool hasWage;
  final double? hourlyWage;
  final String periodLabel;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final assignedIds = workPoints.map((workPoint) => workPoint.id).toSet();
    final grouped = <String, List<DailyStatRow>>{};
    for (final row in rows) {
      grouped.putIfAbsent(row.workPoint.id, () => []).add(row);
    }

    final groups = [
      ...workPoints.map(
        (workPoint) => (
          id: workPoint.id,
          name: workPoint.name,
          current: true,
          rows: grouped[workPoint.id] ?? <DailyStatRow>[],
        ),
      ),
      ...grouped.entries
          .where((entry) => !assignedIds.contains(entry.key))
          .map(
            (entry) => (
              id: entry.key,
              name: entry.value.first.workPoint.name,
              current: false,
              rows: entry.value,
            ),
          ),
    ];

    if (groups.isEmpty) {
      return EmptyState(
        icon: Icons.schedule,
        title: l10n.t('No attendance records'),
        message: l10n.t('No attendance records for {periodLabel}.', {
          'periodLabel': periodLabel,
        }),
      );
    }

    return SectionCard(
      title: l10n.t('Attendance by workpoint'),
      subtitle: l10n.t('Your own check-ins and check-outs for {periodLabel}.', {
        'periodLabel': periodLabel,
      }),
      child: Column(
        children: groups.map((group) {
          final hours = group.rows.fold<double>(
            0,
            (sum, row) => sum + row.hours,
          );
          return ExpansionTile(
            tilePadding: EdgeInsets.zero,
            title: Text(group.name),
            subtitle: Text(
              l10n.t('{hours} · {count} records', {
                'hours': formatHours(hours),
                'count': '${group.rows.length}',
              }),
            ),
            trailing: group.current
                ? null
                : Chip(
                    label: Text(l10n.t('Previous')),
                    visualDensity: VisualDensity.compact,
                    side: BorderSide.none,
                    backgroundColor: Theme.of(
                      context,
                    ).colorScheme.secondaryContainer,
                  ),
            children: group.rows.isEmpty
                ? [
                    ListTile(
                      title: Text(
                        l10n.t(
                          'No attendance recorded here for {periodLabel}.',
                          {'periodLabel': periodLabel},
                        ),
                      ),
                    ),
                  ]
                : group.rows
                      .map(
                        (row) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(formatDate(row.date)),
                          subtitle: Text(
                            '${formatDateTime(row.checkedInAt)} - ${formatDateTime(row.checkedOutAt)}',
                          ),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(formatHours(row.hours)),
                              Text(
                                row.complete
                                    ? hasWage
                                          ? formatMoney(
                                              earningsForHours(
                                                row.hours,
                                                hourlyWage,
                                              ),
                                              precise: true,
                                            )
                                          : l10n.t('Unavailable')
                                    : l10n.t('Open'),
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                            ],
                          ),
                        ),
                      )
                      .toList(),
          );
        }).toList(),
      ),
    );
  }
}

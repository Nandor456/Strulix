import 'dart:async';

import 'package:flutter/material.dart';

import '../core/app_scope.dart';
import '../core/formatters.dart';
import '../core/i18n.dart';
import '../core/leave_dates.dart';
import '../core/models.dart';
import '../core/widgets.dart';
import '../messaging/messaging_controller.dart';

class LeaveCalendarPage extends StatefulWidget {
  const LeaveCalendarPage({super.key});

  @override
  State<LeaveCalendarPage> createState() => _LeaveCalendarPageState();
}

class _LeaveCalendarPageState extends State<LeaveCalendarPage> {
  late DateTime _monthDate;
  bool _isLoading = true;
  bool _isSaving = false;
  String? _error;
  String? _validationMessage;
  LeaveRequestType? _leaveType;
  String? _startDate;
  String? _endDate;
  List<LeaveRequest> _myRequests = const [];
  List<LeaveRequest> _allRequests = const [];
  int _lastLeaveRequestChangeVersion = 0;
  MessagingController? _messaging;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _monthDate = DateTime(now.year, now.month);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final messaging = AppScope.messagingOf(context);
      _messaging = messaging;
      _lastLeaveRequestChangeVersion = messaging.leaveRequestChangeVersion;
      messaging.addListener(_handleRealtimeLeaveRequestChange);
      unawaited(messaging.connect());
      unawaited(_load());
    });
  }

  @override
  void dispose() {
    _messaging?.removeListener(_handleRealtimeLeaveRequestChange);
    super.dispose();
  }

  void _handleRealtimeLeaveRequestChange() {
    if (!mounted) return;
    final messaging = AppScope.messagingOf(context);
    if (messaging.leaveRequestChangeVersion == _lastLeaveRequestChangeVersion) {
      return;
    }

    _lastLeaveRequestChangeVersion = messaging.leaveRequestChangeVersion;
    final change = messaging.latestLeaveRequestChange;
    if (change == null) return;

    if (change.isCanceled) {
      _removeLeaveRequest(change.leaveRequest.id);
      return;
    }

    _upsertLeaveRequest(change.leaveRequest);
  }

  bool get _canCreate {
    final role = AppScope.authOf(context).user?.role;
    return role == UserRole.worker || role == UserRole.leader;
  }

  bool get _canReview {
    final role = AppScope.authOf(context).user?.role;
    return role == UserRole.admin || role == UserRole.leader;
  }

  List<LeaveRequest> get _visibleRequests =>
      _canReview ? _allRequests : _myRequests;

  List<LeaveRequest> get _activeOwnRequests =>
      _myRequests.where((request) => request.isActive).toList(growable: false);

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final api = AppScope.apiOf(context);
    final l10n = context.l10n;
    try {
      final results = await Future.wait<List<LeaveRequest>>([
        api.listMyLeaveRequests(),
        if (_canReview) api.listAllLeaveRequests() else Future.value(const []),
      ]);
      setState(() {
        _myRequests = results[0];
        _allRequests = _canReview ? results[1] : results[0];
      });
    } catch (error) {
      setState(
        () => _error = errorMessage(
          error,
          l10n.t('Failed to load leave requests.'),
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _clearSelection() {
    setState(() {
      _leaveType = null;
      _startDate = null;
      _endDate = null;
      _validationMessage = null;
    });
  }

  bool _overlapsOwnRequest(String startDate, String endDate) {
    return _activeOwnRequests.any(
      (request) => selectedRangeOverlapsRequest(
        startDate: startDate,
        endDate: endDate,
        request: request,
      ),
    );
  }

  List<LeaveRequest> _upsertRequestInList(
    List<LeaveRequest> requests,
    LeaveRequest leaveRequest,
  ) {
    final exists = requests.any((request) => request.id == leaveRequest.id);
    final next = exists
        ? requests
              .map(
                (request) =>
                    request.id == leaveRequest.id ? leaveRequest : request,
              )
              .toList()
        : [leaveRequest, ...requests];
    next.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return next;
  }

  void _upsertLeaveRequest(LeaveRequest leaveRequest) {
    final currentUserId = AppScope.authOf(context).user?.id;
    setState(() {
      if (leaveRequest.userId == currentUserId ||
          _myRequests.any((request) => request.id == leaveRequest.id)) {
        _myRequests = _upsertRequestInList(_myRequests, leaveRequest);
      }
      if (_canReview ||
          _allRequests.any((request) => request.id == leaveRequest.id)) {
        _allRequests = _upsertRequestInList(_allRequests, leaveRequest);
      }
    });
  }

  void _removeLeaveRequest(String id) {
    setState(() {
      _myRequests = _myRequests
          .where((request) => request.id != id)
          .toList(growable: false);
      _allRequests = _allRequests
          .where((request) => request.id != id)
          .toList(growable: false);
    });
  }

  void _handleDateTap(String value, List<LeaveRequest> requests) {
    if (requests.isNotEmpty) _showLeaveDetails(value, requests);
    if (!_canCreate) return;

    if (value.compareTo(todayKey()) < 0) {
      final message = context.l10n.t('You cannot select past dates.');
      setState(() => _validationMessage = message);
      showSnack(context, message);
      return;
    }

    setState(() {
      _validationMessage = null;
      if (_startDate == null || _endDate != null) {
        _startDate = value;
        _endDate = null;
        return;
      }

      final currentStart = _startDate!;
      final nextStart = value.compareTo(currentStart) < 0
          ? value
          : currentStart;
      final nextEnd = value.compareTo(currentStart) < 0 ? currentStart : value;
      _startDate = nextStart;
      _endDate = nextEnd;

      if (_overlapsOwnRequest(nextStart, nextEnd)) {
        _validationMessage = context.l10n.t(
          'This period overlaps with an existing request.',
        );
      }
    });
  }

  Future<void> _submit() async {
    final l10n = context.l10n;
    final startDate = _startDate;
    final endDate = _endDate;
    final leaveType = _leaveType;

    if (startDate == null || endDate == null) {
      final message = l10n.t('Please select a start and end date.');
      setState(() => _validationMessage = message);
      showSnack(context, message);
      return;
    }
    if (leaveType == null) {
      final message = l10n.t('Please choose a leave type.');
      setState(() => _validationMessage = message);
      showSnack(context, message);
      return;
    }
    if (startDate.compareTo(todayKey()) < 0) {
      final message = l10n.t('You cannot select past dates.');
      setState(() => _validationMessage = message);
      showSnack(context, message);
      return;
    }
    if (_overlapsOwnRequest(startDate, endDate)) {
      final message = l10n.t('This period overlaps with an existing request.');
      setState(() => _validationMessage = message);
      showSnack(context, message);
      return;
    }

    setState(() => _isSaving = true);
    try {
      final leaveRequest = await AppScope.apiOf(context).createLeaveRequest(
        type: leaveType,
        startDate: startDate,
        endDate: endDate,
      );
      if (!mounted) return;
      _upsertLeaveRequest(leaveRequest);
      showSnack(context, l10n.t('Leave request submitted.'));
      _clearSelection();
    } catch (error) {
      if (mounted) {
        showSnack(
          context,
          errorMessage(error, l10n.t('Failed to submit leave request.')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _approve(LeaveRequest request) async {
    setState(() => _isSaving = true);
    try {
      final leaveRequest = await AppScope.apiOf(
        context,
      ).approveLeaveRequest(request.id);
      if (!mounted) return;
      _upsertLeaveRequest(leaveRequest);
      showSnack(context, context.l10n.t('Leave request approved.'));
    } catch (error) {
      if (mounted) {
        showSnack(
          context,
          errorMessage(
            error,
            context.l10n.t('Failed to approve leave request.'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _reject(LeaveRequest request) async {
    setState(() => _isSaving = true);
    try {
      final leaveRequest = await AppScope.apiOf(
        context,
      ).rejectLeaveRequest(request.id);
      if (!mounted) return;
      _upsertLeaveRequest(leaveRequest);
      showSnack(context, context.l10n.t('Leave request rejected.'));
    } catch (error) {
      if (mounted) {
        showSnack(
          context,
          errorMessage(
            error,
            context.l10n.t('Failed to reject leave request.'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _cancel(LeaveRequest request) async {
    final api = AppScope.apiOf(context);
    final l10n = context.l10n;
    final confirmed = await confirmAction(
      context,
      title: l10n.t('Cancel request'),
      message: l10n.t('Cancel this pending request?'),
      confirmLabel: l10n.t('Cancel request'),
      destructive: true,
    );
    if (!confirmed) return;

    setState(() => _isSaving = true);
    try {
      final leaveRequest = await api.cancelLeaveRequest(request.id);
      if (!mounted) return;
      _removeLeaveRequest(leaveRequest.id);
      showSnack(context, l10n.t('Leave request canceled.'));
    } catch (error) {
      if (mounted) {
        showSnack(
          context,
          errorMessage(error, l10n.t('Failed to cancel leave request.')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  void _showLeaveDetails(String value, List<LeaveRequest> requests) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          children: [
            Text(
              formatDate(value),
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            ...requests.map(
              (request) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _LeaveRequestCard(
                  request: request,
                  canReview: false,
                  currentUserId: AppScope.authOf(context).user?.id ?? '',
                  isSaving: false,
                  onApprove: _approve,
                  onReject: _reject,
                  onCancel: _cancel,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              CircleAvatar(
                child: Icon(
                  _canReview
                      ? Icons.fact_check_outlined
                      : Icons.event_available_outlined,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.t('Leave Calendar'),
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _canCreate
                          ? l10n.t(
                              'Select a leave period directly on the calendar.',
                            )
                          : l10n.t(
                              'Review employee leave requests and approved absences.',
                            ),
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_isLoading)
            LoadingView(label: l10n.t('Loading leave requests...'))
          else if (_error != null)
            ErrorBanner(_error!)
          else
            LayoutBuilder(
              builder: (context, constraints) {
                final wide = constraints.maxWidth >= 900;
                final calendar = _CalendarMonthView(
                  monthDate: _monthDate,
                  requests: _visibleRequests,
                  startDate: _startDate,
                  endDate: _endDate,
                  canCreate: _canCreate,
                  onPrevious: () => setState(
                    () => _monthDate = monthAfterDate(_monthDate, -1),
                  ),
                  onNext: () => setState(
                    () => _monthDate = monthAfterDate(_monthDate, 1),
                  ),
                  onDateTap: _handleDateTap,
                );
                final side = Column(
                  children: [
                    if (_canCreate) ...[
                      _LeaveComposer(
                        leaveType: _leaveType,
                        startDate: _startDate,
                        endDate: _endDate,
                        validationMessage: _validationMessage,
                        isSaving: _isSaving,
                        onTypeChanged: (value) =>
                            setState(() => _leaveType = value),
                        onSubmit: _submit,
                        onClear: _clearSelection,
                      ),
                      const SizedBox(height: 16),
                    ],
                    _LeaveRequestList(
                      requests: _visibleRequests,
                      pendingRequests: _visibleRequests
                          .where(
                            (request) =>
                                request.status == LeaveRequestStatus.pending,
                          )
                          .toList(growable: false),
                      canReview: _canReview,
                      currentUserId: AppScope.authOf(context).user?.id ?? '',
                      isSaving: _isSaving,
                      onApprove: _approve,
                      onReject: _reject,
                      onCancel: _cancel,
                    ),
                  ],
                );

                if (!wide) {
                  return Column(
                    children: [calendar, const SizedBox(height: 16), side],
                  );
                }

                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(child: calendar),
                    const SizedBox(width: 16),
                    SizedBox(width: 390, child: side),
                  ],
                );
              },
            ),
        ],
      ),
    );
  }
}

class _CalendarMonthView extends StatelessWidget {
  const _CalendarMonthView({
    required this.monthDate,
    required this.requests,
    required this.startDate,
    required this.endDate,
    required this.canCreate,
    required this.onPrevious,
    required this.onNext,
    required this.onDateTap,
  });

  final DateTime monthDate;
  final List<LeaveRequest> requests;
  final String? startDate;
  final String? endDate;
  final bool canCreate;
  final VoidCallback onPrevious;
  final VoidCallback onNext;
  final void Function(String dateKey, List<LeaveRequest> requests) onDateTap;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final days = buildMonthGrid(monthDate);
    final today = todayKey();
    return SectionCard(
      title: formatMonthLabel(monthDate.year, monthDate.month),
      subtitle: canCreate
          ? l10n.t('Click a start date, then an end date.')
          : l10n.t('Approved leave is highlighted on the calendar.'),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton.outlined(
            tooltip: l10n.t('Previous month'),
            onPressed: onPrevious,
            icon: const Icon(Icons.chevron_left),
          ),
          const SizedBox(width: 6),
          IconButton.outlined(
            tooltip: l10n.t('Next month'),
            onPressed: onNext,
            icon: const Icon(Icons.chevron_right),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                .map(
                  (day) => Expanded(
                    child: Center(
                      child: Text(
                        l10n.t(day),
                        style: Theme.of(context).textTheme.labelSmall,
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 8),
          LayoutBuilder(
            builder: (context, constraints) {
              final wide = constraints.maxWidth >= 640;
              return GridView.builder(
                itemCount: days.length,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 7,
                  crossAxisSpacing: 6,
                  mainAxisSpacing: 6,
                  childAspectRatio: wide ? 0.92 : 0.68,
                ),
                itemBuilder: (context, index) {
                  final day = days[index];
                  final dayRequests = leaveRequestsForDate(
                    day.dateKey,
                    requests,
                  );
                  return _CalendarDayCell(
                    day: day,
                    requests: dayRequests,
                    isToday: day.dateKey == today,
                    isPast: day.dateKey.compareTo(today) < 0,
                    isRangeStart: day.dateKey == startDate,
                    isRangeEnd: day.dateKey == endDate,
                    isInRange: isDateInRange(day.dateKey, startDate, endDate),
                    onTap: () => onDateTap(day.dateKey, dayRequests),
                  );
                },
              );
            },
          ),
        ],
      ),
    );
  }
}

class _CalendarDayCell extends StatelessWidget {
  const _CalendarDayCell({
    required this.day,
    required this.requests,
    required this.isToday,
    required this.isPast,
    required this.isRangeStart,
    required this.isRangeEnd,
    required this.isInRange,
    required this.onTap,
  });

  final CalendarDay day;
  final List<LeaveRequest> requests;
  final bool isToday;
  final bool isPast;
  final bool isRangeStart;
  final bool isRangeEnd;
  final bool isInRange;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final isEndpoint = isRangeStart || isRangeEnd;
    final visibleRequests = requests.take(2).toList();

    Color background = colors.surface;
    Color border = colors.outlineVariant;
    if (!day.isCurrentMonth) background = colors.surfaceContainerHighest;
    if (isPast) {
      background = colors.surfaceContainerHighest.withValues(alpha: 0.55);
    }
    if (isInRange) {
      background = colors.tertiaryContainer.withValues(alpha: 0.45);
      border = colors.tertiary;
    }
    if (isEndpoint) {
      background = colors.tertiaryContainer;
      border = colors.tertiary;
    }

    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              radius: 12,
              backgroundColor: isEndpoint || isToday
                  ? colors.primary
                  : Colors.transparent,
              foregroundColor: isEndpoint || isToday
                  ? colors.onPrimary
                  : colors.onSurface,
              child: Text(
                '${day.dayNumber}',
                style: const TextStyle(fontSize: 12),
              ),
            ),
            const Spacer(),
            ...visibleRequests.map(
              (request) => Padding(
                padding: const EdgeInsets.only(top: 3),
                child: Container(
                  height: 6,
                  decoration: BoxDecoration(
                    color: _requestColor(context, request),
                    borderRadius: BorderRadius.circular(99),
                  ),
                ),
              ),
            ),
            if (requests.length > visibleRequests.length)
              Text(
                '+${requests.length - visibleRequests.length}',
                style: Theme.of(context).textTheme.labelSmall,
              ),
          ],
        ),
      ),
    );
  }
}

class _LeaveComposer extends StatelessWidget {
  const _LeaveComposer({
    required this.leaveType,
    required this.startDate,
    required this.endDate,
    required this.validationMessage,
    required this.isSaving,
    required this.onTypeChanged,
    required this.onSubmit,
    required this.onClear,
  });

  final LeaveRequestType? leaveType;
  final String? startDate;
  final String? endDate;
  final String? validationMessage;
  final bool isSaving;
  final ValueChanged<LeaveRequestType> onTypeChanged;
  final VoidCallback onSubmit;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final days = startDate != null && endDate != null
        ? countInclusiveDays(startDate!, endDate!)
        : 0;
    return SectionCard(
      title: l10n.t('New leave request'),
      subtitle: l10n.t('Select dates and lock the period for approval.'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SegmentedButton<LeaveRequestType>(
            segments: [
              ButtonSegment(
                value: LeaveRequestType.vacation,
                icon: const Icon(Icons.work_outline),
                label: Text(l10n.t('Vacation leave')),
              ),
              ButtonSegment(
                value: LeaveRequestType.sick,
                icon: const Icon(Icons.health_and_safety_outlined),
                label: Text(l10n.t('Sick leave')),
              ),
            ],
            selected: leaveType == null ? <LeaveRequestType>{} : {leaveType!},
            emptySelectionAllowed: true,
            onSelectionChanged: isSaving
                ? null
                : (values) {
                    final value = values.isEmpty ? null : values.first;
                    if (value != null) onTypeChanged(value);
                  },
          ),
          if (validationMessage != null) ...[
            const SizedBox(height: 12),
            ErrorBanner(validationMessage!),
          ],
          const SizedBox(height: 12),
          _SummaryRow(
            label: l10n.t('Leave type'),
            value: leaveType == null
                ? l10n.t('Not selected')
                : _leaveTypeLabel(context, leaveType!),
          ),
          _SummaryRow(
            label: l10n.t('Start date'),
            value: startDate == null
                ? l10n.t('Not selected')
                : formatDate(startDate),
          ),
          _SummaryRow(
            label: l10n.t('End date'),
            value: endDate == null
                ? l10n.t('Not selected')
                : formatDate(endDate),
          ),
          _SummaryRow(label: l10n.t('Days'), value: '$days'),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: isSaving ? null : onSubmit,
            icon: const Icon(Icons.send_outlined),
            label: Text(
              isSaving ? l10n.t('Submitting...') : l10n.t('Submit request'),
            ),
          ),
          TextButton.icon(
            onPressed: isSaving ? null : onClear,
            icon: const Icon(Icons.close),
            label: Text(l10n.t('Clear')),
          ),
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(
            child: Text(label, style: Theme.of(context).textTheme.bodySmall),
          ),
          Text(value, style: Theme.of(context).textTheme.bodyMedium),
        ],
      ),
    );
  }
}

class _LeaveRequestList extends StatelessWidget {
  const _LeaveRequestList({
    required this.requests,
    required this.pendingRequests,
    required this.canReview,
    required this.currentUserId,
    required this.isSaving,
    required this.onApprove,
    required this.onReject,
    required this.onCancel,
  });

  final List<LeaveRequest> requests;
  final List<LeaveRequest> pendingRequests;
  final bool canReview;
  final String currentUserId;
  final bool isSaving;
  final ValueChanged<LeaveRequest> onApprove;
  final ValueChanged<LeaveRequest> onReject;
  final ValueChanged<LeaveRequest> onCancel;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final listedRequests = canReview
        ? requests
              .where((request) => request.status != LeaveRequestStatus.pending)
              .toList(growable: false)
        : requests;
    return Column(
      children: [
        if (canReview) ...[
          SectionCard(
            title: l10n.t('Pending approvals'),
            subtitle: l10n.t('Requests waiting for a manager decision.'),
            child: pendingRequests.isEmpty
                ? Text(l10n.t('No pending requests.'))
                : Column(
                    children: pendingRequests
                        .map(
                          (request) => Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: _LeaveRequestCard(
                              request: request,
                              canReview: canReview,
                              currentUserId: currentUserId,
                              isSaving: isSaving,
                              onApprove: onApprove,
                              onReject: onReject,
                              onCancel: onCancel,
                            ),
                          ),
                        )
                        .toList(),
                  ),
          ),
          const SizedBox(height: 16),
        ],
        SectionCard(
          title: canReview
              ? l10n.t('All leave requests')
              : l10n.t('Your leave requests'),
          subtitle: canReview
              ? l10n.t('Approved and rejected requests stay visible here.')
              : l10n.t(
                  'Track your submitted leave requests and approval status.',
                ),
          child: listedRequests.isEmpty
              ? EmptyState(
                  icon: Icons.event_busy_outlined,
                  title: canReview
                      ? l10n.t('No reviewed leave requests yet.')
                      : l10n.t('No leave requests yet.'),
                )
              : Column(
                  children: listedRequests
                      .map(
                        (request) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: _LeaveRequestCard(
                            request: request,
                            canReview: canReview,
                            currentUserId: currentUserId,
                            isSaving: isSaving,
                            onApprove: onApprove,
                            onReject: onReject,
                            onCancel: onCancel,
                          ),
                        ),
                      )
                      .toList(),
                ),
        ),
      ],
    );
  }
}

class _LeaveRequestCard extends StatelessWidget {
  const _LeaveRequestCard({
    required this.request,
    required this.canReview,
    required this.currentUserId,
    required this.isSaving,
    required this.onApprove,
    required this.onReject,
    required this.onCancel,
  });

  final LeaveRequest request;
  final bool canReview;
  final String currentUserId;
  final bool isSaving;
  final ValueChanged<LeaveRequest> onApprove;
  final ValueChanged<LeaveRequest> onReject;
  final ValueChanged<LeaveRequest> onCancel;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final isOwnRequest = request.userId == currentUserId;
    final canReviewRequest =
        canReview &&
        request.status == LeaveRequestStatus.pending &&
        !isOwnRequest;
    final canCancelRequest =
        request.status == LeaveRequestStatus.pending && isOwnRequest;
    return Card(
      color: _requestBackground(context, request),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    _leaveTypeLabel(context, request.type),
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                ),
                Chip(
                  label: Text(_statusLabel(context, request.status)),
                  visualDensity: VisualDensity.compact,
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text('${request.userName} · ${request.userEmail}'),
            const SizedBox(height: 8),
            Text(
              '${formatDate(request.startDate)} - ${formatDate(request.endDate)} · '
              '${l10n.t('Days')}: ${request.days}',
            ),
            Text(
              '${l10n.t('Submitted')}: ${formatDate(request.createdAt)}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            if (canReviewRequest || canCancelRequest) ...[
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (canReviewRequest)
                    FilledButton.icon(
                      onPressed: isSaving ? null : () => onApprove(request),
                      icon: const Icon(Icons.check),
                      label: Text(l10n.t('Approve')),
                    ),
                  if (canReviewRequest)
                    FilledButton.tonalIcon(
                      onPressed: isSaving ? null : () => onReject(request),
                      icon: const Icon(Icons.close),
                      label: Text(l10n.t('Reject')),
                    ),
                  if (canCancelRequest)
                    OutlinedButton.icon(
                      onPressed: isSaving ? null : () => onCancel(request),
                      icon: const Icon(Icons.close),
                      label: Text(l10n.t('Cancel request')),
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

String _leaveTypeLabel(BuildContext context, LeaveRequestType type) {
  return type == LeaveRequestType.vacation
      ? context.l10n.t('Vacation leave')
      : context.l10n.t('Sick leave');
}

String _statusLabel(BuildContext context, LeaveRequestStatus status) {
  return switch (status) {
    LeaveRequestStatus.approved => context.l10n.t('Approved'),
    LeaveRequestStatus.rejected => context.l10n.t('Rejected'),
    LeaveRequestStatus.pending => context.l10n.t('Pending'),
  };
}

Color _requestColor(BuildContext context, LeaveRequest request) {
  final colors = Theme.of(context).colorScheme;
  if (request.status == LeaveRequestStatus.pending) {
    return request.type == LeaveRequestType.sick
        ? colors.error.withValues(alpha: 0.45)
        : colors.primary.withValues(alpha: 0.45);
  }
  return request.type == LeaveRequestType.sick ? colors.error : colors.primary;
}

Color _requestBackground(BuildContext context, LeaveRequest request) {
  final colors = Theme.of(context).colorScheme;
  if (request.status == LeaveRequestStatus.rejected) {
    return colors.surfaceContainerHighest.withValues(alpha: 0.45);
  }
  if (request.type == LeaveRequestType.sick) {
    return colors.errorContainer.withValues(
      alpha: request.status == LeaveRequestStatus.pending ? 0.45 : 0.75,
    );
  }
  return colors.primaryContainer.withValues(
    alpha: request.status == LeaveRequestStatus.pending ? 0.45 : 0.75,
  );
}

import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:open_filex/open_filex.dart';
import 'package:path_provider/path_provider.dart';

import '../core/app_config.dart';
import '../core/app_scope.dart';
import '../core/formatters.dart';
import '../core/models.dart';
import '../core/widgets.dart';

class WorkpointDetailPage extends StatefulWidget {
  const WorkpointDetailPage({required this.id, super.key});

  final String id;

  @override
  State<WorkpointDetailPage> createState() => _WorkpointDetailPageState();
}

class _WorkpointDetailPageState extends State<WorkpointDetailPage> {
  bool _isLoading = true;
  bool _isAttendanceLoading = true;
  bool _isExporting = false;
  String? _error;
  WorkPointDetail? _workPoint;
  List<WorkerSummary> _workers = const [];
  List<WorkerSummary> _assignedWorkers = const [];
  List<AttendanceRecord> _attendance = const [];
  QrData? _qr;

  late String _from = monthBounds(currentPeriod()).from;
  late String _to = monthBounds(currentPeriod()).to;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadAll());
  }

  Future<void> _loadAll() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    final api = AppScope.apiOf(context);
    try {
      final results = await Future.wait([
        api.getWorkPoint(widget.id),
        api.listWorkers(),
        api.listWorkPointWorkers(widget.id),
        api.getQr(widget.id),
      ]);
      setState(() {
        _workPoint = results[0] as WorkPointDetail;
        _workers = results[1] as List<WorkerSummary>;
        _assignedWorkers = results[2] as List<WorkerSummary>;
        _qr = results[3] as QrData;
      });
      await _loadAttendance();
    } catch (error) {
      setState(
        () => _error = errorMessage(error, 'Failed to load this workpoint.'),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _loadAttendance() async {
    setState(() => _isAttendanceLoading = true);
    try {
      final rows = await AppScope.apiOf(
        context,
      ).listAttendance(widget.id, from: _from, to: _to);
      setState(() => _attendance = rows);
    } catch (error) {
      if (mounted) {
        showSnack(context, errorMessage(error, 'Failed to load attendance.'));
      }
    } finally {
      if (mounted) setState(() => _isAttendanceLoading = false);
    }
  }

  Future<void> _assignWorker() async {
    final api = AppScope.apiOf(context);
    final assignedIds = _assignedWorkers.map((worker) => worker.id).toSet();
    final available = _workers
        .where((worker) => !assignedIds.contains(worker.id))
        .toList();
    if (available.isEmpty) {
      showSnack(context, 'No workers available to assign.');
      return;
    }
    final worker = await showDialog<WorkerSummary>(
      context: context,
      builder: (context) => SimpleDialog(
        title: const Text('Assign worker'),
        children: available
            .map(
              (worker) => SimpleDialogOption(
                onPressed: () => Navigator.pop(context, worker),
                child: Text('${worker.username} (${worker.email})'),
              ),
            )
            .toList(),
      ),
    );
    if (worker == null) return;
    await api.assignWorker(widget.id, worker.id);
    await _loadAll();
  }

  Future<void> _removeWorker(WorkerSummary worker) async {
    final api = AppScope.apiOf(context);
    final confirmed = await confirmAction(
      context,
      title: 'Remove worker',
      message: 'Remove ${worker.username} from this workpoint?',
      confirmLabel: 'Remove',
    );
    if (!confirmed) return;
    await api.removeWorker(widget.id, worker.id);
    await _loadAll();
  }

  Future<void> _rotateQr() async {
    final api = AppScope.apiOf(context);
    final confirmed = await confirmAction(
      context,
      title: 'Rotate QR code',
      message: 'Existing printed codes will stop working.',
      confirmLabel: 'Rotate',
    );
    if (!confirmed) return;
    final qr = await api.rotateQr(widget.id);
    if (mounted) setState(() => _qr = qr);
  }

  Future<void> _saveQrImage() async {
    final qr = _qr;
    final workPoint = _workPoint;
    if (qr == null || workPoint == null) return;
    final bytes = base64Decode(qr.qrPng.split(',').last);
    final dir = await getTemporaryDirectory();
    final file = File(
      '${dir.path}/${workPoint.name.replaceAll(RegExp(r'[^\w.\-]+'), '-')}-qr.png',
    );
    await file.writeAsBytes(bytes);
    await OpenFilex.open(file.path);
  }

  Future<void> _exportAttendance() async {
    final workPoint = _workPoint;
    if (workPoint == null) return;
    setState(() => _isExporting = true);
    try {
      final safeName = workPoint.name.toLowerCase().replaceAll(
        RegExp(r'[^a-z0-9]+'),
        '-',
      );
      final file = await AppScope.apiOf(context).exportAttendance(
        workPointId: widget.id,
        from: _from,
        to: _to,
        filename:
            'attendance-${safeName.isEmpty ? widget.id : safeName}-$_from-to-$_to.xlsx',
      );
      await OpenFilex.open(file.path);
    } catch (error) {
      if (mounted) {
        showSnack(context, errorMessage(error, 'Failed to export attendance.'));
      }
    } finally {
      if (mounted) setState(() => _isExporting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final workPoint = _workPoint;
    return RefreshIndicator(
      onRefresh: _loadAll,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              IconButton.outlined(
                tooltip: 'Back',
                onPressed: () => context.go('/workpoints'),
                icon: const Icon(Icons.arrow_back),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Workpoint details',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_isLoading)
            const LoadingView(label: 'Loading workpoint...')
          else if (_error != null)
            ErrorBanner(_error!)
          else if (workPoint == null)
            const EmptyState(
              icon: Icons.business_outlined,
              title: 'Workpoint not found',
            )
          else ...[
            _Overview(workPoint: workPoint),
            const SizedBox(height: 12),
            _WorkersSection(
              workers: _assignedWorkers,
              onAssign: _assignWorker,
              onRemove: _removeWorker,
            ),
            const SizedBox(height: 12),
            _QrSection(
              qr: _qr,
              workPoint: workPoint,
              onCopy: () async {
                final qr = _qr;
                if (qr == null) return;
                await Clipboard.setData(
                  ClipboardData(
                    text: '${AppConfig.apiOrigin}/checkin/${qr.qrToken}',
                  ),
                );
                if (context.mounted) showSnack(context, 'QR link copied.');
              },
              onSave: _saveQrImage,
              onRotate: _rotateQr,
            ),
            const SizedBox(height: 12),
            _AttendanceSection(
              records: _attendance,
              workers: _assignedWorkers,
              from: _from,
              to: _to,
              isLoading: _isAttendanceLoading,
              isExporting: _isExporting,
              onFromChanged: (value) {
                setState(() => _from = value);
                _loadAttendance();
              },
              onToChanged: (value) {
                setState(() => _to = value);
                _loadAttendance();
              },
              onExport: _exportAttendance,
              onManual: () => _showManualAttendanceDialog(),
              onCheckout: _showCheckoutDialog,
              onDelete: _deleteAttendance,
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _showManualAttendanceDialog() async {
    if (_assignedWorkers.isEmpty) {
      showSnack(context, 'Assign a worker before adding attendance.');
      return;
    }
    final saved = await showDialog<bool>(
      context: context,
      builder: (context) => _ManualAttendanceDialog(
        workers: _assignedWorkers,
        workPointId: widget.id,
      ),
    );
    if (saved == true) await _loadAttendance();
  }

  Future<void> _showCheckoutDialog(AttendanceRecord record) async {
    final saved = await showDialog<bool>(
      context: context,
      builder: (context) => _CheckoutDialog(record: record),
    );
    if (saved == true) await _loadAttendance();
  }

  Future<void> _deleteAttendance(AttendanceRecord record) async {
    final api = AppScope.apiOf(context);
    final confirmed = await confirmAction(
      context,
      title: 'Delete attendance',
      message: 'Delete attendance for ${record.worker.username}?',
      confirmLabel: 'Delete',
      destructive: true,
    );
    if (!confirmed) return;
    await api.deleteAttendance(record.id);
    await _loadAttendance();
  }
}

class _Overview extends StatelessWidget {
  const _Overview({required this.workPoint});

  final WorkPointDetail workPoint;

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      title: workPoint.name,
      subtitle: workPoint.address,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (workPoint.description != null) Text(workPoint.description!),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              Chip(label: Text('Workers ${workPoint.workerCount}')),
              Chip(label: Text('Records ${workPoint.attendanceCount}')),
              Chip(label: Text('Deadline ${formatDate(workPoint.deadline)}')),
              Chip(label: Text('Created ${formatDate(workPoint.uploadedAt)}')),
            ],
          ),
        ],
      ),
    );
  }
}

class _WorkersSection extends StatelessWidget {
  const _WorkersSection({
    required this.workers,
    required this.onAssign,
    required this.onRemove,
  });

  final List<WorkerSummary> workers;
  final VoidCallback onAssign;
  final Future<void> Function(WorkerSummary worker) onRemove;

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      title: 'Assigned workers',
      trailing: IconButton.filledTonal(
        tooltip: 'Assign worker',
        onPressed: onAssign,
        icon: const Icon(Icons.person_add_alt),
      ),
      child: workers.isEmpty
          ? const Text('No workers assigned to this workpoint.')
          : Column(
              children: workers
                  .map(
                    (worker) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const CircleAvatar(
                        child: Icon(Icons.person_outline),
                      ),
                      title: Text(worker.username),
                      subtitle: Text(worker.email),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Chip(
                            label: Text(
                              worker.hourlyWage == null
                                  ? 'No wage'
                                  : '${worker.hourlyWage!.toStringAsFixed(2)} RON/h',
                            ),
                          ),
                          IconButton(
                            tooltip: 'Remove',
                            onPressed: () => onRemove(worker),
                            icon: const Icon(Icons.person_remove_outlined),
                          ),
                        ],
                      ),
                    ),
                  )
                  .toList(),
            ),
    );
  }
}

class _QrSection extends StatelessWidget {
  const _QrSection({
    required this.qr,
    required this.workPoint,
    required this.onCopy,
    required this.onSave,
    required this.onRotate,
  });

  final QrData? qr;
  final WorkPointDetail workPoint;
  final VoidCallback onCopy;
  final VoidCallback onSave;
  final VoidCallback onRotate;

  @override
  Widget build(BuildContext context) {
    final data = qr;
    return SectionCard(
      title: 'QR check-in',
      subtitle: 'Workers scan this code to check in or out.',
      child: data == null
          ? const Text('QR code is not available yet.')
          : Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 190,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Image.memory(
                      base64Decode(data.qrPng.split(',').last),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    OutlinedButton.icon(
                      onPressed: onCopy,
                      icon: const Icon(Icons.copy),
                      label: const Text('Copy link'),
                    ),
                    OutlinedButton.icon(
                      onPressed: onSave,
                      icon: const Icon(Icons.download),
                      label: const Text('Open QR'),
                    ),
                    OutlinedButton.icon(
                      onPressed: onRotate,
                      icon: const Icon(Icons.sync),
                      label: const Text('Rotate'),
                    ),
                  ],
                ),
              ],
            ),
    );
  }
}

class _AttendanceSection extends StatelessWidget {
  const _AttendanceSection({
    required this.records,
    required this.workers,
    required this.from,
    required this.to,
    required this.isLoading,
    required this.isExporting,
    required this.onFromChanged,
    required this.onToChanged,
    required this.onExport,
    required this.onManual,
    required this.onCheckout,
    required this.onDelete,
  });

  final List<AttendanceRecord> records;
  final List<WorkerSummary> workers;
  final String from;
  final String to;
  final bool isLoading;
  final bool isExporting;
  final ValueChanged<String> onFromChanged;
  final ValueChanged<String> onToChanged;
  final VoidCallback onExport;
  final VoidCallback onManual;
  final Future<void> Function(AttendanceRecord record) onCheckout;
  final Future<void> Function(AttendanceRecord record) onDelete;

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      title: 'Attendance',
      subtitle: 'Filter records and export the same period to Excel.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              SizedBox(
                width: 220,
                child: _DateButton(
                  label: 'From',
                  value: from,
                  onChanged: onFromChanged,
                ),
              ),
              SizedBox(
                width: 220,
                child: _DateButton(
                  label: 'To',
                  value: to,
                  onChanged: onToChanged,
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(
                child: FilledButton.tonalIcon(
                  onPressed: onManual,
                  icon: const Icon(Icons.add),
                  label: const Text('Manual entry'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: FilledButton.tonalIcon(
                  onPressed: isExporting ? null : onExport,
                  icon: isExporting
                      ? const SizedBox.square(
                          dimension: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.table_view_outlined),
                  label: Text(isExporting ? 'Exporting...' : 'Export'),
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          if (isLoading)
            const LoadingView(label: 'Loading attendance...')
          else if (records.isEmpty)
            const _EmptyAttendanceState()
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: records.length,
              separatorBuilder: (context, index) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final record = records[index];

                return _AttendanceRecordCard(
                  record: record,
                  onCheckout: () => onCheckout(record),
                  onDelete: () => onDelete(record),
                );
              },
            ),
        ],
      ),
    );
  }
}

class _AttendanceRecordCard extends StatelessWidget {
  const _AttendanceRecordCard({
    required this.record,
    required this.onCheckout,
    required this.onDelete,
  });

  final AttendanceRecord record;
  final VoidCallback onCheckout;
  final VoidCallback onDelete;

  bool get canSetCheckout {
    return record.checkedOutAt == null || record.checkoutSource == 'AUTO';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final hasCheckedOut = record.checkedOutAt != null;
    final hours = record.hours;

    return Card(
      elevation: 0,
      color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.45),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: theme.colorScheme.outlineVariant.withValues(alpha: 0.7),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 22,
                  backgroundColor: theme.colorScheme.primaryContainer,
                  foregroundColor: theme.colorScheme.onPrimaryContainer,
                  child: Text(
                    record.worker.username.isNotEmpty
                        ? record.worker.username[0].toUpperCase()
                        : '?',
                    style: theme.textTheme.titleMedium,
                  ),
                ),

                const SizedBox(width: 12),

                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        record.worker.username,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        formatDate(record.date),
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),

                _AttendanceStatusBadge(
                  label: hasCheckedOut ? 'Completed' : 'Active',
                  isCompleted: hasCheckedOut,
                ),

                PopupMenuButton<String>(
                  tooltip: 'Actions',
                  icon: const Icon(Icons.more_vert),
                  onSelected: (value) {
                    if (value == 'checkout') onCheckout();
                    if (value == 'delete') onDelete();
                  },
                  itemBuilder: (context) => [
                    if (canSetCheckout)
                      const PopupMenuItem(
                        value: 'checkout',
                        child: Row(
                          children: [
                            Icon(Icons.logout, size: 20),
                            SizedBox(width: 8),
                            Text('Set checkout'),
                          ],
                        ),
                      ),
                    const PopupMenuItem(
                      value: 'delete',
                      child: Row(
                        children: [
                          Icon(Icons.delete_outline, size: 20),
                          SizedBox(width: 8),
                          Text('Delete'),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),

            const SizedBox(height: 14),

            Divider(
              height: 1,
              color: theme.colorScheme.outlineVariant.withValues(alpha: 0.7),
            ),

            const SizedBox(height: 12),

            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _InfoChip(icon: Icons.fingerprint, label: record.source),
                _InfoChip(
                  icon: Icons.schedule,
                  label:
                      'Hours: ${hours == null ? 'Open' : formatHours(hours)}',
                ),
              ],
            ),

            const SizedBox(height: 12),

            _TimeRow(
              icon: Icons.login,
              label: 'Checked in',
              value: formatDateTime(record.checkedInAt),
            ),

            const SizedBox(height: 8),

            _TimeRow(
              icon: Icons.logout,
              label: 'Checked out',
              value: record.checkedOutAt == null
                  ? 'Not checked out yet'
                  : formatDateTime(record.checkedOutAt),
              muted: record.checkedOutAt == null,
            ),
          ],
        ),
      ),
    );
  }
}

class _AttendanceStatusBadge extends StatelessWidget {
  const _AttendanceStatusBadge({
    required this.label,
    required this.isCompleted,
  });

  final String label;
  final bool isCompleted;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final background = isCompleted
        ? theme.colorScheme.secondaryContainer
        : theme.colorScheme.primaryContainer;

    final foreground = isCompleted
        ? theme.colorScheme.onSecondaryContainer
        : theme.colorScheme.onPrimaryContainer;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: theme.textTheme.labelSmall?.copyWith(
          color: foreground,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: theme.colorScheme.outlineVariant),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: theme.colorScheme.onSurfaceVariant),
          const SizedBox(width: 6),
          Text(label, style: theme.textTheme.labelMedium),
        ],
      ),
    );
  }
}

class _TimeRow extends StatelessWidget {
  const _TimeRow({
    required this.icon,
    required this.label,
    required this.value,
    this.muted = false,
  });

  final IconData icon;
  final String label;
  final String value;
  final bool muted;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Row(
      children: [
        Icon(
          icon,
          size: 18,
          color: muted
              ? theme.colorScheme.outline
              : theme.colorScheme.onSurfaceVariant,
        ),
        const SizedBox(width: 8),
        SizedBox(
          width: 95,
          child: Text(
            label,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: muted
                  ? theme.colorScheme.outline
                  : theme.colorScheme.onSurface,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}

class _EmptyAttendanceState extends StatelessWidget {
  const _EmptyAttendanceState();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withValues(
          alpha: 0.45,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.colorScheme.outlineVariant),
      ),
      child: Column(
        children: [
          Icon(
            Icons.event_busy_outlined,
            size: 36,
            color: theme.colorScheme.onSurfaceVariant,
          ),
          const SizedBox(height: 8),
          Text(
            'No attendance records',
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'There are no records for the selected period.',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

class _DateButton extends StatelessWidget {
  const _DateButton({
    required this.label,
    required this.value,
    required this.onChanged,
  });

  final String label;
  final String value;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: () async {
        final picked = await showDatePicker(
          context: context,
          firstDate: DateTime(2020),
          lastDate: DateTime(2100),
          initialDate: DateTime.tryParse(value) ?? DateTime.now(),
        );
        if (picked != null) {
          onChanged(picked.toIso8601String().substring(0, 10));
        }
      },
      icon: const Icon(Icons.calendar_month_outlined),
      label: Text('$label: ${formatDate(value)}'),
    );
  }
}

class _ManualAttendanceDialog extends StatefulWidget {
  const _ManualAttendanceDialog({
    required this.workers,
    required this.workPointId,
  });

  final List<WorkerSummary> workers;
  final String workPointId;

  @override
  State<_ManualAttendanceDialog> createState() =>
      _ManualAttendanceDialogState();
}

class _ManualAttendanceDialogState extends State<_ManualAttendanceDialog> {
  late String _workerId = widget.workers.first.id;
  DateTime _date = DateTime.now();
  TimeOfDay _inTime = const TimeOfDay(hour: 8, minute: 0);
  TimeOfDay? _outTime;
  bool _isSaving = false;

  Future<void> _save() async {
    setState(() => _isSaving = true);
    try {
      await AppScope.apiOf(context).manualAttendance(
        workPointId: widget.workPointId,
        workerId: _workerId,
        date: _date.toIso8601String().substring(0, 10),
        checkedInAt: _combine(_date, _inTime).toIso8601String(),
        checkedOutAt: _outTime == null
            ? null
            : _combine(_date, _outTime!).toIso8601String(),
      );
      if (mounted) Navigator.pop(context, true);
    } catch (error) {
      if (mounted) {
        showSnack(context, errorMessage(error, 'Failed to add attendance.'));
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Manual attendance'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              initialValue: _workerId,
              decoration: const InputDecoration(labelText: 'Worker'),
              items: widget.workers
                  .map(
                    (worker) => DropdownMenuItem(
                      value: worker.id,
                      child: Text(worker.username),
                    ),
                  )
                  .toList(),
              onChanged: (value) =>
                  setState(() => _workerId = value ?? _workerId),
            ),
            const SizedBox(height: 10),
            _DialogDateButton(
              label: 'Date',
              value: formatDate(_date.toIso8601String()),
              onTap: () async {
                final value = await showDatePicker(
                  context: context,
                  firstDate: DateTime(2020),
                  lastDate: DateTime(2100),
                  initialDate: _date,
                );
                if (value != null) setState(() => _date = value);
              },
            ),
            _DialogDateButton(
              label: 'Check in',
              value: _inTime.format(context),
              onTap: () async {
                final value = await showTimePicker(
                  context: context,
                  initialTime: _inTime,
                );
                if (value != null) setState(() => _inTime = value);
              },
            ),
            _DialogDateButton(
              label: 'Check out',
              value: _outTime?.format(context) ?? 'Open',
              onTap: () async {
                final value = await showTimePicker(
                  context: context,
                  initialTime: _outTime ?? TimeOfDay.now(),
                );
                if (value != null) setState(() => _outTime = value);
              },
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _isSaving ? null : _save,
          child: Text(_isSaving ? 'Saving...' : 'Add'),
        ),
      ],
    );
  }
}

class _CheckoutDialog extends StatefulWidget {
  const _CheckoutDialog({required this.record});

  final AttendanceRecord record;

  @override
  State<_CheckoutDialog> createState() => _CheckoutDialogState();
}

class _CheckoutDialogState extends State<_CheckoutDialog> {
  late DateTime _dateTime =
      DateTime.tryParse(widget.record.checkedOutAt ?? '')?.toLocal() ??
      DateTime.now();
  bool _isSaving = false;

  Future<void> _save() async {
    setState(() => _isSaving = true);
    try {
      await AppScope.apiOf(
        context,
      ).updateCheckout(widget.record.id, _dateTime.toUtc().toIso8601String());
      if (mounted) Navigator.pop(context, true);
    } catch (error) {
      if (mounted) {
        showSnack(context, errorMessage(error, 'Failed to set checkout.'));
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Set checkout'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _DialogDateButton(
            label: 'Date',
            value: formatDate(_dateTime.toIso8601String()),
            onTap: () async {
              final date = await showDatePicker(
                context: context,
                firstDate: DateTime(2020),
                lastDate: DateTime(2100),
                initialDate: _dateTime,
              );
              if (date != null) {
                setState(
                  () => _dateTime = DateTime(
                    date.year,
                    date.month,
                    date.day,
                    _dateTime.hour,
                    _dateTime.minute,
                  ),
                );
              }
            },
          ),
          _DialogDateButton(
            label: 'Time',
            value: TimeOfDay.fromDateTime(_dateTime).format(context),
            onTap: () async {
              final time = await showTimePicker(
                context: context,
                initialTime: TimeOfDay.fromDateTime(_dateTime),
              );
              if (time != null) {
                setState(
                  () => _dateTime = DateTime(
                    _dateTime.year,
                    _dateTime.month,
                    _dateTime.day,
                    time.hour,
                    time.minute,
                  ),
                );
              }
            },
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _isSaving ? null : _save,
          child: Text(_isSaving ? 'Saving...' : 'Save'),
        ),
      ],
    );
  }
}

class _DialogDateButton extends StatelessWidget {
  const _DialogDateButton({
    required this.label,
    required this.value,
    required this.onTap,
  });

  final String label;
  final String value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(label),
      subtitle: Text(value),
      trailing: const Icon(Icons.edit_calendar_outlined),
      onTap: onTap,
    );
  }
}

DateTime _combine(DateTime date, TimeOfDay time) {
  return DateTime(date.year, date.month, date.day, time.hour, time.minute);
}

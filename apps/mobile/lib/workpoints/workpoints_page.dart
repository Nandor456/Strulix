import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/app_scope.dart';
import '../core/formatters.dart';
import '../core/i18n.dart';
import '../core/models.dart';
import '../core/widgets.dart';

class WorkpointsPage extends StatefulWidget {
  const WorkpointsPage({super.key});

  @override
  State<WorkpointsPage> createState() => _WorkpointsPageState();
}

class _WorkpointsPageState extends State<WorkpointsPage> {
  bool _isLoading = true;
  String? _error;
  List<WorkPointSummary> _workPoints = const [];
  List<WorkerSummary> _workers = const [];

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
    try {
      final results = await Future.wait([
        api.listWorkPoints(),
        api.listWorkers(),
      ]);
      setState(() {
        _workPoints = results[0] as List<WorkPointSummary>;
        _workers = results[1] as List<WorkerSummary>;
      });
    } catch (error) {
      setState(
        () => _error = errorMessage(error, 'Failed to load workpoints.'),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _delete(WorkPointSummary workPoint) async {
    final api = AppScope.apiOf(context);
    final l10n = context.l10n;
    final confirmed = await confirmAction(
      context,
      title: l10n.t('Delete workpoint'),
      message: l10n.t(
        'Delete {name}? Attendance, assignments, and the workpoint chat will be removed.',
        {'name': workPoint.name},
      ),
      confirmLabel: l10n.t('Delete'),
      destructive: true,
    );
    if (!confirmed) return;
    await api.deleteWorkPoint(workPoint.id);
    await _load();
  }

  Future<void> _showForm({WorkPointSummary? workPoint}) async {
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (context) =>
          _WorkPointFormSheet(workPoint: workPoint, workers: _workers),
    );
    if (saved == true) await _load();
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
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.t('Workpoints'),
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      l10n.t(
                        'Browse job sites and manage workers, attendance, and QR tools.',
                      ),
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              IconButton.filled(
                tooltip: l10n.t('New workpoint'),
                onPressed: () => _showForm(),
                icon: const Icon(Icons.add),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_isLoading)
            LoadingView(label: l10n.t('Loading workpoints...'))
          else if (_error != null)
            ErrorBanner(_error!)
          else if (_workPoints.isEmpty)
            EmptyState(
              icon: Icons.business_outlined,
              title: l10n.t('No workpoints yet'),
              message: l10n.t('Create one to start assigning workers.'),
            )
          else
            ..._workPoints.map(
              (workPoint) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Card(
                  child: ListTile(
                    leading: const CircleAvatar(
                      child: Icon(Icons.business_outlined),
                    ),
                    title: Text(workPoint.name),
                    subtitle: Text(
                      '${workPoint.address}\n'
                      '${l10n.t('Workers')}: ${workPoint.workerCount} · '
                      '${l10n.t('Attendance')}: ${workPoint.attendanceCount} · '
                      '${l10n.t('Deadline')}: ${formatDate(workPoint.deadline)}',
                    ),
                    isThreeLine: true,
                    onTap: () => context.go('/workpoints/${workPoint.id}'),
                    trailing: PopupMenuButton<String>(
                      onSelected: (value) {
                        if (value == 'edit') _showForm(workPoint: workPoint);
                        if (value == 'delete') _delete(workPoint);
                      },
                      itemBuilder: (context) => [
                        PopupMenuItem(
                          value: 'edit',
                          child: Text(l10n.t('Edit')),
                        ),
                        PopupMenuItem(
                          value: 'delete',
                          child: Text(l10n.t('Delete')),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _WorkPointFormSheet extends StatefulWidget {
  const _WorkPointFormSheet({required this.workers, this.workPoint});

  final WorkPointSummary? workPoint;
  final List<WorkerSummary> workers;

  @override
  State<_WorkPointFormSheet> createState() => _WorkPointFormSheetState();
}

class _WorkPointFormSheetState extends State<_WorkPointFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final _name = TextEditingController(text: widget.workPoint?.name ?? '');
  late final _address = TextEditingController(
    text: widget.workPoint?.address ?? '',
  );
  late final _description = TextEditingController(
    text: widget.workPoint?.description ?? '',
  );
  String _deadline = '';
  final Set<String> _workerIds = {};
  bool _isSaving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final deadline = widget.workPoint?.deadline;
    if (deadline != null) {
      _deadline =
          DateTime.tryParse(deadline)?.toIso8601String().substring(0, 10) ?? '';
    }
  }

  @override
  void dispose() {
    _name.dispose();
    _address.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _pickDeadline() async {
    final initial = DateTime.tryParse(_deadline) ?? DateTime.now();
    final date = await showDatePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
      initialDate: initial,
    );
    if (date != null) {
      setState(() => _deadline = date.toIso8601String().substring(0, 10));
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _isSaving = true;
      _error = null;
    });

    final payload = {
      'name': _name.text.trim(),
      'address': _address.text.trim(),
      'description': _description.text.trim().isEmpty
          ? null
          : _description.text.trim(),
      'deadline': _deadline.isEmpty
          ? null
          : DateTime.parse('${_deadline}T00:00:00').toIso8601String(),
      if (widget.workPoint == null) 'workerIds': _workerIds.toList(),
    };

    try {
      if (widget.workPoint == null) {
        final created = await AppScope.apiOf(context).createWorkPoint(payload);
        if (mounted) {
          Navigator.pop(context, true);
          context.go('/workpoints/${created.id}');
        }
      } else {
        await AppScope.apiOf(
          context,
        ).updateWorkPoint(widget.workPoint!.id, payload);
        if (mounted) Navigator.pop(context, true);
      }
    } catch (error) {
      setState(() => _error = errorMessage(error, 'Failed to save workpoint.'));
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final isCreate = widget.workPoint == null;
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 16,
          bottom: MediaQuery.viewInsetsOf(context).bottom + 16,
        ),
        child: SingleChildScrollView(
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  isCreate
                      ? l10n.t('Create workpoint')
                      : l10n.t('Edit workpoint'),
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _name,
                  decoration: InputDecoration(labelText: l10n.t('Name')),
                  validator: (value) => (value ?? '').trim().isEmpty
                      ? l10n.t('Name is required.')
                      : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _address,
                  decoration: InputDecoration(
                    labelText: l10n.t('Address'),
                    helperText: l10n.t(
                      'Coordinates are generated automatically from the address.',
                    ),
                  ),
                  validator: (value) => (value ?? '').trim().isEmpty
                      ? l10n.t('Address is required.')
                      : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _description,
                  minLines: 2,
                  maxLines: 4,
                  decoration: InputDecoration(labelText: l10n.t('Description')),
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: _pickDeadline,
                  icon: const Icon(Icons.calendar_month_outlined),
                  label: Text(
                    _deadline.isEmpty
                        ? l10n.t('Choose deadline')
                        : '${l10n.t('Deadline')}: ${formatDate(_deadline)}',
                  ),
                ),
                if (isCreate) ...[
                  const SizedBox(height: 12),
                  Text(
                    l10n.t('Initial workers'),
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  const SizedBox(height: 8),
                  if (widget.workers.isEmpty)
                    Text(l10n.t('No workers available.'))
                  else
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: widget.workers
                          .map(
                            (worker) => FilterChip(
                              label: Text(worker.username),
                              selected: _workerIds.contains(worker.id),
                              onSelected: (selected) {
                                setState(() {
                                  if (selected) {
                                    _workerIds.add(worker.id);
                                  } else {
                                    _workerIds.remove(worker.id);
                                  }
                                });
                              },
                            ),
                          )
                          .toList(),
                    ),
                ],
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  ErrorBanner(_error!),
                ],
                const SizedBox(height: 16),
                FilledButton.icon(
                  onPressed: _isSaving ? null : _save,
                  icon: _isSaving
                      ? const SizedBox.square(
                          dimension: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.save_outlined),
                  label: Text(_isSaving ? l10n.t('Saving...') : l10n.t('Save')),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

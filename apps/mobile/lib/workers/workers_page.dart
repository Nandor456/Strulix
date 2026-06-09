import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:open_filex/open_filex.dart';

import '../core/app_scope.dart';
import '../core/formatters.dart';
import '../core/i18n.dart';
import '../core/models.dart';
import '../core/widgets.dart';

class WorkersPage extends StatefulWidget {
  const WorkersPage({super.key});

  @override
  State<WorkersPage> createState() => _WorkersPageState();
}

class _WorkersPageState extends State<WorkersPage> {
  bool _isLoading = true;
  String? _error;
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
    try {
      final workers = await AppScope.apiOf(context).listWorkers();
      setState(() => _workers = workers);
    } catch (error) {
      setState(
        () => _error = errorMessage(
          error,
          context.l10n.t('Failed to load workers.'),
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _edit(WorkerSummary worker) async {
    final saved = await showDialog<bool>(
      context: context,
      builder: (context) => _EditWorkerDialog(worker: worker),
    );
    if (saved == true) await _load();
  }

  Future<void> _delete(WorkerSummary worker) async {
    final api = AppScope.apiOf(context);
    final l10n = context.l10n;
    final confirmed = await confirmAction(
      context,
      title: l10n.t('Delete team member'),
      message: l10n.t('Delete {name}? This action cannot be undone.', {
        'name': worker.username,
      }),
      confirmLabel: l10n.t('Delete'),
      destructive: true,
    );
    if (!confirmed) return;
    await api.deleteWorker(worker.id);
    await _load();
  }

  Future<void> _documents(WorkerSummary worker) async {
    await showDialog<void>(
      context: context,
      builder: (context) => _WorkerDocumentsDialog(worker: worker),
    );
  }

  @override
  Widget build(BuildContext context) {
    final canManageAccounts = AppScope.authOf(context).canManageUsers;
    final l10n = context.l10n;
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            l10n.t('Team members'),
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 4),
          Text(
            l10n.t(
              'Manage registered workers and leaders, wages, and documents.',
            ),
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 16),
          if (_isLoading)
            LoadingView(label: l10n.t('Loading workers...'))
          else if (_error != null)
            ErrorBanner(_error!)
          else if (_workers.isEmpty)
            EmptyState(
              icon: Icons.groups_outlined,
              title: l10n.t('No workers or leaders registered yet'),
            )
          else
            ..._workers.map(
              (worker) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Card(
                  child: ListTile(
                    leading: const CircleAvatar(
                      child: Icon(Icons.person_outline),
                    ),
                    title: Text(worker.username),
                    subtitle: Text(
                      '${worker.email}\n'
                      '${l10n.roleLabel(worker.role)} · '
                      '${l10n.t('Workpoints {count}', {'count': '${worker.assignedWorkPointCount}'})} · '
                      '${worker.hourlyWage == null ? l10n.t('No wage') : l10n.t('{amount} RON/h', {'amount': worker.hourlyWage!.toStringAsFixed(2)})}',
                    ),
                    isThreeLine: true,
                    trailing: PopupMenuButton<String>(
                      onSelected: (value) {
                        if (value == 'documents') _documents(worker);
                        if (value == 'edit') _edit(worker);
                        if (value == 'delete') _delete(worker);
                      },
                      itemBuilder: (context) => [
                        PopupMenuItem(
                          value: 'documents',
                          child: Text(l10n.t('Documents')),
                        ),
                        if (canManageAccounts)
                          PopupMenuItem(
                            value: 'edit',
                            child: Text(l10n.t('Edit')),
                          ),
                        if (canManageAccounts)
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

class _EditWorkerDialog extends StatefulWidget {
  const _EditWorkerDialog({required this.worker});

  final WorkerSummary worker;

  @override
  State<_EditWorkerDialog> createState() => _EditWorkerDialogState();
}

class _EditWorkerDialogState extends State<_EditWorkerDialog> {
  late final _username = TextEditingController(text: widget.worker.username);
  late final _email = TextEditingController(text: widget.worker.email);
  late final _wage = TextEditingController(
    text: widget.worker.hourlyWage == null
        ? ''
        : widget.worker.hourlyWage.toString(),
  );
  late String _role = widget.worker.role == 'ADMIN'
      ? 'LEADER'
      : widget.worker.role;
  bool _isSaving = false;
  String? _error;

  @override
  void dispose() {
    _username.dispose();
    _email.dispose();
    _wage.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() {
      _isSaving = true;
      _error = null;
    });
    try {
      await AppScope.apiOf(context).updateWorker(widget.worker.id, {
        'username': _username.text.trim(),
        'email': _email.text.trim(),
        'role': _role,
        'hourlyWage': _wage.text.trim().isEmpty
            ? null
            : double.tryParse(_wage.text.trim()),
      });
      if (mounted) Navigator.pop(context, true);
    } catch (error) {
      setState(
        () => _error = errorMessage(
          error,
          context.l10n.t('Failed to update worker.'),
        ),
      );
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return AlertDialog(
      title: Text(l10n.t('Edit team member')),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _username,
              decoration: InputDecoration(labelText: l10n.t('Username')),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              decoration: InputDecoration(labelText: l10n.t('Email')),
            ),
            const SizedBox(height: 10),
            DropdownButtonFormField<String>(
              initialValue: _role,
              decoration: InputDecoration(labelText: l10n.t('Role')),
              items: [
                DropdownMenuItem(
                  value: 'WORKER',
                  child: Text(l10n.roleLabel('WORKER')),
                ),
                DropdownMenuItem(
                  value: 'LEADER',
                  child: Text(l10n.roleLabel('LEADER')),
                ),
              ],
              onChanged: (value) => setState(() => _role = value ?? 'WORKER'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _wage,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              decoration: InputDecoration(
                labelText: l10n.t('Hourly wage (RON)'),
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 10),
              ErrorBanner(_error!),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: Text(l10n.t('Cancel')),
        ),
        FilledButton(
          onPressed: _isSaving ? null : _save,
          child: Text(_isSaving ? l10n.t('Saving...') : l10n.t('Save')),
        ),
      ],
    );
  }
}

class _WorkerDocumentsDialog extends StatefulWidget {
  const _WorkerDocumentsDialog({required this.worker});

  final WorkerSummary worker;

  @override
  State<_WorkerDocumentsDialog> createState() => _WorkerDocumentsDialogState();
}

class _WorkerDocumentsDialogState extends State<_WorkerDocumentsDialog> {
  bool _isLoading = true;
  bool _isUploading = false;
  String? _error;
  List<WorkerDocumentSummary> _documents = const [];

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
    try {
      final documents = await AppScope.apiOf(
        context,
      ).listWorkerDocuments(widget.worker.id);
      setState(() => _documents = documents);
    } catch (error) {
      setState(
        () => _error = errorMessage(
          error,
          context.l10n.t('Failed to load documents.'),
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _upload() async {
    final api = AppScope.apiOf(context);
    final result = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'png', 'jpg', 'jpeg', 'webp'],
      withData: false,
    );
    final file = result?.files.single;
    final path = file?.path;
    if (file == null || path == null) return;

    setState(() => _isUploading = true);
    try {
      await api.uploadWorkerDocument(
        workerId: widget.worker.id,
        path: path,
        filename: file.name,
      );
      await _load();
    } catch (error) {
      if (mounted) {
        showSnack(
          context,
          errorMessage(error, context.l10n.t('Failed to upload document.')),
        );
      }
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  Future<void> _open(WorkerDocumentSummary document) async {
    final api = AppScope.apiOf(context);
    final file = await api.downloadWorkerDocument(document);
    await OpenFilex.open(file.path);
  }

  Future<void> _delete(WorkerDocumentSummary document) async {
    final api = AppScope.apiOf(context);
    final l10n = context.l10n;
    final confirmed = await confirmAction(
      context,
      title: l10n.t('Delete document'),
      message: l10n.t('Delete {name}?', {'name': document.originalName}),
      confirmLabel: l10n.t('Delete'),
      destructive: true,
    );
    if (!confirmed) return;
    await api.deleteWorkerDocument(document.id);
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return AlertDialog(
      title: Text(
        l10n.t('Documents for {name}', {'name': widget.worker.username}),
      ),
      content: SizedBox(
        width: 520,
        child: _isLoading
            ? LoadingView(label: l10n.t('Loading documents...'))
            : _error != null
            ? ErrorBanner(_error!)
            : _documents.isEmpty
            ? EmptyState(
                icon: Icons.description_outlined,
                title: l10n.t('No documents'),
              )
            : ListView.builder(
                shrinkWrap: true,
                itemCount: _documents.length,
                itemBuilder: (context, index) {
                  final document = _documents[index];
                  return ListTile(
                    leading: Icon(
                      document.isImage
                          ? Icons.image_outlined
                          : Icons.description_outlined,
                    ),
                    title: Text(document.originalName),
                    subtitle: Text(
                      '${formatFileSize(document.sizeBytes)} · ${formatDateTime(document.createdAt)}',
                    ),
                    trailing: PopupMenuButton<String>(
                      onSelected: (value) {
                        if (value == 'open') _open(document);
                        if (value == 'delete') _delete(document);
                      },
                      itemBuilder: (context) => [
                        PopupMenuItem(
                          value: 'open',
                          child: Text(l10n.t('Open')),
                        ),
                        PopupMenuItem(
                          value: 'delete',
                          child: Text(l10n.t('Delete')),
                        ),
                      ],
                    ),
                  );
                },
              ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text(l10n.t('Close')),
        ),
        FilledButton.icon(
          onPressed: _isUploading ? null : _upload,
          icon: _isUploading
              ? const SizedBox.square(
                  dimension: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.upload_file),
          label: Text(_isUploading ? l10n.t('Uploading...') : l10n.t('Upload')),
        ),
      ],
    );
  }
}

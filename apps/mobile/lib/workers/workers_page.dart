import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:open_filex/open_filex.dart';

import '../core/app_scope.dart';
import '../core/formatters.dart';
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
      setState(() => _error = errorMessage(error, 'Failed to load workers.'));
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
    final confirmed = await confirmAction(
      context,
      title: 'Delete worker',
      message: 'Delete ${worker.username}? This action cannot be undone.',
      confirmLabel: 'Delete',
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
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Workers', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 4),
          Text(
            'Manage registered workers and their documents.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 16),
          if (_isLoading)
            const LoadingView(label: 'Loading workers...')
          else if (_error != null)
            ErrorBanner(_error!)
          else if (_workers.isEmpty)
            const EmptyState(
              icon: Icons.groups_outlined,
              title: 'No workers registered yet',
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
                      '${worker.role} · Workpoints ${worker.assignedWorkPointCount} · '
                      '${worker.hourlyWage == null ? 'No wage' : '${worker.hourlyWage!.toStringAsFixed(2)} RON/h'}',
                    ),
                    isThreeLine: true,
                    trailing: PopupMenuButton<String>(
                      onSelected: (value) {
                        if (value == 'documents') _documents(worker);
                        if (value == 'edit') _edit(worker);
                        if (value == 'delete') _delete(worker);
                      },
                      itemBuilder: (context) => [
                        const PopupMenuItem(
                          value: 'documents',
                          child: Text('Documents'),
                        ),
                        if (canManageAccounts)
                          const PopupMenuItem(
                            value: 'edit',
                            child: Text('Edit'),
                          ),
                        if (canManageAccounts)
                          const PopupMenuItem(
                            value: 'delete',
                            child: Text('Delete'),
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
      setState(() => _error = errorMessage(error, 'Failed to update worker.'));
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Edit worker'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _username,
              decoration: const InputDecoration(labelText: 'Username'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Email'),
            ),
            const SizedBox(height: 10),
            DropdownButtonFormField<String>(
              initialValue: _role,
              decoration: const InputDecoration(labelText: 'Role'),
              items: const [
                DropdownMenuItem(value: 'WORKER', child: Text('Worker')),
                DropdownMenuItem(value: 'LEADER', child: Text('Leader')),
              ],
              onChanged: (value) => setState(() => _role = value ?? 'WORKER'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _wage,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              decoration: const InputDecoration(labelText: 'Hourly wage (RON)'),
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
      setState(() => _error = errorMessage(error, 'Failed to load documents.'));
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
      if (mounted)
        showSnack(context, errorMessage(error, 'Failed to upload document.'));
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
    final confirmed = await confirmAction(
      context,
      title: 'Delete document',
      message: 'Delete ${document.originalName}?',
      confirmLabel: 'Delete',
      destructive: true,
    );
    if (!confirmed) return;
    await api.deleteWorkerDocument(document.id);
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Documents for ${widget.worker.username}'),
      content: SizedBox(
        width: 520,
        child: _isLoading
            ? const LoadingView(label: 'Loading documents...')
            : _error != null
            ? ErrorBanner(_error!)
            : _documents.isEmpty
            ? const EmptyState(
                icon: Icons.description_outlined,
                title: 'No documents',
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
                      itemBuilder: (context) => const [
                        PopupMenuItem(value: 'open', child: Text('Open')),
                        PopupMenuItem(value: 'delete', child: Text('Delete')),
                      ],
                    ),
                  );
                },
              ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Close'),
        ),
        FilledButton.icon(
          onPressed: _isUploading ? null : _upload,
          icon: _isUploading
              ? const SizedBox.square(
                  dimension: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.upload_file),
          label: Text(_isUploading ? 'Uploading...' : 'Upload'),
        ),
      ],
    );
  }
}

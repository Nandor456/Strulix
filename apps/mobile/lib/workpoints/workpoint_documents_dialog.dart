import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:open_filex/open_filex.dart';

import '../core/app_scope.dart';
import '../core/formatters.dart';
import '../core/i18n.dart';
import '../core/models.dart';
import '../core/widgets.dart';

class WorkPointDocumentsDialog extends StatefulWidget {
  const WorkPointDocumentsDialog({
    required this.workPointId,
    required this.workPointName,
    required this.canManage,
    super.key,
  });

  final String workPointId;
  final String workPointName;
  final bool canManage;

  @override
  State<WorkPointDocumentsDialog> createState() =>
      _WorkPointDocumentsDialogState();
}

class _WorkPointDocumentsDialogState extends State<WorkPointDocumentsDialog> {
  bool _isLoading = true;
  bool _isUploading = false;
  String? _error;
  List<WorkPointDocumentSummary> _documents = const [];

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
      ).listWorkPointDocuments(widget.workPointId);
      setState(() => _documents = documents);
    } catch (error) {
      if (mounted) {
        setState(
          () => _error = errorMessage(
            error,
            context.l10n.t('Failed to load workpoint documents.'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _upload() async {
    final api = AppScope.apiOf(context);
    final l10n = context.l10n;
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
      await api.uploadWorkPointDocument(
        workPointId: widget.workPointId,
        path: path,
        filename: file.name,
      );
      await _load();
    } catch (error) {
      if (mounted) {
        showSnack(context, errorMessage(error, l10n.t('Failed to upload document.')));
      }
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  Future<void> _open(WorkPointDocumentSummary document) async {
    final file = await AppScope.apiOf(context).downloadWorkPointDocument(document);
    await OpenFilex.open(file.path);
  }

  Future<void> _delete(WorkPointDocumentSummary document) async {
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
    await api.deleteWorkPointDocument(document.id);
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return AlertDialog(
      title: Text(
        l10n.t('Documents for {name}', {'name': widget.workPointName}),
      ),
      content: SizedBox(
        width: 560,
        child: _isLoading
            ? LoadingView(label: l10n.t('Loading documents...'))
            : _error != null
            ? ErrorBanner(_error!)
            : _documents.isEmpty
            ? EmptyState(
                icon: Icons.description_outlined,
                title: l10n.t('No documents'),
                message: l10n.t('No documents uploaded for this workpoint.'),
              )
            : ListView.builder(
                shrinkWrap: true,
                itemCount: _documents.length,
                itemBuilder: (context, index) {
                  final document = _documents[index];
                  final uploadedBy = document.uploadedBy;
                  final subtitleParts = [
                    formatFileSize(document.sizeBytes),
                    formatDateTime(document.createdAt),
                    if (uploadedBy != null)
                      l10n.t('by {name}', {'name': uploadedBy.username}),
                  ];

                  return ListTile(
                    leading: Icon(
                      document.isImage
                          ? Icons.image_outlined
                          : Icons.description_outlined,
                    ),
                    title: Text(
                      document.originalName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    subtitle: Text(subtitleParts.join(' · ')),
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
                        if (widget.canManage)
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
        if (widget.canManage)
          FilledButton.icon(
            onPressed: _isUploading ? null : _upload,
            icon: _isUploading
                ? const SizedBox.square(
                    dimension: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.upload_file),
            label: Text(l10n.t(_isUploading ? 'Uploading...' : 'Upload')),
          ),
      ],
    );
  }
}

import 'package:flutter/material.dart';
import 'package:open_filex/open_filex.dart';

import '../core/app_scope.dart';
import '../core/formatters.dart';
import '../core/i18n.dart';
import '../core/models.dart';
import '../core/widgets.dart';

class DocumentsPage extends StatefulWidget {
  const DocumentsPage({super.key});

  @override
  State<DocumentsPage> createState() => _DocumentsPageState();
}

class _DocumentsPageState extends State<DocumentsPage> {
  bool _isLoading = true;
  String? _error;
  List<WorkerDocumentSummary> _documents = const [];
  WorkerDocumentSummary? _selected;

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
      final documents = await AppScope.apiOf(context).listMyDocuments();
      setState(() {
        _documents = documents;
        _selected = _selected == null && documents.isNotEmpty
            ? documents.first
            : _selected;
      });
    } catch (error) {
      setState(
        () => _error = errorMessage(error, 'Failed to load your documents.'),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _open(WorkerDocumentSummary document) async {
    final file = await AppScope.apiOf(context).downloadWorkerDocument(document);
    await OpenFilex.open(file.path);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            l10n.t('Documents'),
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 4),
          Text(
            l10n.t(
              'Preview and download documents shared with your worker profile.',
            ),
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 16),
          if (_isLoading)
            LoadingView(label: l10n.t('Loading documents...'))
          else if (_error != null)
            ErrorBanner(_error!)
          else if (_documents.isEmpty)
            EmptyState(
              icon: Icons.description_outlined,
              title: l10n.t('No documents'),
              message: l10n.t('No documents have been shared with you yet.'),
            )
          else ...[
            SectionCard(
              title: l10n.t('Your documents'),
              child: Column(
                children: _documents
                    .map(
                      (document) => ListTile(
                        contentPadding: EdgeInsets.zero,
                        selected: _selected?.id == document.id,
                        leading: CircleAvatar(
                          child: Icon(
                            document.isImage
                                ? Icons.image_outlined
                                : Icons.description_outlined,
                          ),
                        ),
                        title: Text(
                          document.originalName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        subtitle: Text(
                          '${_kind(context, document)} · ${formatFileSize(document.sizeBytes)}',
                        ),
                        onTap: () => setState(() => _selected = document),
                        trailing: IconButton(
                          tooltip: l10n.t('Open'),
                          onPressed: () => _open(document),
                          icon: const Icon(Icons.open_in_new),
                        ),
                      ),
                    )
                    .toList(),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ],
      ),
    );
  }

  String _kind(BuildContext context, WorkerDocumentSummary document) {
    final l10n = context.l10n;
    if (document.isPdf) return l10n.t('PDF');
    if (document.isImage) return l10n.t('Image');
    return l10n.t('File');
  }
}

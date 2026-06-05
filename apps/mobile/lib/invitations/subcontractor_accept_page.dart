import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/app_scope.dart';
import '../core/i18n.dart';
import '../core/models.dart';
import '../core/widgets.dart';

class SubcontractorAcceptPage extends StatefulWidget {
  const SubcontractorAcceptPage({required this.token, super.key});

  final String token;

  @override
  State<SubcontractorAcceptPage> createState() =>
      _SubcontractorAcceptPageState();
}

class _SubcontractorAcceptPageState extends State<SubcontractorAcceptPage> {
  bool _isSaving = false;
  String? _error;
  SubcontractorAccess? _accepted;

  Future<void> _accept() async {
    if (widget.token.isEmpty) {
      setState(() => _error = context.l10n.t('Invitation link is invalid.'));
      return;
    }

    setState(() {
      _isSaving = true;
      _error = null;
    });

    try {
      final accepted = await AppScope.apiOf(
        context,
      ).acceptSubcontractorInvitation(widget.token);
      if (mounted) setState(() => _accepted = accepted);
    } catch (error) {
      if (mounted) {
        setState(
          () => _error = errorMessage(
            error,
            context.l10n.t('Failed to accept invitation.'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final accepted = _accepted;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        SectionCard(
          title: l10n.t('Subcontractor invitation'),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (accepted != null)
                Text(
                  l10n.t('Subcontractor invitation accepted.'),
                  style: Theme.of(context).textTheme.titleMedium,
                )
              else
                Text(l10n.t('Accept invitation')),
              if (accepted != null) ...[
                const SizedBox(height: 8),
                Text('${accepted.ownerCompany.name} · ${accepted.status}'),
              ],
              if (_error != null) ...[
                const SizedBox(height: 12),
                ErrorBanner(_error!),
              ],
              const SizedBox(height: 16),
              if (accepted == null)
                FilledButton.icon(
                  onPressed: _isSaving ? null : _accept,
                  icon: _isSaving
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.check_circle_outline),
                  label: Text(
                    _isSaving ? l10n.t('Accepting...') : l10n.t('Accept'),
                  ),
                )
              else
                FilledButton(
                  onPressed: () => context.go('/invitations'),
                  child: Text(l10n.t('Back to invitations')),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

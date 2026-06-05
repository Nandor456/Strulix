import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../core/app_scope.dart';
import '../core/formatters.dart';
import '../core/i18n.dart';
import '../core/models.dart';
import '../core/widgets.dart';

class InvitationsPage extends StatefulWidget {
  const InvitationsPage({super.key});

  @override
  State<InvitationsPage> createState() => _InvitationsPageState();
}

class _InvitationsPageState extends State<InvitationsPage> {
  final _email = TextEditingController();
  final _subcontractorEmail = TextEditingController();
  String _role = 'WORKER';
  String _mode = 'users';
  bool _isLoading = true;
  bool _isSubmitting = false;
  bool _isSubmittingSubcontractor = false;
  String? _error;
  List<Invitation> _invitations = const [];
  List<SubcontractorAccess> _subcontractors = const [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    _email.dispose();
    _subcontractorEmail.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final api = AppScope.apiOf(context);
      final results = await Future.wait([
        api.listInvitations(),
        api.listSubcontractors(),
      ]);
      setState(() {
        _invitations = results[0] as List<Invitation>;
        _subcontractors = results[1] as List<SubcontractorAccess>;
      });
    } catch (error) {
      setState(
        () => _error = errorMessage(error, 'Failed to load invitations.'),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _create() async {
    final email = _email.text.trim();
    if (email.isEmpty) return;
    setState(() => _isSubmitting = true);
    try {
      await AppScope.apiOf(context).createInvitation(email: email, role: _role);
      _email.clear();
      _role = 'WORKER';
      await _load();
    } catch (error) {
      if (mounted) {
        showSnack(context, errorMessage(error, 'Failed to send invitation.'));
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _createSubcontractor() async {
    final email = _subcontractorEmail.text.trim();
    if (email.isEmpty) return;
    setState(() => _isSubmittingSubcontractor = true);
    try {
      await AppScope.apiOf(
        context,
      ).createSubcontractorInvitation(invitedAdminEmail: email);
      _subcontractorEmail.clear();
      await _load();
    } catch (error) {
      if (mounted) {
        showSnack(context, errorMessage(error, 'Failed to send invitation.'));
      }
    } finally {
      if (mounted) setState(() => _isSubmittingSubcontractor = false);
    }
  }

  Future<void> _revoke(Invitation invitation) async {
    await AppScope.apiOf(context).revokeInvitation(invitation.id);
    await _load();
  }

  Future<void> _revokeSubcontractor(SubcontractorAccess access) async {
    await AppScope.apiOf(context).revokeSubcontractor(access.id);
    await _load();
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
            l10n.t('Invitations'),
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 4),
          Text(
            l10n.t(
              'Invite new users by email. Each invitation carries a role and one-time registration link.',
            ),
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 16),
          SegmentedButton<String>(
            segments: [
              ButtonSegment(
                value: 'users',
                icon: const Icon(Icons.person_outline),
                label: Text(l10n.t('Users')),
              ),
              ButtonSegment(
                value: 'subcontractors',
                icon: const Icon(Icons.business_outlined),
                label: Text(l10n.t('Subcontractors')),
              ),
            ],
            selected: {_mode},
            onSelectionChanged: (selection) =>
                setState(() => _mode = selection.first),
          ),
          const SizedBox(height: 16),
          if (_mode == 'users')
            SectionCard(
              title: l10n.t('Invite a new user'),
              child: Column(
                children: [
                  TextField(
                    controller: _email,
                    keyboardType: TextInputType.emailAddress,
                    decoration: InputDecoration(
                      labelText: l10n.t('Email address'),
                    ),
                  ),
                  const SizedBox(height: 12),
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
                    onChanged: (value) =>
                        setState(() => _role = value ?? 'WORKER'),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: _isSubmitting ? null : _create,
                      icon: _isSubmitting
                          ? const SizedBox.square(
                              dimension: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.send),
                      label: Text(
                        _isSubmitting
                            ? l10n.t('Sending...')
                            : l10n.t('Send invitation'),
                      ),
                    ),
                  ),
                ],
              ),
            )
          else
            SectionCard(
              title: l10n.t('Invite a subcontractor company'),
              subtitle: l10n.t(
                'Use the registered admin email of that company.',
              ),
              child: Column(
                children: [
                  TextField(
                    controller: _subcontractorEmail,
                    keyboardType: TextInputType.emailAddress,
                    decoration: InputDecoration(
                      labelText: l10n.t('Admin email address'),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: _isSubmittingSubcontractor
                          ? null
                          : _createSubcontractor,
                      icon: _isSubmittingSubcontractor
                          ? const SizedBox.square(
                              dimension: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.send),
                      label: Text(
                        _isSubmittingSubcontractor
                            ? l10n.t('Sending...')
                            : l10n.t('Send invitation'),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 16),
          if (_isLoading)
            LoadingView(label: l10n.t('Loading invitations...'))
          else if (_error != null)
            ErrorBanner(_error!)
          else if (_mode == 'users' && _invitations.isEmpty)
            EmptyState(
              icon: Icons.mail_outline,
              title: l10n.t('No invitations'),
              message: l10n.t('Use the form above to invite your first user.'),
            )
          else if (_mode == 'subcontractors' && _subcontractors.isEmpty)
            EmptyState(
              icon: Icons.business_outlined,
              title: l10n.t('No subcontractor invitations'),
              message: l10n.t('Use the form above to invite a company.'),
            )
          else if (_mode == 'users')
            ..._invitations.map(
              (invitation) =>
                  _InvitationCard(invitation: invitation, onRevoke: _revoke),
            )
          else
            ..._subcontractors.map(
              (access) => _SubcontractorCard(
                access: access,
                onRevoke: _revokeSubcontractor,
              ),
            ),
        ],
      ),
    );
  }
}

class _InvitationCard extends StatelessWidget {
  const _InvitationCard({required this.invitation, required this.onRevoke});

  final Invitation invitation;
  final Future<void> Function(Invitation invitation) onRevoke;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final canRevoke = invitation.status == 'pending';

    return Card(
      margin: const EdgeInsets.only(bottom: 14), // space between cards
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const CircleAvatar(child: Icon(Icons.mail_outline)),
                const SizedBox(width: 12),

                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        invitation.email,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        l10n.roleLabel(invitation.role),
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),

                Chip(
                  label: Text(l10n.invitationStatusLabel(invitation.status)),
                ),
              ],
            ),

            const SizedBox(height: 16),

            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                Chip(
                  avatar: const Icon(Icons.schedule, size: 16),
                  label: Text(
                    l10n.t('Sent {date}', {
                      'date': formatDateTime(invitation.createdAt),
                    }),
                  ),
                ),
                Chip(
                  avatar: const Icon(Icons.timer_off, size: 16),
                  label: Text(
                    l10n.t('Expires {date}', {
                      'date': formatDateTime(invitation.expiresAt),
                    }),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton.icon(
                  onPressed: canRevoke
                      ? () async {
                          await Clipboard.setData(
                            ClipboardData(text: invitation.inviteUrl),
                          );

                          if (context.mounted) {
                            showSnack(
                              context,
                              l10n.t('Invitation link copied.'),
                            );
                          }
                        }
                      : null,
                  icon: const Icon(Icons.copy),
                  label: Text(l10n.t('Copy')),
                ),

                const SizedBox(width: 8),

                FilledButton.tonalIcon(
                  onPressed: canRevoke ? () => onRevoke(invitation) : null,
                  icon: const Icon(Icons.delete_outline),
                  label: Text(l10n.t('Revoke')),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _SubcontractorCard extends StatelessWidget {
  const _SubcontractorCard({required this.access, required this.onRevoke});

  final SubcontractorAccess access;
  final Future<void> Function(SubcontractorAccess access) onRevoke;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final canCopy = access.status == 'pending';
    final canRevoke = access.status == 'pending';

    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const CircleAvatar(child: Icon(Icons.business_outlined)),
                const SizedBox(width: 12),

                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        access.subcontractorCompany.name,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        access.invitedAdminEmail,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),

                Chip(label: Text(l10n.invitationStatusLabel(access.status))),
              ],
            ),

            const SizedBox(height: 16),

            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                Chip(
                  avatar: const Icon(Icons.schedule, size: 16),
                  label: Text(
                    l10n.t('Sent {date}', {
                      'date': formatDateTime(access.createdAt),
                    }),
                  ),
                ),
                Chip(
                  avatar: const Icon(Icons.timer_off, size: 16),
                  label: Text(
                    l10n.t('Expires {date}', {
                      'date': formatDateTime(access.expiresAt),
                    }),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton.icon(
                  onPressed: canCopy
                      ? () async {
                          await Clipboard.setData(
                            ClipboardData(text: access.acceptUrl),
                          );

                          if (context.mounted) {
                            showSnack(
                              context,
                              l10n.t('Invitation link copied.'),
                            );
                          }
                        }
                      : null,
                  icon: const Icon(Icons.copy),
                  label: Text(l10n.t('Copy')),
                ),

                const SizedBox(width: 8),

                FilledButton.tonalIcon(
                  onPressed: canRevoke ? () => onRevoke(access) : null,
                  icon: const Icon(Icons.delete_outline),
                  label: Text(l10n.t('Revoke')),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../auth/auth_controller.dart';
import 'app_scope.dart';
import 'i18n.dart';
import 'widgets.dart';

class AppShell extends StatefulWidget {
  const AppShell({required this.location, required this.child, super.key});

  final String location;
  final Widget child;

  static AuthController auth(BuildContext context) => AppScope.authOf(context);

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  String? _primedMessagingUserId;
  bool _primeScheduled = false;

  @override
  void initState() {
    super.initState();
    _scheduleMessagingPrime();
  }

  @override
  void didUpdateWidget(covariant AppShell oldWidget) {
    super.didUpdateWidget(oldWidget);
    _scheduleMessagingPrime();
  }

  void _scheduleMessagingPrime() {
    if (_primeScheduled) return;
    _primeScheduled = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _primeScheduled = false;
      if (mounted) _primeMessaging();
    });
  }

  void _primeMessaging() {
    final auth = AppScope.authOf(context);
    final userId = auth.user?.id;
    if (userId == null) {
      _primedMessagingUserId = null;
      return;
    }
    if (_primedMessagingUserId == userId) return;
    _primedMessagingUserId = userId;
    unawaited(_loadMessagingFor(userId));
  }

  Future<void> _loadMessagingFor(String userId) async {
    final messaging = AppScope.messagingOf(context);
    try {
      await messaging.connect();
      await messaging.loadChats();
    } catch (error) {
      debugPrint('Failed to prime messaging state: $error');
      if (_primedMessagingUserId == userId) _primedMessagingUserId = null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = AppScope.authOf(context);
    final messaging = AppScope.messagingOf(context);
    final l10n = context.l10n;
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.t('BuildPulse'))),
      drawer: Drawer(
        child: SafeArea(
          child: Column(
            children: [
              ListTile(
                contentPadding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
                leading: Image.asset(
                  'assets/images/buildpulselogo.png',
                  width: 48,
                  height: 48,
                ),
                title: Text(
                  l10n.t('BuildPulse'),
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                subtitle: user == null
                    ? null
                    : Text(
                        '${user.username} · ${l10n.roleLabel(user.role.wireName)}',
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                trailing: const Icon(Icons.settings_outlined),
                onTap: () => _go(context, '/settings'),
              ),
              Expanded(
                child: ListView(
                  padding: EdgeInsets.zero,
                  children: [
                    if (auth.isAttendanceParticipant)
                      _NavTile(
                        icon: Icons.home_outlined,
                        label: l10n.t('Home'),
                        selected: widget.location == '/',
                        onTap: () => _go(context, '/'),
                      ),
                    if (auth.isAttendanceParticipant)
                      _NavTile(
                        icon: Icons.qr_code_scanner,
                        label: l10n.t('Scan QR'),
                        selected: widget.location.startsWith('/scan'),
                        onTap: () => _go(context, '/scan'),
                      ),
                    if (auth.isAttendanceParticipant)
                      _NavTile(
                        icon: Icons.description_outlined,
                        label: l10n.t('Documents'),
                        selected: widget.location.startsWith('/documents'),
                        onTap: () => _go(context, '/documents'),
                      ),
                    _NavTile(
                      icon: Icons.event_available_outlined,
                      label: l10n.t('Leave Calendar'),
                      selected: widget.location.startsWith('/leave-calendar'),
                      onTap: () => _go(context, '/leave-calendar'),
                    ),
                    AnimatedBuilder(
                      animation: messaging,
                      builder: (context, _) => _NavTile(
                        icon: Icons.chat_bubble_outline,
                        label: l10n.t('Messages'),
                        selected: widget.location.startsWith('/messages'),
                        badgeCount: messaging.totalUnreadCount,
                        onTap: () => _go(context, '/messages'),
                      ),
                    ),
                    if (auth.canManageWorkPoints)
                      _NavTile(
                        icon: Icons.business_outlined,
                        label: l10n.t('Workpoints'),
                        selected: widget.location.startsWith('/workpoints'),
                        onTap: () => _go(context, '/workpoints'),
                      ),
                    if (auth.canViewWorkers)
                      _NavTile(
                        icon: Icons.groups_outlined,
                        label: l10n.t('Team'),
                        selected: widget.location.startsWith('/workers'),
                        onTap: () => _go(context, '/workers'),
                      ),
                    if (auth.canManageUsers)
                      _NavTile(
                        icon: Icons.mail_outline,
                        label: l10n.t('User Invitations'),
                        selected: widget.location.startsWith('/invitations'),
                        onTap: () => _go(context, '/invitations'),
                      ),
                  ],
                ),
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.logout),
                title: Text(l10n.t('Log out')),
                onTap: () async {
                  Navigator.pop(context);
                  final messaging = AppScope.messagingOf(context);
                  final confirmed = await confirmAction(
                    context,
                    title: l10n.t('Log out'),
                    message: l10n.t('Are you sure you want to log out?'),
                    confirmLabel: l10n.t('Log out'),
                  );
                  if (!confirmed) return;
                  messaging.disconnect();
                  await auth.logout();
                  if (context.mounted) context.go('/login');
                },
              ),
            ],
          ),
        ),
      ),
      body: widget.child,
    );
  }

  void _go(BuildContext context, String path) {
    Navigator.pop(context);
    context.go(path);
  }
}

class _NavTile extends StatelessWidget {
  const _NavTile({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
    this.badgeCount = 0,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final int badgeCount;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon),
      title: Text(label),
      trailing: badgeCount > 0
          ? Badge(label: Text(badgeCount > 99 ? '99+' : '$badgeCount'))
          : null,
      selected: selected,
      selectedTileColor: Theme.of(
        context,
      ).colorScheme.primaryContainer.withValues(alpha: 0.55),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      onTap: onTap,
    );
  }
}

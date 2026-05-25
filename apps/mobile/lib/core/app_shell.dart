import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../auth/auth_controller.dart';
import 'app_scope.dart';
import 'i18n.dart';
import 'widgets.dart';

class AppShell extends StatelessWidget {
  const AppShell({required this.location, required this.child, super.key});

  final String location;
  final Widget child;

  static AuthController auth(BuildContext context) => AppScope.authOf(context);

  @override
  Widget build(BuildContext context) {
    final auth = AppScope.authOf(context);
    final theme = AppScope.themeOf(context);
    final l10n = context.l10n;
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('BuildPulse'),
        actions: [
          const AppLanguageMenuButton(),
          IconButton(
            tooltip: l10n.t(theme.isDark ? 'Light theme' : 'Dark theme'),
            onPressed: theme.toggle,
            icon: Icon(theme.isDark ? Icons.light_mode : Icons.dark_mode),
          ),
        ],
      ),
      drawer: Drawer(
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
                child: Row(
                  children: [
                    Image.asset(
                      'assets/images/buildpulselogo.png',
                      width: 48,
                      height: 48,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'BuildPulse',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          if (user != null)
                            Text(
                              '${user.username} · ${l10n.roleLabel(user.role.wireName)}',
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView(
                  padding: EdgeInsets.zero,
                  children: [
                    if (auth.isWorker)
                      _NavTile(
                        icon: Icons.home_outlined,
                        label: l10n.t('Home'),
                        selected: location == '/',
                        onTap: () => _go(context, '/'),
                      ),
                    if (auth.isWorker)
                      _NavTile(
                        icon: Icons.qr_code_scanner,
                        label: l10n.t('Scan QR'),
                        selected: location.startsWith('/scan'),
                        onTap: () => _go(context, '/scan'),
                      ),
                    if (auth.isWorker)
                      _NavTile(
                        icon: Icons.description_outlined,
                        label: l10n.t('Documents'),
                        selected: location.startsWith('/documents'),
                        onTap: () => _go(context, '/documents'),
                      ),
                    _NavTile(
                      icon: Icons.chat_bubble_outline,
                      label: l10n.t('Messages'),
                      selected: location.startsWith('/messages'),
                      onTap: () => _go(context, '/messages'),
                    ),
                    if (auth.canManageWorkPoints)
                      _NavTile(
                        icon: Icons.business_outlined,
                        label: l10n.t('Workpoints'),
                        selected: location.startsWith('/workpoints'),
                        onTap: () => _go(context, '/workpoints'),
                      ),
                    if (auth.canViewWorkers)
                      _NavTile(
                        icon: Icons.groups_outlined,
                        label: l10n.t('Workers'),
                        selected: location.startsWith('/workers'),
                        onTap: () => _go(context, '/workers'),
                      ),
                    if (auth.canManageUsers)
                      _NavTile(
                        icon: Icons.mail_outline,
                        label: l10n.t('User Invitations'),
                        selected: location.startsWith('/invitations'),
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
                  final confirmed = await confirmAction(
                    context,
                    title: l10n.t('Log out'),
                    message: l10n.t('Are you sure you want to log out?'),
                    confirmLabel: 'Log out',
                  );
                  if (!confirmed) return;
                  AppScope.messagingOf(context).disconnect();
                  await auth.logout();
                  if (context.mounted) context.go('/login');
                },
              ),
            ],
          ),
        ),
      ),
      body: child,
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
  });

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon),
      title: Text(label),
      selected: selected,
      selectedTileColor: Theme.of(
        context,
      ).colorScheme.primaryContainer.withValues(alpha: 0.55),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      onTap: onTap,
    );
  }
}

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/app_scope.dart';
import '../core/i18n.dart';
import '../core/models.dart';
import '../core/widgets.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  late Future<BillingStatusResponse>? _billingFuture;
  bool _loadedBilling = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_loadedBilling) return;
    _loadedBilling = true;
    final auth = AppScope.authOf(context);
    _billingFuture = auth.user?.role == UserRole.admin
        ? AppScope.apiOf(context).billingStatus()
        : null;
  }

  @override
  Widget build(BuildContext context) {
    final auth = AppScope.authOf(context);
    final user = auth.user;
    final l10n = context.l10n;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(l10n.t('Settings'), style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 4),
        Text(
          l10n.t('Manage your account preferences and workspace settings.'),
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 16),
        SectionCard(
          title: l10n.t('Profile'),
          subtitle: user == null
              ? null
              : '${user.username} · ${user.email}\n${l10n.roleLabel(user.role.wireName)}',
          child: const SizedBox.shrink(),
        ),
        const SizedBox(height: 12),
        const _ThemeSettingsCard(),
        const SizedBox(height: 12),
        const _LanguageSettingsCard(),
        if (user?.role == UserRole.admin) ...[
          const SizedBox(height: 12),
          _BillingSettingsCard(future: _billingFuture!),
        ],
      ],
    );
  }
}

class _ThemeSettingsCard extends StatelessWidget {
  const _ThemeSettingsCard();

  @override
  Widget build(BuildContext context) {
    final theme = AppScope.themeOf(context);
    final l10n = context.l10n;

    return AnimatedBuilder(
      animation: theme,
      builder: (context, _) {
        return SectionCard(
          title: l10n.t('Theme'),
          subtitle: l10n.t('Choose how BuildPulse looks on this device.'),
          child: Column(
            children: [
              _ChoiceTile(
                icon: Icons.brightness_auto_outlined,
                label: l10n.t('System theme'),
                selected: theme.mode == ThemeMode.system,
                onTap: () => theme.setMode(ThemeMode.system),
              ),
              _ChoiceTile(
                icon: Icons.light_mode_outlined,
                label: l10n.t('Light theme'),
                selected: theme.mode == ThemeMode.light,
                onTap: () => theme.setMode(ThemeMode.light),
              ),
              _ChoiceTile(
                icon: Icons.dark_mode_outlined,
                label: l10n.t('Dark theme'),
                selected: theme.mode == ThemeMode.dark,
                onTap: () => theme.setMode(ThemeMode.dark),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _LanguageSettingsCard extends StatelessWidget {
  const _LanguageSettingsCard();

  @override
  Widget build(BuildContext context) {
    final language = AppScope.languageOf(context);
    final l10n = context.l10n;

    return AnimatedBuilder(
      animation: language,
      builder: (context, _) {
        return SectionCard(
          title: l10n.t('Language'),
          subtitle: l10n.t('Choose the language used across the app.'),
          child: Column(
            children: AppLanguage.values
                .map(
                  (value) => _ChoiceTile(
                    icon: Icons.translate,
                    label: value.label,
                    selected: language.language == value,
                    onTap: () => language.setLanguage(value),
                  ),
                )
                .toList(),
          ),
        );
      },
    );
  }
}

class _BillingSettingsCard extends StatelessWidget {
  const _BillingSettingsCard({required this.future});

  final Future<BillingStatusResponse> future;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return SectionCard(
      title: l10n.t('Billing'),
      subtitle: l10n.t('Manage your BuildPulse subscription and user-based billing.'),
      child: FutureBuilder<BillingStatusResponse>(
        future: future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(child: CircularProgressIndicator()),
            );
          }

          if (snapshot.hasError) {
            return ErrorBanner(errorMessage(snapshot.error!, 'Failed to load billing status.'));
          }

          final data = snapshot.requireData;
          final active = _isBillingActive(data.billingStatus);
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Wrap(
                spacing: 8,
                runSpacing: 8,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  Chip(label: Text(l10n.t(data.billingStatus))),
                  Text(
                    data.paymentProvider == 'stripe'
                        ? 'Stripe'
                        : l10n.t('No payment provider'),
                  ),
                ],
              ),
              if (!active) ...[
                const SizedBox(height: 12),
                ErrorBanner(
                  l10n.t(
                    'Your subscription is not active. Operational changes are paused until billing is fixed.',
                  ),
                ),
              ],
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _BillingMetric(
                      label: l10n.t('Paid seats'),
                      value: data.paidSeatCount.toString(),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _BillingMetric(
                      label: l10n.t('Active users'),
                      value: data.activeUserCount.toString(),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              FilledButton.icon(
                onPressed: data.hasStripeCustomer
                    ? () => _openBillingPortal(context)
                    : null,
                icon: const Icon(Icons.open_in_new),
                label: Text(l10n.t('Manage billing')),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _openBillingPortal(BuildContext context) async {
    try {
      final url = await AppScope.apiOf(context).createBillingPortalSession();
      final launched = await launchUrl(
        Uri.parse(url),
        mode: LaunchMode.externalApplication,
      );
      if (!launched && context.mounted) {
        showSnack(context, context.l10n.t('Could not open billing portal.'));
      }
    } catch (error) {
      if (context.mounted) {
        showSnack(context, errorMessage(error, 'Failed to open billing portal'));
      }
    }
  }
}

bool _isBillingActive(String status) {
  return status == 'ACTIVE' || status == 'TRIALING';
}

class _ChoiceTile extends StatelessWidget {
  const _ChoiceTile({
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
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon),
      title: Text(label),
      trailing: selected ? const Icon(Icons.check) : null,
      selected: selected,
      onTap: onTap,
    );
  }
}

class _BillingMetric extends StatelessWidget {
  const _BillingMetric({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: colors.outlineVariant),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label.toUpperCase(), style: Theme.of(context).textTheme.labelSmall),
          const SizedBox(height: 4),
          Text(value, style: Theme.of(context).textTheme.titleLarge),
        ],
      ),
    );
  }
}

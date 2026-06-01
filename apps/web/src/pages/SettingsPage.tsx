import {
  Check,
  CreditCard,
  ExternalLink,
  Languages,
  Palette,
  User,
  Users,
} from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";
import { useBillingPortal, useBillingStatus } from "@/hooks/useBilling";
import { useI18n } from "@/hooks/useI18n";
import { APP_LANGUAGE_LABELS, APP_LANGUAGES } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";
import { isBillingActive } from "@/lib/billing";
import { cn } from "@/lib/utils";
import { useThemeMode, type ThemeMode } from "@/theme/useThemeMode";

export default function SettingsPage() {
  const { user } = useAuth();
  const { language, setLanguage, t, roleLabel } = useI18n();
  const { mode, setMode } = useThemeMode();
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">{t("Settings")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("Manage your account preferences and workspace settings.")}
        </p>
      </div>

      <div className="grid gap-4">
        <section className="rounded-md border bg-card p-5">
          <div className="flex items-start gap-3">
            <User className="mt-0.5 h-5 w-5 text-primary" />
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">{t("Profile")}</h2>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {user?.username} · {user?.email}
              </p>
              {user?.role && (
                <Badge variant="secondary" className="mt-3">
                  {roleLabel(user.role)}
                </Badge>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-md border bg-card p-5">
          <div className="mb-4 flex items-center gap-3">
            <Palette className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">{t("Theme")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("Choose how BuildPulse looks on this device.")}
              </p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {(["light", "dark"] as ThemeMode[]).map((value) => (
              <OptionButton
                key={value}
                active={mode === value}
                label={value === "light" ? t("Light theme") : t("Dark theme")}
                onClick={() => setMode(value)}
              />
            ))}
          </div>
        </section>

        <section className="rounded-md border bg-card p-5">
          <div className="mb-4 flex items-center gap-3">
            <Languages className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">{t("Language")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("Choose the language used across the app.")}
              </p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {APP_LANGUAGES.map((value) => (
              <OptionButton
                key={value}
                active={language === value}
                label={APP_LANGUAGE_LABELS[value]}
                onClick={() => setLanguage(value)}
              />
            ))}
          </div>
        </section>

        {isAdmin && <BillingSettingsSection />}
      </div>
    </div>
  );
}

function BillingSettingsSection() {
  const { t } = useI18n();
  const { data, isLoading, error } = useBillingStatus(true);
  const portalMutation = useBillingPortal();
  const active = isBillingActive(data?.billingStatus);

  async function openPortal() {
    const session = await portalMutation.mutateAsync(
      `${window.location.origin}/settings`,
    );
    window.location.href = session.url;
  }

  return (
    <section className="rounded-md border bg-card p-5">
      <div className="mb-4 flex items-center gap-3">
        <CreditCard className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">{t("Billing")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("Manage your BuildPulse subscription and user-based billing.")}
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner size={28} />
        </div>
      )}

      {error && !isLoading && (
        <Alert variant="destructive">{t("Failed to load billing status.")}</Alert>
      )}

      {data && (
        <div className="grid gap-4 md:grid-cols-[1fr_0.8fr]">
          <div className="rounded-md border bg-background p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">{t("Current status")}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant={active ? "success" : "destructive"}>
                    {t(data.billingStatus)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {data.paymentProvider === "stripe"
                      ? "Stripe"
                      : t("No payment provider")}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => void openPortal()}
                disabled={!data.hasStripeCustomer || portalMutation.isPending}
              >
                {portalMutation.isPending ? (
                  <Spinner size={16} />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                {t("Manage billing")}
              </Button>
            </div>

            {!active && (
              <Alert variant="destructive" className="mt-5">
                {t(
                  "Your subscription is not active. Operational changes are paused until billing is fixed.",
                )}
              </Alert>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Metric label={t("Paid seats")} value={data.paidSeatCount.toString()} />
              <Metric
                label={t("Active users")}
                value={data.activeUserCount.toString()}
              />
            </div>

            <p className="mt-5 text-sm text-muted-foreground">
              {data.paidUntil
                ? t("Current period ends {date}", {
                    date: formatDateTime(data.paidUntil),
                  })
                : t("No current billing period is available.")}
            </p>
          </div>

          <div className="rounded-md border bg-background p-4">
            <Users className="h-8 w-8 text-primary" />
            <h3 className="mt-4 text-lg font-semibold">
              {t("€3 per active user each month")}
            </h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {t(
                "BuildPulse updates Stripe when invited users accept or when users are removed, including prorated monthly changes.",
              )}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function OptionButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "outline"}
      className={cn("h-11 justify-between rounded-md px-3", active && "border-primary/40")}
      aria-pressed={active}
      onClick={onClick}
    >
      <span>{label}</span>
      {active && <Check className="h-4 w-4" />}
    </Button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

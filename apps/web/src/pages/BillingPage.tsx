import { CreditCard, ExternalLink, Users } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useBillingPortal, useBillingStatus } from "@/hooks/useBilling";
import { useI18n } from "@/hooks/useI18n";
import { formatDateTime } from "@/lib/format";
import { isBillingActive } from "@/lib/billing";

export default function BillingPage() {
  const { t } = useI18n();
  const { data, isLoading, error } = useBillingStatus();
  const portalMutation = useBillingPortal();

  async function openPortal() {
    const returnUrl = window.location.href;
    const session = await portalMutation.mutateAsync(returnUrl);
    window.location.href = session.url;
  }

  const active = isBillingActive(data?.billingStatus);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <CreditCard className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-semibold">{t("Billing")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("Manage your BuildPulse subscription and user-based billing.")}
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size={36} />
        </div>
      )}

      {error && !isLoading && (
        <Alert variant="destructive">
          {t("Failed to load billing status.")}
        </Alert>
      )}

      {data && (
        <div className="grid gap-4 md:grid-cols-[1fr_0.8fr]">
          <section className="rounded-md border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">{t("Current status")}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant={active ? "success" : "destructive"}>
                    {t(data.billingStatus)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {data.paymentProvider === "stripe" ? "Stripe" : t("No payment provider")}
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
                {t("Your subscription is not active. Operational changes are paused until billing is fixed.")}
              </Alert>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Metric
                label={t("Paid seats")}
                value={data.paidSeatCount.toString()}
              />
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
          </section>

          <section className="rounded-md border bg-card p-5">
            <Users className="h-8 w-8 text-primary" />
            <h2 className="mt-4 text-lg font-semibold">
              {t("€3 per active user each month")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {t("BuildPulse updates Stripe when invited users accept or when users are removed, including prorated monthly changes.")}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

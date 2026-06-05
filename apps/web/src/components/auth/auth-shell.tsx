import type { ReactNode } from "react";
import {
  CalendarDays,
  CreditCard,
  MessageSquareText,
  QrCode,
} from "lucide-react";

import buildPulseLogo from "@/assets/buildpulselogo.png";
import { PublicHeader } from "@/components/public-header";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/hooks/useI18n";

type AuthShellProps = {
  modeLabel: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

const capabilityKeys = [
  "QR attendance",
  "Messaging",
  "Leave Calendar",
  "Billing",
] as const;

const platformHighlights = [
  {
    icon: QrCode,
    title: "Workpoint control",
    description:
      "Workers scan on site while managers review hours, missing check-outs, and Excel exports.",
  },
  {
    icon: MessageSquareText,
    title: "Messaging",
    description:
      "Strulix keeps field work, office review, and worker self-service connected without adding another messy spreadsheet.",
  },
  {
    icon: CalendarDays,
    title: "Leave Calendar",
    description: "Review employee leave requests and approved absences.",
  },
  {
    icon: CreditCard,
    title: "Billing",
    description: "Manage your Strulix subscription and user-based billing.",
  },
] as const;

export function AuthShell({
  modeLabel,
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      <main className="min-h-[calc(100svh-4rem)] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="mx-auto grid max-w-7xl gap-6 lg:min-h-[calc(100svh-9rem)] lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,500px)] lg:items-stretch">
          <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-gradient-to-br from-secondary/30 via-card to-muted/20 px-6 py-7 shadow-[0_32px_80px_-56px_rgba(15,23,42,0.45)] sm:px-8 sm:py-9 lg:px-10 lg:py-10">
            <div className="absolute inset-y-0 right-0 hidden w-px bg-border/70 lg:block" />
            <div className="flex h-full flex-col">
              <Badge variant="outline" className="w-fit bg-background/70 backdrop-blur">
                {t("Built for the daily rhythm of construction work")}
              </Badge>

              <div className="mt-8 flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-card/85 shadow-sm">
                  <img
                    src={buildPulseLogo}
                    alt={t("Strulix logo")}
                    className="h-10 w-10 rounded-lg"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
                    {t("Strulix")}
                  </p>
                  <h1 className="mt-2 max-w-xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                    {t("Team operations")}
                  </h1>
                </div>
              </div>

              <p className="mt-6 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                {t(
                  "Strulix keeps field work, office review, and worker self-service connected without adding another messy spreadsheet.",
                )}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {capabilityKeys.map((key) => (
                  <Badge
                    key={key}
                    variant="outline"
                    className="bg-background/65 px-3 py-1 text-[0.72rem] uppercase tracking-[0.14em] text-muted-foreground backdrop-blur"
                  >
                    {t(key)}
                  </Badge>
                ))}
              </div>

              <div className="mt-10 grid gap-5 border-t border-border/70 pt-6 sm:grid-cols-2">
                {platformHighlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <h2 className="text-base font-semibold text-foreground">
                          {t(item.title)}
                        </h2>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {t(item.description)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-card/95 shadow-[0_28px_72px_-48px_rgba(15,23,42,0.5)]">
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary/12 via-primary/6 to-transparent" />
            <div className="relative flex h-full flex-col px-6 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
              <div className="mb-8 flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-background/90 shadow-sm">
                  <img
                    src={buildPulseLogo}
                    alt={t("Strulix logo")}
                    className="h-9 w-9 rounded-lg"
                  />
                </div>
                <div className="min-w-0">
                  <Badge variant="secondary" className="mb-3 bg-secondary/80 text-secondary-foreground">
                    {modeLabel}
                  </Badge>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    {title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
                    {subtitle}
                  </p>
                </div>
              </div>

              <div className="flex-1">{children}</div>

              {footer ? (
                <div className="mt-8 border-t border-border/70 pt-5 text-sm text-muted-foreground">
                  {footer}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

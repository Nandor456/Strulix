import {
  Building2,
  CreditCard,
  FileText,
  QrCode,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { PublicHeader } from "@/components/public-header";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/useI18n";
import { cn } from "@/lib/utils";
import Viewer from "@/components/3dlogo";


const features = [
  {
    title: "Workpoint control",
    description: "Plan and manage job sites, assigned workers, documents, and daily attendance from one place.",
    icon: Building2,
  },
  {
    title: "QR attendance",
    description: "Workers scan on site while managers review hours, missing check-outs, and Excel exports.",
    icon: QrCode,
  },
  {
    title: "Team operations",
    description: "Invite leaders and workers, keep roles clear, and organize communication around real work.",
    icon: Users,
  },
  {
    title: "Leave and documents",
    description: "Handle leave requests, worker files, and workpoint documents without spreadsheet drift.",
    icon: FileText,
  },
] as const;

const operations = [
  { label: "Workpoints", value: "12", tone: "text-blue-600 dark:text-blue-300" },
  { label: "Checked in", value: "48", tone: "text-emerald-600 dark:text-emerald-300" },
  { label: "Pending leave", value: "5", tone: "text-amber-600 dark:text-amber-300" },
] as const;

export default function LandingPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      <main>
        <section className="relative isolate min-h-[86svh] overflow-hidden border-b border-border bg-slate-950 text-white dark:bg-black">
          <Viewer />
          <div className="relative z-10 mx-auto flex min-h-[86svh] w-full max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-1 text-sm text-white/90 backdrop-blur">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                {t("Construction operations for teams in motion")}
              </div>
              <h1 className="text-4xl font-semibold sm:text-5xl lg:text-6xl">
                {t("BuildPulse")}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                {t(
                  "Coordinate workpoints, QR attendance, worker documents, leave requests, and team messaging in one focused construction operations system.",
                )}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-11 bg-white text-slate-950 hover:bg-slate-100">
                  <Link to="/register?paid=1">{t("Start for €3/user/month")}</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-11 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                  <Link to="/register">{t("Register")}</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-11 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                  <Link to="/login">{t("Login")}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-background px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold sm:text-3xl">
                {t("Simple per-user billing")}
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                {t("Start with one admin seat, then pay monthly only for users who accept invitations and join your company.")}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-md border bg-card p-5">
                <CreditCard className="h-6 w-6 text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">{t("Monthly price")}</p>
                <p className="mt-2 text-3xl font-semibold">€3</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("per active user")}</p>
              </div>
              <div className="rounded-md border bg-card p-5">
                <Users className="h-6 w-6 text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">{t("Seat updates")}</p>
                <p className="mt-2 text-lg font-semibold">{t("Automatic")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("when invitees join or users are removed")}</p>
              </div>
              <div className="rounded-md border bg-card p-5">
                <ShieldCheck className="h-6 w-6 text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">{t("Billing")}</p>
                <p className="mt-2 text-lg font-semibold">Stripe</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("secure checkout and tax handling")}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-background px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
            {operations.map((item) => (
              <div key={item.label} className="rounded-md border bg-card p-5">
                <p className="text-sm text-muted-foreground">{t(item.label)}</p>
                <p className={cn("mt-2 text-3xl font-semibold", item.tone)}>{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-background px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold sm:text-3xl">
                {t("Built for the daily rhythm of construction work")}
              </h2>
              <p className="mt-3 text-base leading-7 text-muted-foreground">
                {t(
                  "BuildPulse keeps field work, office review, and worker self-service connected without adding another messy spreadsheet.",
                )}
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article key={feature.title} className="rounded-md border bg-card p-5">
                    <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-semibold">{t(feature.title)}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {t(feature.description)}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

import {
  Building2,
  CreditCard,
  FileText,
  QrCode,
  ShieldCheck,
  Users,
  CheckCircle2,
  ChevronRight,
  Star,
  Clock,
  BarChart3,
} from "lucide-react";
import { Link } from "react-router-dom";

import { PublicHeader } from "@/components/public-header";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/useI18n";
import Viewer from "@/components/3dlogo";
import { ThreeDText } from "@/components/3dtext";

// ─── Data ────────────────────────────────────────────────────────────────────

const stats = [
  { value: "200+", label: "Construction companies" },
  { value: "5,000+", label: "Workers managed" },
  { value: "98%", label: "Attendance accuracy" },
  { value: "4", label: "Countries active" },
] as const;

const features = [
  {
    title: "Workpoint control",
    description:
      "Plan and manage job sites, assigned workers, documents, and daily attendance from one place.",
    icon: Building2,
  },
  {
    title: "QR attendance",
    description:
      "Workers scan on site while managers review hours, missing check-outs, and Excel exports.",
    icon: QrCode,
  },
  {
    title: "Team operations",
    description:
      "Invite leaders and workers, keep roles clear, and organize communication around real work.",
    icon: Users,
  },
  {
    title: "Leave and documents",
    description:
      "Handle leave requests, worker files, and workpoint documents without spreadsheet drift.",
    icon: FileText,
  },
] as const;

const steps = [
  {
    number: "01",
    title: "Set up your company",
    description:
      "Register, add your company profile, and create your first workpoint in minutes.",
    icon: Building2,
  },
  {
    number: "02",
    title: "Invite your team",
    description:
      "Send role-based invitations. Leaders and workers get exactly the access they need.",
    icon: Users,
  },
  {
    number: "03",
    title: "Go live on site",
    description:
      "Workers scan QR codes to check in. Managers see real-time attendance and clean reports.",
    icon: QrCode,
  },
] as const;

const testimonials = [
  {
    quote:
      "BuildPulse cut our daily attendance tracking from 40 minutes to under 5. The QR system just works.",
    author: "Andrei Moldovan",
    role: "Site Manager",
    company: "ConstructPro SRL",
    rating: 5,
  },
  {
    quote:
      "Finally a system that actually fits how construction teams operate. Not another spreadsheet nightmare.",
    author: "Raluca Ionescu",
    role: "Operations Director",
    company: "Acord Build",
    rating: 5,
  },
  {
    quote:
      "The document management alone saved us from three audits going sideways. Everything is where it should be.",
    author: "Cosmin Popa",
    role: "General Contractor",
    company: "TerraConstruct",
    rating: 5,
  },
] as const;

// ─── Mock App UIs (replace with real screenshots later) ──────────────────────

function MockWorkpointDashboard() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-2xl ring-1 ring-border/50">
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 border-b bg-muted/60 px-3 py-2.5 sm:px-4">
        <div className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
        <div className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-3 truncate text-xs text-muted-foreground">
          BuildPulse — Workpoints
        </span>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-3 py-3 sm:px-4">
        <p className="text-sm font-semibold">Active Workpoints</p>
        <span className="shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-500">
          3 Active
        </span>
      </div>

      {/* Workpoint rows */}
      <div className="space-y-2 p-3 sm:p-4">
        {[
          { name: "Central Office Renovation", workers: 12, progress: 67, status: "on-track" },
          { name: "Warehouse Block B", workers: 8, progress: 45, status: "on-track" },
          { name: "Residential Complex A3", workers: 19, progress: 82, status: "review" },
        ].map((wp) => (
          <div
            key={wp.name}
            className="rounded-lg border bg-background/60 p-2.5 sm:p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-xs font-medium">{wp.name}</p>
              <span
                className={`shrink-0 text-xs font-medium ${wp.status === "review" ? "text-amber-400" : "text-emerald-400"
                  }`}
              >
                {wp.status === "review" ? "⚠ Review" : "✓ On track"}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${wp.progress}%` }}
                />
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {wp.workers}w · {wp.progress}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer stat row — tighter on mobile */}
      <div className="grid grid-cols-3 divide-x border-t">
        {[
          { label: "Workers", value: "39" },
          { label: "Docs", value: "114" },
          { label: "Hrs / week", value: "1,240" },
        ].map((s) => (
          <div key={s.label} className="px-1 py-2.5 text-center sm:px-4 sm:py-3">
            <p className="text-sm font-semibold sm:text-base">{s.value}</p>
            <p className="text-[10px] text-muted-foreground sm:text-xs">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockAttendanceDashboard() {
  const workers = [
    { name: "Ion Dăvidescu", in: "07:12", out: "16:45", status: "done" },
    { name: "Mihai Popa", in: "07:08", out: null, status: "active" },
    { name: "Ana Ionescu", in: "07:31", out: "16:30", status: "done" },
    { name: "Radu Florescu", in: null, out: null, status: "absent" },
    { name: "Cristian Stan", in: "06:58", out: "15:00", status: "done" },
  ] as const;

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-2xl ring-1 ring-border/50">
      <div className="flex items-center gap-1.5 border-b bg-muted/60 px-3 py-2.5 sm:px-4">
        <div className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
        <div className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-3 truncate text-xs text-muted-foreground">
          BuildPulse — Attendance
        </span>
      </div>

      <div className="flex items-center justify-between border-b px-3 py-3 sm:px-4">
        <div>
          <p className="text-sm font-semibold">Warehouse Block B</p>
          <p className="text-xs text-muted-foreground">Today · Mon 27 Jan</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-xs font-medium text-emerald-500">4 / 5 on site</span>
        </div>
      </div>

      <div className="space-y-1.5 p-3 sm:p-4">
        {workers.map((w) => (
          <div
            key={w.name}
            className="flex items-center gap-2 rounded-md border bg-background/50 px-2.5 py-2 sm:gap-3 sm:px-3"
          >
            <div
              className={`h-2 w-2 shrink-0 rounded-full ${w.status === "active"
                ? "animate-pulse bg-emerald-400"
                : w.status === "done"
                  ? "bg-sky-400"
                  : "bg-rose-400"
                }`}
            />
            <span className="min-w-0 flex-1 truncate text-xs font-medium">
              {w.name}
            </span>
            <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground sm:gap-1.5">
              <Clock className="h-3 w-3 opacity-50" />
              <span className="tabular-nums">{w.in ?? "—"}</span>
              <ChevronRight className="h-3 w-3 opacity-30" />
              <span
                className={`tabular-nums ${w.status === "active" ? "font-medium text-emerald-400" : ""
                  }`}
              >
                {w.out ?? (w.status === "active" ? "On site" : "—")}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t px-3 py-2.5 sm:px-4">
        <span className="text-xs text-muted-foreground">
          1 absent · 0 missing checkout
        </span>
        <button className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline">
          <BarChart3 className="h-3 w-3" />
          Export XLSX
        </button>
      </div>
    </div>
  );
}

function MockDocumentsDashboard() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-2xl ring-1 ring-border/50">
      <div className="flex items-center gap-1.5 border-b bg-muted/60 px-3 py-2.5 sm:px-4">
        <div className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
        <div className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-3 truncate text-xs text-muted-foreground">
          BuildPulse — Documents
        </span>
      </div>

      <div className="flex items-center justify-between border-b px-3 py-3 sm:px-4">
        <p className="text-sm font-semibold">Worker Documents</p>
        <span className="shrink-0 rounded-md border bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          + Add file
        </span>
      </div>

      <div className="space-y-1.5 p-3 sm:p-4">
        {[
          { name: "Contract — Mihai Popa.pdf", type: "Contract", date: "2024-11-01", valid: true },
          { name: "Medical — Ion Dăvidescu.pdf", type: "Medical", date: "2024-08-15", valid: true },
          { name: "SSM Training — Ana Ionescu.pdf", type: "Training", date: "2023-12-10", valid: false },
          { name: "ID Copy — Radu Florescu.pdf", type: "Identity", date: "2025-01-20", valid: true },
        ].map((doc) => (
          <div
            key={doc.name}
            className="flex items-center gap-2.5 rounded-md border bg-background/50 px-2.5 py-2 sm:gap-3 sm:px-3"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 sm:h-8 sm:w-8">
              <FileText className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{doc.name}</p>
              <p className="text-[10px] text-muted-foreground sm:text-xs">
                {doc.type} · {doc.date}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium sm:px-2 sm:text-xs ${doc.valid
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-amber-500/10 text-amber-400"
                }`}
            >
              {doc.valid ? "Valid" : "Expired"}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t px-3 py-2.5 sm:px-4">
        <p className="text-xs text-muted-foreground">
          3 valid · 1 expiring soon · 0 missing
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { t } = useI18n();

  return (
    // overflow-x-hidden prevents any child from causing horizontal scroll
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <style>{`
        @keyframes bp-fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .bp-animate { animation: bp-fade-up 0.65s ease-out both; }
        .bp-delay-1 { animation-delay: 0.1s; }
        .bp-delay-2 { animation-delay: 0.22s; }
        .bp-delay-3 { animation-delay: 0.34s; }
        .bp-delay-4 { animation-delay: 0.46s; }
      `}</style>

      <PublicHeader />

      <main>
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        {/*
          DOM order stays text → logo for reading/accessibility.
          Mobile layout uses CSS order to place the logo panel on top.
          Desktop swaps back to the standard left-text / right-logo split.
        */}
        <section className="relative isolate overflow-hidden border-b border-border bg-stone-100 text-slate-950 dark:bg-black dark:text-white">
          <div className="mx-auto grid min-h-[86svh] w-full max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(320px,42%)] lg:gap-12 lg:px-8 lg:py-16">
            <div className="order-2 flex flex-col justify-center lg:order-1">
              {/* sr-only h1 for accessibility; ThreeDText is the visual title */}
              <h1 className="sr-only">{t("BuildPulse")}</h1>

              {/*
                Explicit height container so the Three.js canvas has
                dimensions to work with on every screen size.
                Adjust cameraPosition in ThreeDText if the text feels
                too far/close at a given breakpoint.
              */}
              <div className="bp-animate bp-delay-2 h-[40px] w-full overflow-hidden sm:h-[100px] lg:h-[120px]">
                <ThreeDText
                  className="h-full w-full"
                  text="BuildPulse"
                  position={[0, 0, 0]}
                  cameraPosition={[0, 0, 2]}
                />
              </div>

              <p className="bp-animate bp-delay-3 mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:mt-5 sm:text-base sm:leading-7 lg:text-lg dark:text-slate-300">
                {t(
                  "Coordinate workpoints, QR attendance, worker documents, leave requests, and team messaging in one focused construction operations system."
                )}
              </p>

              <div className="bp-animate bp-delay-4 mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
                <Button
                  asChild
                  size="lg"
                  className="h-11 w-full bg-slate-950 text-white hover:bg-slate-800 sm:w-auto dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                >
                  <Link to="/register?paid=1">
                    {t("Start for €3/user/month")}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-11 w-full border-slate-300 bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-950 sm:w-auto dark:border-white/30 dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <Link to="/register">{t("Register")}</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-11 w-full border-slate-300 bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-950 sm:w-auto dark:border-white/30 dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <Link to="/login">{t("Login")}</Link>
                </Button>
              </div>
            </div>

            <div className="order-1 flex items-center justify-center lg:order-2 lg:justify-end">
              <div className="relative h-[240px] w-full max-w-sm sm:h-[320px] sm:max-w-md md:h-[380px] md:max-w-lg lg:h-[min(68svh,560px)] lg:max-w-none">
                <Viewer />
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats bar ─────────────────────────────────────────────────── */}
        <section className="border-b border-border bg-muted/40 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-1 text-center"
              >
                <p className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {t(stat.value)}
                </p>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {t(stat.label)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Feature showcase 1: Workpoints ────────────────────────────── */}
        {/*
          On mobile (single column): DOM order = text → mock  ✓ natural reading order
          On desktop (2-col grid):   text on left, mock on right  ✓
          No order fix needed here.
        */}
        <section className="border-b border-border bg-background px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary sm:gap-2 sm:px-3">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span>{t("Workpoint Management")}</span>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                {t("Every job site, under control")}
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground sm:mt-4 sm:text-base">
                {t(
                  "Create workpoints for each job site, assign team members, track documents, and monitor daily attendance — all from one dashboard that updates in real time."
                )}
              </p>
              <ul className="mt-5 space-y-2.5 sm:mt-6 sm:space-y-3">
                {[
                  "Real-time worker presence by site",
                  "Per-site document storage",
                  "Role-based access per workpoint",
                  "Export attendance to Excel",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {t(item)}
                  </li>
                ))}
              </ul>
            </div>
            <MockWorkpointDashboard />
          </div>
        </section>

        {/* ── Feature showcase 2: Attendance ────────────────────────────── */}
        {/*
          Desktop layout: mock LEFT, text RIGHT (visual alternation).
          Mobile fix: text must come first in reading order.
          Solution: CSS `order` swaps visual position without changing DOM order.
            - text div: order-1 (mobile) → lg:order-2 (desktop = right column)
            - mock div: order-2 (mobile) → lg:order-1 (desktop = left column)
        */}
        <section className="border-b border-border bg-muted/20 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Text — first in DOM AND first on mobile; moves right on desktop */}
            <div className="order-1 lg:order-2">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary sm:gap-2 sm:px-3">
                <QrCode className="h-3.5 w-3.5 shrink-0" />
                <span>{t("QR Attendance")}</span>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                {t("Check-ins that actually work on site")}
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground sm:mt-4 sm:text-base">
                {t(
                  "Workers scan a QR code when they arrive and leave. Managers see real-time presence, flag missing check-outs, and export clean reports without any manual work."
                )}
              </p>
              <ul className="mt-5 space-y-2.5 sm:mt-6 sm:space-y-3">
                {[
                  "QR scan check-in and check-out",
                  "Missing check-out alerts",
                  "Daily and monthly summaries",
                  "Excel export for payroll",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {t(item)}
                  </li>
                ))}
              </ul>
            </div>

            {/* Mock — second on mobile; moves left on desktop */}
            <div className="order-2 lg:order-1">
              <MockAttendanceDashboard />
            </div>
          </div>
        </section>

        {/* ── Feature showcase 3: Documents ─────────────────────────────── */}
        {/* DOM order: text → mock  → correct on both mobile and desktop */}
        <section className="border-b border-border bg-background px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary sm:gap-2 sm:px-3">
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span>{t("Documents & Leave")}</span>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                {t("Worker files without the filing cabinet")}
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground sm:mt-4 sm:text-base">
                {t(
                  "Store contracts, medical records, training certificates, and ID documents per worker. Track expiry, handle leave requests — no spreadsheet drift, ever."
                )}
              </p>
              <ul className="mt-5 space-y-2.5 sm:mt-6 sm:space-y-3">
                {[
                  "Per-worker document storage",
                  "Expiry tracking and alerts",
                  "Leave request workflow",
                  "Accessible from any device",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {t(item)}
                  </li>
                ))}
              </ul>
            </div>
            <MockDocumentsDashboard />
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────── */}
        <section className="border-b border-border bg-muted/10 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <h2 className="text-xl font-semibold sm:text-2xl lg:text-3xl">
                {t("Up and running in minutes")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground sm:mt-3 sm:text-base">
                {t("No onboarding call needed. Three steps and your team is live.")}
              </p>
            </div>

            <div className="relative mt-10 grid gap-8 sm:mt-12 md:grid-cols-3">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.number} className="relative text-center">
                    {/* Horizontal connector — desktop only */}
                    {i < steps.length - 1 && (
                      <div className="absolute left-[calc(50%+44px)] top-7 hidden h-px w-[calc(100%-88px)] border-t border-dashed border-border md:block" />
                    )}
                    {/* Vertical connector — mobile only */}
                    {i < steps.length - 1 && (
                      <div className="absolute left-1/2 top-14 h-8 w-px -translate-x-1/2 border-l border-dashed border-border md:hidden" />
                    )}
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/5">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {step.number}
                    </p>
                    <h3 className="mt-3 text-base font-semibold">{t(step.title)}</h3>
                    <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
                      {t(step.description)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Feature card grid ─────────────────────────────────────────── */}
        <section className="border-b border-border bg-background px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <h2 className="text-xl font-semibold sm:text-2xl lg:text-3xl">
                {t("Built for the daily rhythm of construction work")}
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground sm:mt-3 sm:text-base">
                {t(
                  "BuildPulse keeps field work, office review, and worker self-service connected without adding another messy spreadsheet."
                )}
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:mt-8 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article
                    key={feature.title}
                    className="rounded-md border bg-card p-4 transition-shadow hover:shadow-md sm:p-5"
                  >
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground sm:mb-5">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-semibold sm:text-base">
                      {t(feature.title)}
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground sm:mt-3 sm:text-sm sm:leading-6">
                      {t(feature.description)}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Testimonials ──────────────────────────────────────────────── */}
        <section className="border-b border-border bg-muted/20 px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <h2 className="text-xl font-semibold sm:text-2xl lg:text-3xl">
                {t("Trusted by construction teams")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground sm:mt-3 sm:text-base">
                {t("From small contractors to mid-size operators.")}
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-6 md:grid-cols-3">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.author}
                  className="rounded-xl border bg-card p-5 transition-shadow hover:shadow-md sm:p-6"
                >
                  <div className="mb-3 flex gap-0.5 sm:mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-3.5 w-3.5 fill-amber-400 text-amber-400 sm:h-4 sm:w-4"
                      />
                    ))}
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    &ldquo;{t(testimonial.quote)}&rdquo;
                  </p>
                  <div className="mt-4 border-t pt-4">
                    <p className="text-sm font-semibold">{testimonial.author}</p>
                    <p className="text-xs text-muted-foreground">
                      {t(testimonial.role)} · {testimonial.company}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ───────────────────────────────────────────────────── */}
        <section className="border-b border-border bg-background px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 sm:gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <h2 className="text-xl font-semibold sm:text-2xl lg:text-3xl">
                {t("Simple per-user billing")}
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground sm:mt-3 sm:max-w-xl sm:text-base">
                {t(
                  "Start with one admin seat, then pay monthly only for users who accept invitations and join your company."
                )}
              </p>
            </div>

            {/* Cards: single column on mobile, 3-col on sm+ */}
            <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
              <div className="rounded-md border bg-card p-4 sm:p-5">
                <CreditCard className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                <p className="mt-3 text-sm text-muted-foreground sm:mt-4">
                  {t("Monthly price")}
                </p>
                <p className="mt-1.5 text-2xl font-semibold sm:mt-2 sm:text-3xl">€3</p>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  {t("per active user")}
                </p>
              </div>
              <div className="rounded-md border bg-card p-4 sm:p-5">
                <Users className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                <p className="mt-3 text-sm text-muted-foreground sm:mt-4">
                  {t("Seat updates")}
                </p>
                <p className="mt-1.5 text-base font-semibold sm:mt-2 sm:text-lg">
                  {t("Automatic")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  {t("when invitees join or users are removed")}
                </p>
              </div>
              <div className="rounded-md border bg-card p-4 sm:p-5">
                <ShieldCheck className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                <p className="mt-3 text-sm text-muted-foreground sm:mt-4">
                  {t("Billing")}
                </p>
                <p className="mt-1.5 text-base font-semibold sm:mt-2 sm:text-lg">
                  Stripe
                </p>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  {t("secure checkout and tax handling")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────────── */}
        <section className="bg-slate-950 px-4 py-14 text-white sm:px-6 sm:py-20 lg:px-8 dark:bg-black">
          <div className="mx-auto max-w-7xl text-center">
            <h2 className="text-2xl font-semibold sm:text-3xl lg:text-4xl">
              {t("Ready to bring your sites online?")}
            </h2>
            <p className="mt-3 text-sm text-slate-400 sm:mt-4 sm:text-base">
              {t("Start free, pay only when your team grows.")}
            </p>
            <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:mt-8 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                className="h-11 w-full bg-white text-slate-950 hover:bg-slate-100 sm:w-auto"
              >
                <Link to="/register?paid=1">
                  {t("Start for €3/user/month")}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-11 w-full border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto"
              >
                <Link to="/register">{t("Create free account")}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

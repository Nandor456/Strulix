import { Link } from "react-router-dom";

import { PublicHeader } from "@/components/public-header";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/useI18n";
import Viewer from "@/components/3dlogo";
import { ThreeDText } from "@/components/3dtext";




// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { t } = useI18n();

  const featureSections = [
    {
      eyebrow: t("QR attendance"),
      title: t("Smart Attendance"),
      description: t(
        "Employees can check in and check out by scanning a secure QR code from their phone. Attendance is linked to a specific workpoint, and check-in is only allowed when the employee is within 200 meters of that location."
      ),
      detail: t(
        "Managers can generate Excel reports for any selected period, including attendance records, total worked hours, and salary calculations."
      ),
    },
    {
      eyebrow: t("Real-time visibility"),
      title: t("Live Follow Dashboard"),
      description: t(
        "Strulix provides a real-time overview of all workpoints in one place. The dashboard is optimized for wide screens and can be displayed on a TV."
      ),
      detail: t(
        "Managers can instantly see the latest check-ins and check-outs across all locations."
      ),
    },
    {
      eyebrow: t("Team communication"),
      title: t("Integrated Chat"),
      description: t(
        "Teams can communicate directly inside Strulix through the built-in messaging system."
      ),
      detail: t(
        "This keeps work-related communication organized and reduces the need to switch between different messaging apps."
      ),
    },
    {
      eyebrow: t("Planning"),
      title: t("Leave Calendar"),
      description: t(
        "Employees can request sick leave or vacation days through the calendar."
      ),
      detail: t(
        "Managers can approve or deny requests and easily see which employees will be absent during the week."
      ),
    },
    {
      eyebrow: t("Simple onboarding"),
      title: t("Employee Invitations"),
      description: t(
        "Administrators can invite employees by entering their email address and selecting their role, such as Worker or Leader."
      ),
      detail: t(
        "The invited user receives an email and can join the company through the invitation link."
      ),
    },
    {
      eyebrow: t("Partner access"),
      title: t("Subcontractor Support"),
      description: t(
        "If a workpoint involves subcontractors, companies can invite partner companies and allow their workers to check in at the workpoint."
      ),
      detail: t(
        "Their attendance is included in the workpoint summary and reports."
      ),
    },
    {
      eyebrow: t("Employee transparency"),
      title: t("Worker View"),
      description: t(
        "Workers can track their own attendance, worked hours, and estimated salary."
      ),
      detail: t(
        "This helps avoid confusion at the end of the month and gives employees clear access to their own records."
      ),
    },
    {
      eyebrow: t("iOS and Android"),
      title: t("Mobile App"),
      description: t(
        "Strulix is available on both iOS and Android, making it easy for workers to access the platform quickly from their phones."
      ),
      detail: t(
        "The mobile experience is designed for fast attendance tracking and simple daily use."
      ),
    },
    {
      eyebrow: t("Flexible billing"),
      title: t("Simple Pricing"),
      description: t(
        "Strulix uses a flexible per-user pricing model. Each active user adds €3 to the monthly subscription."
      ),
      detail: t(
        "If a user joins in the middle of the month, the cost is calculated proportionally. For example, halfway through the month costs only €1.50 for that user."
      ),
    },
  ];

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
              <h1 className="sr-only">{t("Strulix")}</h1>

              <div className="bp-animate bp-delay-2 h-[40px] w-full overflow-hidden sm:h-[100px] lg:h-[120px]">
                <ThreeDText
                  className="h-full w-full"
                  text="Strulix"
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

        {/* ── Features Scroll Section ───────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-white px-4 py-16 text-slate-950 sm:px-6 sm:py-24 lg:px-8 dark:bg-slate-950 dark:text-white">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.06),transparent_35%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.04),transparent_35%)]" />

          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                {t("Everything your workforce needs")}
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                {t("One platform for attendance, teams, and workpoints")}
              </h2>

              <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
                {t(
                  "Strulix helps companies manage daily workforce operations with real-time visibility, mobile attendance, leave planning, messaging, and transparent reporting."
                )}
              </p>
            </div>

            <div className="mt-14 space-y-8 sm:mt-16 lg:space-y-10">
              {featureSections.map((feature, index) => {
                const reversed = index % 2 === 1;

                return (
                  <article
                    key={feature.title}
                    className="group grid overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl md:grid-cols-2 dark:border-white/10 dark:bg-white/[0.03]"
                  >
                    <div
                      className={[
                        "flex flex-col justify-center p-6 sm:p-8 lg:p-10",
                        reversed ? "md:order-2" : "",
                      ].join(" ")}
                    >
                      <div className="mb-5 flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                          {feature.eyebrow}
                        </span>
                      </div>

                      <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                        {feature.title}
                      </h3>

                      <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base dark:text-slate-300">
                        {feature.description}
                      </p>

                      <p className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                        {feature.detail}
                      </p>
                    </div>

                    <div
                      className={[
                        "relative flex min-h-[260px] items-center justify-center overflow-hidden bg-slate-950 p-6 sm:min-h-[320px] lg:min-h-[380px]",
                        reversed ? "md:order-1" : "",
                      ].join(" ")}
                    >
                      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_24%),radial-gradient(circle_at_80%_30%,white_0,transparent_18%)]" />

                      <div className="absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                      <div className="absolute inset-x-8 bottom-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                      <div className="relative flex aspect-[4/3] w-full max-w-md items-center justify-center rounded-3xl border border-white/15 bg-white/10 p-6 text-center shadow-2xl backdrop-blur">
                        <div>
                          <div className="mx-auto mb-4 h-12 w-12 rounded-2xl border border-white/20 bg-white/10" />
                          <p className="text-sm font-medium text-white">
                            {t("Image / screenshot placeholder")}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-white/60">
                            {t(
                              "Place a product screenshot, mobile mockup, dashboard preview, or illustration here."
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
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

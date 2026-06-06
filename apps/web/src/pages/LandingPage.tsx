import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  BadgeEuro,
  Building2,
  CalendarDays,
  MessageSquareText,
  QrCode,
  Smartphone,
  Tv,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

import { PublicHeader } from "@/components/public-header";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/useI18n";
import Viewer from "@/components/3dlogo";
import { ThreeDText } from "@/components/3dtext";

type LandingFeature = {
  title: string;
  eyebrow: string;
  description: string;
  imageFileName: string;
  icon: LucideIcon;
  accent: string;
  accentSoft: string;
};

const landingFeatures: LandingFeature[] = [
  {
    title: "Smart Attendance",
    eyebrow: "QR attendance",
    description:
      "Employees can check in and check out by scanning a secure QR code from their phone. Attendance is linked to a specific workpoint, and check-in is only allowed when the employee is within 200 meters of that location.\nManagers can generate Excel reports for any selected period, including attendance records, total worked hours, and salary calculations.",
    imageFileName: "smart-attendance.jpg",
    icon: QrCode,
    accent: "bg-emerald-600",
    accentSoft: "bg-emerald-600/10",
  },
  {
    title: "Live Follow Dashboard",
    eyebrow: "Real-time overview",
    description:
      "Strulix provides a real-time overview of all workpoints in one place. The dashboard is optimized for wide screens and can be displayed on a TV, allowing managers to instantly see the latest check-ins and check-outs across all locations.",
    imageFileName: "live-follow-dashboard.jpg",
    icon: Tv,
    accent: "bg-red-600",
    accentSoft: "bg-red-600/10",
  },
  {
    title: "Integrated Chat",
    eyebrow: "Team messaging",
    description:
      "Teams can communicate directly inside Strulix through the built-in messaging system. This keeps work-related communication organized and reduces the need to switch between different messaging apps.",
    imageFileName: "integrated-chat.jpg",
    icon: MessageSquareText,
    accent: "bg-emerald-600",
    accentSoft: "bg-emerald-600/10",
  },
  {
    title: "Leave Calendar",
    eyebrow: "Absence planning",
    description:
      "Employees can request sick leave or vacation days through the calendar. Managers can approve or deny requests and easily see which employees will be absent during the week, helping with planning and scheduling.",
    imageFileName: "leave-calendar.jpg",
    icon: CalendarDays,
    accent: "bg-red-600",
    accentSoft: "bg-red-600/10",
  },
  {
    title: "Employee Invitations",
    eyebrow: "Fast onboarding",
    description:
      "Administrators can invite employees by entering their email address and selecting their role, such as Worker or Leader. The invited user receives an email and can join the company through the invitation link.",
    imageFileName: "employee-invitations.jpg",
    icon: UserPlus,
    accent: "bg-emerald-600",
    accentSoft: "bg-emerald-600/10",
  },
  {
    title: "Subcontractor Support",
    eyebrow: "Partner access",
    description:
      "If a workpoint involves subcontractors, companies can invite partner companies and allow their workers to check in at the workpoint. Their attendance is included in the workpoint summary and reports.",
    imageFileName: "subcontractor-support.jpg",
    icon: Building2,
    accent: "bg-red-600",
    accentSoft: "bg-red-600/10",
  },
  {
    title: "Worker View",
    eyebrow: "Clear records",
    description:
      "Workers can track their own attendance, worked hours, and estimated salary. This helps avoid confusion at the end of the month and gives employees clear access to their own records.",
    imageFileName: "worker-view.jpg",
    icon: Users,
    accent: "bg-emerald-600",
    accentSoft: "bg-emerald-600/10",
  },
  {
    title: "Mobile App",
    eyebrow: "iOS and Android",
    description:
      "Strulix is available on both iOS and Android, making it easy for workers to access the platform quickly from their phones.",
    imageFileName: "mobile-app.jpg",
    icon: Smartphone,
    accent: "bg-red-600",
    accentSoft: "bg-red-600/10",
  },
];

const LANDING_FEATURE_IMAGE_BASE_PATH = "/landing-features";

function getLandingFeatureImageSrc(imageFileName: string) {
  return `${LANDING_FEATURE_IMAGE_BASE_PATH}/${imageFileName}`;
}

function LandingFeaturePreview({
  feature,
  isVisible,
  isReversed,
  index,
}: {
  feature: LandingFeature;
  isVisible: boolean;
  isReversed: boolean;
  index: number;
}) {
  const { t } = useI18n();
  const [imageUnavailable, setImageUnavailable] = useState(false);

  return (
    <div
      className={`flex h-full min-h-70 items-center justify-center rounded-[8px] border border-border/70 bg-muted/35 p-3 ${isReversed ? "lg:translate-x-8 xl:translate-x-12" : ""
        }`}
    >      <div
      className={`relative w-full overflow-hidden rounded-[8px] border border-border/70 bg-card shadow-sm transition duration-700 ease-out ${isVisible
        ? "translate-x-0 opacity-100"
        : isReversed
          ? "-translate-x-6 opacity-0"
          : "translate-x-6 opacity-0"
        }`}
      style={{
        transitionDelay: isVisible
          ? `${Math.min(index * 45, 180) + 120}ms`
          : "0ms",
      }}
    >
        {!imageUnavailable ? (
          <div className="flex min-h-[280px] items-center justify-center bg-card p-3 sm:min-h-[320px]">
            <img
              src={getLandingFeatureImageSrc(feature.imageFileName)}
              alt={t(feature.title)}
              className="max-h-[420px] w-full object-contain"
              loading="lazy"
              onError={() => setImageUnavailable(true)}
            />
          </div>
        ) : (
          <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-muted via-card to-secondary/45 px-6 text-center">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-[8px] text-white ${feature.accent}`}
            >
              <feature.icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t(feature.title)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("Add image")}:{" "}
                <code>{`public/landing-features/${feature.imageFileName}`}</code>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsDesktop(mq.matches);

    onChange();
    mq.addEventListener("change", onChange);

    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}

function FeatureDivider({
  index,
  total,
}: {
  index: number;
  total: number;
}) {
  return (
    <div className="relative z-10 flex h-12 items-center overflow-hidden bg-background">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border/70" />

      <div className="flex shrink-0 items-center gap-3 px-5">
        <div className="h-px w-4 bg-primary" />
        <span className="font-mono text-[9px] uppercase tracking-[4px] text-primary/70">
          {String(index + 1).padStart(2, "0")} ·{" "}
          {String(total).padStart(2, "0")}
        </span>
        <div className="h-2 w-2 rotate-45 bg-primary/40 ring-1 ring-primary/25" />
        <span className="font-mono text-[9px] uppercase tracking-[4px] text-muted-foreground/50">
          NEXT
        </span>
        <div className="h-px w-4 bg-border/70" />
      </div>

      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border/70" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { t } = useI18n();
  const isDesktop = useIsDesktop();

  const [visibleFeatureIndexes, setVisibleFeatureIndexes] = useState<Set<number>>(
    () => new Set()
  );
  const featureRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const index = Number(entry.target.getAttribute("data-feature-index"));

          if (Number.isNaN(index)) {
            return;
          }

          setVisibleFeatureIndexes((currentIndexes) => {
            if (currentIndexes.has(index)) {
              return currentIndexes;
            }

            const nextIndexes = new Set(currentIndexes);
            nextIndexes.add(index);
            return nextIndexes;
          });
        });
      },
      {
        rootMargin: "0px 0px -18% 0px",
        threshold: 0.18,
      }
    );

    featureRefs.current.forEach((node) => {
      if (node) {
        observer.observe(node);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);

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
        <section className="relative isolate overflow-hidden border-b border-border bg-background text-foreground transition-colors duration-500 ease-out">
          <div className="mx-auto grid min-h-[calc(100svh-64px)] w-full max-w-7xl items-center gap-6 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(320px,42%)] lg:gap-12 lg:px-8 lg:py-16">
            <div className="order-2 flex min-w-0 flex-col justify-center text-center lg:order-1 lg:text-left">
              <h1 className="sr-only">{t("Strulix")}</h1>

              <div className="bp-animate bp-delay-2 mx-auto h-[72px] w-full max-w-[340px] overflow-hidden sm:h-[110px] sm:max-w-[500px] lg:mx-0 lg:h-[140px]">
                <ThreeDText
                  className="h-full w-full"
                  text="Strulix"
                  position={[0, 0, 0]}
                  cameraPosition={[0, 0, 1.2]}
                />
              </div>

              <p className="bp-animate bp-delay-3 mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted-foreground transition-colors duration-500 ease-out sm:mt-5 sm:text-base sm:leading-7 lg:mx-0 lg:text-lg">
                {t(
                  "Coordinate workpoints, QR attendance, worker documents, leave requests, and team messaging in one focused construction operations system."
                )}
              </p>

              <div className="bp-animate bp-delay-4 mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  className="h-11 w-full transition-colors duration-500 ease-out sm:w-auto"
                >
                  <Link to="/register?paid=1">
                    {t("Start for €3/user/month")}
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-11 w-full border-primary/30 bg-transparent text-primary transition-colors duration-500 ease-out hover:bg-primary/10 hover:text-primary sm:w-auto"
                >
                  <Link to="/register">{t("Register")}</Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-11 w-full border-secondary-foreground/20 bg-transparent text-secondary-foreground transition-colors duration-500 ease-out hover:bg-secondary/80 hover:text-secondary-foreground sm:w-auto"
                >
                  <Link to="/login">{t("Login")}</Link>
                </Button>
              </div>
            </div>

            <div className="order-1 flex items-center justify-center lg:order-2 lg:justify-end">
              <div className="relative h-[190px] w-full max-w-[280px] sm:h-[300px] sm:max-w-md md:h-[380px] md:max-w-lg lg:h-[min(68svh,560px)] lg:max-w-none">
                <Viewer />
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature Scroll ────────────────────────────────────────────── */}
        <section className="border-b border-border bg-background text-foreground">
          <div className="relative overflow-hidden bg-muted/20 px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
            <div className="pointer-events-none absolute left-8 top-8 h-6 w-6 border-l border-t border-primary/30" />
            <div className="pointer-events-none absolute right-8 top-8 h-6 w-6 border-r border-t border-primary/30" />
            <div className="pointer-events-none absolute bottom-8 left-8 h-6 w-6 border-b border-l border-primary/30" />
            <div className="pointer-events-none absolute bottom-8 right-8 h-6 w-6 border-b border-r border-primary/30" />

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
              <span className="select-none whitespace-nowrap text-[18vw] font-black uppercase leading-none text-primary/[0.03]">
                {t("Strulix")}
              </span>
            </div>

            <div className="relative mx-auto max-w-4xl">
              <div className="mb-6 flex items-center justify-center gap-4">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary" />
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">
                  {t("Platform capabilities")}
                </p>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary" />
              </div>

              <h2 className="text-4xl font-black uppercase leading-none tracking-tight sm:text-5xl lg:text-7xl">
                {t("Everything teams need")}
              </h2>

              <h2 className="mt-2 text-4xl font-black uppercase leading-none tracking-tight text-primary sm:text-5xl lg:text-7xl">
                {t("to run workpoints with clarity.")}
              </h2>

              <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                {t(
                  "From QR attendance to subcontractor access, Strulix keeps field operations, payroll context, and team communication connected in one place."
                )}
              </p>
            </div>
          </div>

          <div className="w-full">
            {landingFeatures.map((feature, index) => {
              const Icon = feature.icon;
              const isReversed = index % 2 === 1;
              const isVisible = visibleFeatureIndexes.has(index);

              return (
                <div key={feature.title}>
                  <article
                    ref={(node) => {
                      featureRefs.current[index] = node;
                    }}
                    data-feature-index={index}
                    className="group relative overflow-hidden border-y border-border/70 bg-card/80"
                  >
                    <div
                      className={`relative flex flex-col items-stretch lg:min-h-[560px] lg:flex-row ${isReversed ? "lg:flex-row-reverse" : ""
                        }`}
                    >
                      <div
                        className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                        style={{
                          background: isReversed
                            ? "linear-gradient(270deg, transparent, hsl(var(--primary) / 0.04) 50%, transparent)"
                            : "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.04) 50%, transparent)",
                        }}
                      />

                      <div
                        className="order-2 relative min-h-[340px] w-full overflow-hidden border-b border-border/70 bg-muted/30 lg:order-none lg:min-h-0 lg:w-[57%] lg:border-b-0"
                        style={{
                          clipPath: isDesktop
                            ? isReversed
                              ? "polygon(9% 0, 100% 0, 100% 100%, 0 100%)"
                              : "polygon(0 0, 100% 0, 91% 100%, 0 100%)"
                            : "none",
                          opacity: isVisible ? 1 : 0,
                          transform: isVisible ? "scale(1)" : "scale(1.04)",
                          transition:
                            "opacity 1s ease, transform 1.2s cubic-bezier(0.16,1,0.3,1)",
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-background/70" />

                        <div
                          className={`absolute inset-0 ${isReversed
                            ? "bg-gradient-to-l from-background/95 via-background/40 to-transparent"
                            : "bg-gradient-to-r from-background/95 via-background/40 to-transparent"
                            }`}
                        />

                        <div className="relative z-10 flex w-240 h-full min-h-[340px] items-center justify-center p-4 sm:p-6 lg:min-h-[560px] lg:p-8">
                          <LandingFeaturePreview
                            feature={feature}
                            isVisible={isVisible}
                            isReversed={isReversed}
                            index={index}
                          />
                        </div>

                        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

                        <div
                          className="absolute top-6"
                          style={{
                            [isReversed ? "right" : "left"]: "20px",
                            opacity: isVisible ? 1 : 0,
                            transition: "opacity 0.6s ease 0.6s",
                          }}
                        >
                          <span className="border border-border/70 bg-background/60 px-2 py-1 font-mono text-[10px] uppercase tracking-[4px] text-muted-foreground backdrop-blur">
                            {String(index + 1).padStart(2, "0")} /{" "}
                            {String(landingFeatures.length).padStart(2, "0")}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`order-1 relative z-10 flex w-full flex-col justify-center px-6 py-10 sm:px-8 lg:order-none lg:w-[50%] lg:px-16 lg:py-24 ${isReversed ? "lg:-mr-[7%]" : "lg:-ml-[7%]"
                          }`}
                        style={{
                          opacity: isVisible ? 1 : 0,
                          transform: isVisible
                            ? "translateX(0)"
                            : isReversed
                              ? "translateX(-50px)"
                              : "translateX(50px)",
                          transition:
                            "opacity 0.9s ease 0.2s, transform 0.9s cubic-bezier(0.16,1,0.3,1) 0.2s",
                        }}
                      >
                        <div
                          className="pointer-events-none absolute select-none font-black leading-none text-transparent"
                          style={{
                            [isReversed ? "left" : "right"]: "-6px",
                            top: "50%",
                            transform: "translateY(-52%)",
                            fontSize: "clamp(90px, 18vw, 220px)",
                            WebkitTextStroke: "1px hsl(var(--primary) / 0.08)",
                            opacity: isVisible ? 1 : 0,
                            transition: "opacity 1s ease 0.4s",
                          }}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </div>

                        <div className="relative mb-7 flex items-center gap-3">
                          <div
                            className="h-0.5 bg-gradient-to-r from-primary to-primary/60 shadow-[0_0_12px_hsl(var(--primary)/0.45)]"
                            style={{
                              width: isVisible ? "48px" : "0px",
                              transition:
                                "width 0.7s cubic-bezier(0.16,1,0.3,1) 0.4s",
                            }}
                          />

                          <span className="font-mono text-[9px] uppercase tracking-[5px] text-primary">
                            {t(feature.eyebrow)}
                          </span>
                        </div>

                        <div className="relative flex items-center gap-3">
                          <span
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] text-white shadow-lg transition-transform duration-700 ${isVisible ? "scale-100" : "scale-90"
                              } ${feature.accent}`}
                          >
                            <Icon className="h-5 w-5" aria-hidden="true" />
                          </span>

                          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                            {String(index + 1).padStart(2, "0")}
                          </p>
                        </div>

                        <h3 className="relative mt-6 text-3xl font-black uppercase leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                          {t(feature.title)}
                        </h3>

                        <p className="relative mt-5 max-w-md text-sm leading-7 text-muted-foreground sm:text-base">
                          {t(feature.description)}
                        </p>
                      </div>
                    </div>
                  </article>

                  {index < landingFeatures.length - 1 && (
                    <FeatureDivider
                      index={index}
                      total={landingFeatures.length}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────────── */}
        <section className="border-t border-border bg-primary px-4 py-14 text-primary-foreground sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-center lg:gap-12">
            <div className="text-center lg:text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-foreground/70">
                {t("Simple Pricing")}
              </p>
              <h2 className="mt-3 text-2xl font-semibold sm:text-3xl lg:text-4xl">
                {t("Ready to bring your sites online?")}
              </h2>
              <p className="mt-3 text-sm text-primary-foreground/70 sm:mt-4 sm:text-base">
                {t("Start free, pay only when your team grows.")}
              </p>
              <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:mt-8 sm:flex-row sm:items-center lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  className="h-11 w-full bg-card text-card-foreground hover:bg-card/90 sm:w-auto"
                >
                  <Link to="/register?paid=1">
                    {t("Start for €3/user/month")}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-11 w-full border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground sm:w-auto"
                >
                  <Link to="/register">{t("Create free account")}</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-[8px] border border-primary-foreground/15 bg-primary-foreground/10 p-5 backdrop-blur sm:p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] bg-card text-card-foreground shadow-sm">
                  <BadgeEuro className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-foreground/70">
                    {t("Flexible billing")}
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                    {t("Start for €3/user/month")}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm leading-6 text-primary-foreground/80 sm:text-[15px]">
                <p>
                  {t(
                    "Strulix uses a flexible per-user pricing model. Each active user adds €3 to the monthly subscription."
                  )}
                </p>
                <p>
                  {t(
                    "If a user joins in the middle of the month, the cost is calculated proportionally."
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

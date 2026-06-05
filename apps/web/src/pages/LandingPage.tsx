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
  details: string[];
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
      "Employees can check in and check out by scanning a secure QR code from their phone.",
    details: [
      "Attendance is linked to a specific workpoint, and check-in is only allowed when the employee is within 200 meters of that location.",
      "Managers can generate Excel reports for any selected period, including attendance records, total worked hours, and salary calculations.",
    ],
    imageFileName: "smart-attendance.jpg",
    icon: QrCode,
    accent: "bg-emerald-600",
    accentSoft: "bg-emerald-600/10",
  },
  {
    title: "Live Follow Dashboard",
    eyebrow: "Real-time overview",
    description:
      "Strulix provides a real-time overview of all workpoints in one place.",
    details: [
      "The dashboard is optimized for wide screens and can be displayed on a TV.",
      "Managers can instantly see the latest check-ins and check-outs across all locations.",
    ],
    imageFileName: "live-follow-dashboard.jpg",
    icon: Tv,
    accent: "bg-red-600",
    accentSoft: "bg-red-600/10",
  },
  {
    title: "Integrated Chat",
    eyebrow: "Team messaging",
    description:
      "Teams can communicate directly inside Strulix through the built-in messaging system.",
    details: [
      "Work-related communication stays organized.",
      "Teams reduce the need to switch between different messaging apps.",
    ],
    imageFileName: "integrated-chat.jpg",
    icon: MessageSquareText,
    accent: "bg-emerald-600",
    accentSoft: "bg-emerald-600/10",
  },
  {
    title: "Leave Calendar",
    eyebrow: "Absence planning",
    description:
      "Employees can request sick leave or vacation days through the calendar.",
    details: [
      "Managers can approve or deny requests.",
      "Leaders can quickly see who will be absent during the week, helping with planning and scheduling.",
    ],
    imageFileName: "leave-calendar.jpg",
    icon: CalendarDays,
    accent: "bg-red-600",
    accentSoft: "bg-red-600/10",
  },
  {
    title: "Employee Invitations",
    eyebrow: "Fast onboarding",
    description:
      "Administrators can invite employees by entering their email address and selecting their role.",
    details: [
      "Supported roles include Worker and Leader.",
      "The invited user receives an email and can join the company through the invitation link.",
    ],
    imageFileName: "employee-invitations.jpg",
    icon: UserPlus,
    accent: "bg-emerald-600",
    accentSoft: "bg-emerald-600/10",
  },
  {
    title: "Subcontractor Support",
    eyebrow: "Partner access",
    description:
      "If a workpoint involves subcontractors, companies can invite partner companies.",
    details: [
      "Partner workers can check in at the assigned workpoint.",
      "Their attendance is included in the workpoint summary and reports.",
    ],
    imageFileName: "subcontractor-support.jpg",
    icon: Building2,
    accent: "bg-red-600",
    accentSoft: "bg-red-600/10",
  },
  {
    title: "Worker View",
    eyebrow: "Clear records",
    description:
      "Workers can track their own attendance, worked hours, and estimated salary.",
    details: [
      "Employees get clear access to their own records.",
      "This helps avoid confusion at the end of the month.",
    ],
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
    details: [
      "Workers can use the platform directly on the device they already carry.",
      "Mobile access keeps attendance and team updates close to the worksite.",
    ],
    imageFileName: "mobile-app.jpg",
    icon: Smartphone,
    accent: "bg-red-600",
    accentSoft: "bg-red-600/10",
  },
  {
    title: "Simple Pricing",
    eyebrow: "Flexible billing",
    description:
      "Strulix uses a flexible per-user pricing model. Each active user adds €3 to the monthly subscription.",
    details: [
      "If a user joins in the middle of the month, the cost is calculated proportionally.",
      "For example, if an employee is added halfway through the month, the cost for that user is only €1.50 for that month.",
    ],
    imageFileName: "simple-pricing.jpg",
    icon: BadgeEuro,
    accent: "bg-emerald-600",
    accentSoft: "bg-emerald-600/10",
  },
];

const LANDING_FEATURE_IMAGE_BASE_PATH = "/landing-features";

function getLandingFeatureImageSrc(imageFileName: string) {
  return `${LANDING_FEATURE_IMAGE_BASE_PATH}/${imageFileName}`;
}

function LandingFeaturePreview({
  feature,
  isVisible,
  index,
}: {
  feature: LandingFeature;
  isVisible: boolean;
  index: number;
}) {
  const { t } = useI18n();
  const [imageUnavailable, setImageUnavailable] = useState(false);

  return (
    <div className="flex h-full min-h-70 items-center justify-center rounded-[8px] border border-border/70 bg-muted/35 p-3">
      <div
        className={`relative w-full overflow-hidden rounded-[8px] border border-border/70 bg-card shadow-sm transition duration-700 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
        }`}
        style={{
          transitionDelay: isVisible
            ? `${Math.min(index * 45, 180) + 120}ms`
            : "0ms",
        }}
      >
        {!imageUnavailable ? (
          <img
            src={getLandingFeatureImageSrc(feature.imageFileName)}
            alt={t(feature.title)}
            className="aspect-[4/3] w-full object-cover"
            loading="lazy"
            onError={() => setImageUnavailable(true)}
          />
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { t } = useI18n();
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
        <section className="relative isolate overflow-hidden border-b border-border bg-background text-foreground">
          <div className="mx-auto grid min-h-[86svh] w-full max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(320px,42%)] lg:gap-12 lg:px-8 lg:py-16">
            <div className="order-2 flex flex-col justify-center lg:order-1">
              {/* sr-only h1 for accessibility; ThreeDText is the visual title */}
              <h1 className="sr-only">{t("Strulix")}</h1>

              <div className="bp-animate bp-delay-2 h-[60px] w-[500px] overflow-hidden sm:h-[120px] lg:h-[140px]">
                <ThreeDText
                  className="h-full w-full"
                  text="Strulix"
                  position={[0, 0, 0]}
                  cameraPosition={[0, 0, 1.2]}
                />
              </div>

              <p className="bp-animate bp-delay-3 mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:mt-5 sm:text-base sm:leading-7 lg:text-lg">
                {t(
                  "Coordinate workpoints, QR attendance, worker documents, leave requests, and team messaging in one focused construction operations system."
                )}
              </p>

              <div className="bp-animate bp-delay-4 mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
                <Button
                  asChild
                  size="lg"
                  className="h-11 w-full sm:w-auto"
                >
                  <Link to="/register?paid=1">
                    {t("Start for €3/user/month")}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-11 w-full border-primary/30 bg-transparent text-primary hover:bg-primary/10 hover:text-primary sm:w-auto"
                >
                  <Link to="/register">{t("Register")}</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-11 w-full border-secondary-foreground/20 bg-transparent text-secondary-foreground hover:bg-secondary/80 hover:text-secondary-foreground sm:w-auto"
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

        {/* ── Feature Scroll ────────────────────────────────────────────── */}
        <section className="border-b border-border bg-muted/20 px-4 py-16 text-foreground sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase text-primary">
                {t("Platform capabilities")}
              </p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl lg:text-5xl">
                {t("Everything teams need to run workpoints with clarity.")}
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
                {t(
                  "From QR attendance to subcontractor access, Strulix keeps field operations, payroll context, and team communication connected in one place."
                )}
              </p>
            </div>

            <div className="mt-12 space-y-6 sm:mt-14 lg:space-y-8">
              {landingFeatures.map((feature, index) => {
                const Icon = feature.icon;
                const isReversed = index % 2 === 1;
                const isVisible = visibleFeatureIndexes.has(index);

                return (
                  <article
                    key={feature.title}
                    ref={(node) => {
                      featureRefs.current[index] = node;
                    }}
                    data-feature-index={index}
                    style={{
                      transitionDelay: isVisible
                        ? `${Math.min(index * 45, 180)}ms`
                        : "0ms",
                    }}
                    className={`grid scroll-mt-28 overflow-hidden rounded-[8px] border border-border/70 bg-card/90 shadow-sm transition duration-700 ease-out lg:grid-cols-2 ${isVisible
                      ? "translate-y-0 opacity-100"
                      : "translate-y-10 opacity-0"
                      }`}
                  >
                    <div
                      className={`flex min-h-[360px] flex-col justify-center p-6 sm:p-8 lg:p-10 ${isReversed ? "lg:order-2" : ""
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] text-white transition-transform duration-700 ${isVisible ? "scale-100" : "scale-90"
                            } ${feature.accent}`}
                        >
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          {t(feature.eyebrow)}
                        </p>
                      </div>
                      <h3 className="mt-6 text-2xl font-semibold sm:text-3xl">
                        {t(feature.title)}
                      </h3>
                      <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
                        {t(feature.description)}
                      </p>
                      <div className="mt-6 space-y-3">
                        {feature.details.map((detail) => (
                          <div key={detail} className="flex gap-3">
                            <span
                              className={`mt-2 h-2 w-2 shrink-0 rounded-full ${feature.accent}`}
                            />
                            <p className="text-sm leading-6 text-muted-foreground">
                              {t(detail)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div
                      className={`border-t border-border/70 bg-card/70 p-4 sm:p-6 lg:border-t-0 ${isReversed ? "lg:order-1 lg:border-r" : "lg:border-l"
                        }`}
                    >
                      <LandingFeaturePreview
                        feature={feature}
                        isVisible={isVisible}
                        index={index}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────────── */}
        <section className="border-t border-border bg-primary px-4 py-14 text-primary-foreground sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl text-center">
            <h2 className="text-2xl font-semibold sm:text-3xl lg:text-4xl">
              {t("Ready to bring your sites online?")}
            </h2>
            <p className="mt-3 text-sm text-primary-foreground/70 sm:mt-4 sm:text-base">
              {t("Start free, pay only when your team grows.")}
            </p>
            <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:mt-8 sm:flex-row sm:items-center">
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
        </section>
      </main>
    </div>
  );
}

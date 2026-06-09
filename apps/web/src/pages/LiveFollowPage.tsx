import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Building2,
  Clock,
  ExternalLink,
  Maximize2,
  Minimize2,
  Radio,
  Users,
} from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { SubcontractorAffiliationMarker } from "@/components/subcontractor-affiliation-marker";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useLiveFollow } from "@/hooks/useAttendance";
import { useI18n } from "@/hooks/useI18n";
import { useMessagingSocketContext } from "@/hooks/useMessagingSocketContext";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  LiveFollowEventType,
  LiveFollowStatus,
  LiveFollowWarningReason,
  LiveFollowWorkPoint,
} from "@/services/api/attendanceApi";

type DisplayMode = "dashboard" | "fullscreen";

const STATUS_META: Record<
  LiveFollowStatus,
  {
    label: string;
    badge: "success" | "warning" | "outline";
    cardClass: string;
    dotClass: string;
  }
> = {
  ACTIVE: {
    label: "Active",
    badge: "success",
    cardClass: "border-emerald-500/35 bg-emerald-500/[0.06]",
    dotClass: "bg-emerald-500",
  },
  WARNING: {
    label: "Warning",
    badge: "warning",
    cardClass: "border-amber-500/45 bg-amber-500/[0.08]",
    dotClass: "bg-amber-500",
  },
  INACTIVE: {
    label: "Inactive",
    badge: "outline",
    cardClass: "border-border bg-card",
    dotClass: "bg-muted-foreground",
  },
};

function formatElapsedSince(value: string, now: Date) {
  const start = new Date(value);
  if (Number.isNaN(start.getTime())) return "";

  const totalMinutes = Math.max(
    0,
    Math.floor((now.getTime() - start.getTime()) / 60_000),
  );
  if (totalMinutes < 1) return "0m";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function eventLabel(event: LiveFollowEventType, t: (key: string) => string) {
  return event === "CHECK_IN" ? t("Check in") : t("Check out");
}

function warningReasonLabel(
  reason: LiveFollowWarningReason,
  t: (key: string) => string,
) {
  if (reason === "STALE_OPEN_CHECKIN") return t("Open over 10h");
  if (reason === "LOCATION_ALERT") return t("Location alert");
  return t("Latest auto checkout");
}

function compareStatus(a: LiveFollowWorkPoint, b: LiveFollowWorkPoint) {
  const statusWeight: Record<LiveFollowStatus, number> = {
    WARNING: 0,
    ACTIVE: 1,
    INACTIVE: 2,
  };
  const statusDiff = statusWeight[a.status] - statusWeight[b.status];
  if (statusDiff !== 0) return statusDiff;
  return a.name.localeCompare(b.name);
}

export default function LiveFollowPage({
  displayMode = "dashboard",
}: {
  displayMode?: DisplayMode;
}) {
  const { t } = useI18n();
  const { isConnected } = useMessagingSocketContext();
  const { data, error, isFetching, isLoading } = useLiveFollow(5);
  const [now, setNow] = useState(() => new Date());
  const isFullscreen = displayMode === "fullscreen";

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const sortedWorkPoints = useMemo(
    () => [...(data?.workPoints ?? [])].sort(compareStatus),
    [data?.workPoints],
  );

  const pageClass = isFullscreen
    ? "min-h-svh bg-neutral-950 text-neutral-50"
    : "container mx-auto max-w-[1800px] px-4 py-8";
  const innerClass = isFullscreen ? "px-6 py-5 2xl:px-8" : "";

  return (
    <div className={pageClass}>
      <div className={innerClass}>
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-md border",
                isFullscreen
                  ? "border-neutral-700 bg-neutral-900 text-emerald-300"
                  : "bg-card text-primary",
              )}
            >
              <Radio className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1
                className={cn(
                  "font-semibold tracking-normal",
                  isFullscreen ? "text-5xl" : "text-3xl",
                )}
              >
                {t("Live Follow")}
              </h1>
              <div
                className={cn(
                  "mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm",
                  isFullscreen ? "text-neutral-300" : "text-muted-foreground",
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      isConnected ? "bg-emerald-500" : "bg-amber-500",
                    )}
                  />
                  {isConnected ? t("Live socket connected") : t("Polling fallback")}
                </span>
                <span>
                  {t("Updated")}: {formatDateTime(data?.generatedAt)}
                </span>
                {isFetching && !isLoading && (
                  <span className="inline-flex items-center gap-1.5">
                    <Spinner size={14} />
                    {t("Refreshing")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Button
            asChild
            variant={isFullscreen ? "secondary" : "outline"}
            className={cn(isFullscreen && "bg-neutral-100 text-neutral-950 hover:bg-white")}
          >
            <Link to={isFullscreen ? "/live-follow" : "/live-follow/display"}>
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
              {isFullscreen ? t("Exit display") : t("Display mode")}
            </Link>
          </Button>
        </div>

        {error != null && !isLoading && (
          <Alert variant="destructive" className="mb-4">
            {t("Failed to load Live Follow.")}
          </Alert>
        )}

        {isLoading && (
          <div className="flex justify-center py-16">
            <Spinner size={36} />
          </div>
        )}

        {data && (
          <>
            <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryTile
                fullscreen={isFullscreen}
                icon={<Building2 className="h-5 w-5" />}
                label={t("Workpoints")}
                value={data.totals.workpoints}
              />
              <SummaryTile
                fullscreen={isFullscreen}
                icon={<Users className="h-5 w-5" />}
                label={t("People checked in")}
                value={data.totals.activeWorkers}
              />
              <SummaryTile
                fullscreen={isFullscreen}
                icon={<Activity className="h-5 w-5" />}
                label={t("Active workpoints")}
                value={data.totals.activeWorkpoints}
              />
              <SummaryTile
                fullscreen={isFullscreen}
                icon={<AlertTriangle className="h-5 w-5" />}
                label={t("Warnings")}
                value={data.totals.warnings}
                accent={data.totals.warnings > 0 ? "warning" : "neutral"}
              />
            </div>

            {sortedWorkPoints.length === 0 ? (
              <Alert>{t("No workpoints yet. Create one to start tracking attendance.")}</Alert>
            ) : (
              <div
                className={cn(
                  "grid gap-4",
                  isFullscreen
                    ? "xl:grid-cols-3 2xl:grid-cols-4"
                    : "lg:grid-cols-2 2xl:grid-cols-3",
                )}
              >
                {sortedWorkPoints.map((workPoint) => (
                  <WorkPointLiveCard
                    key={workPoint.id}
                    fullscreen={isFullscreen}
                    now={now}
                    workPoint={workPoint}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SummaryTile({
  accent = "neutral",
  fullscreen,
  icon,
  label,
  value,
}: {
  accent?: "neutral" | "warning";
  fullscreen: boolean;
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-4",
        fullscreen
          ? "border-neutral-800 bg-neutral-900"
          : "border-border bg-card",
      )}
    >
      <div
        className={cn(
          "mb-3 flex items-center gap-2 text-sm",
          fullscreen ? "text-neutral-300" : "text-muted-foreground",
          accent === "warning" && "text-amber-600 dark:text-amber-300",
        )}
      >
        {icon}
        <span>{label}</span>
      </div>
      <p
        className={cn(
          "font-semibold tabular-nums tracking-normal",
          fullscreen ? "text-5xl" : "text-3xl",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function WorkPointLiveCard({
  fullscreen,
  now,
  workPoint,
}: {
  fullscreen: boolean;
  now: Date;
  workPoint: LiveFollowWorkPoint;
}) {
  const { t } = useI18n();
  const status = STATUS_META[workPoint.status];

  return (
    <article
      className={cn(
        "flex min-h-[360px] flex-col rounded-md border p-4 shadow-sm",
        status.cardClass,
        fullscreen && "border-neutral-800 bg-neutral-900 text-neutral-50 shadow-none",
        fullscreen && workPoint.status === "ACTIVE" && "border-emerald-500/45 bg-emerald-500/10",
        fullscreen && workPoint.status === "WARNING" && "border-amber-500/50 bg-amber-500/10",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("h-3 w-3 shrink-0 rounded-full", status.dotClass)} />
            <h2
              className={cn(
                "truncate font-semibold tracking-normal",
                fullscreen ? "text-2xl" : "text-xl",
              )}
              title={workPoint.name}
            >
              {workPoint.name}
            </h2>
          </div>
          <p
            className={cn(
              "mt-1 line-clamp-2 text-sm",
              fullscreen ? "text-neutral-300" : "text-muted-foreground",
            )}
          >
            {workPoint.address}
          </p>
        </div>
        <Badge variant={status.badge}>{t(status.label)}</Badge>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
        <div>
          <p className={cn("text-xs", fullscreen ? "text-neutral-400" : "text-muted-foreground")}>
            {t("Checked in")}
          </p>
          <p
            className={cn(
              "mt-1 font-semibold tabular-nums tracking-normal",
              fullscreen ? "text-5xl" : "text-4xl",
            )}
          >
            {workPoint.activeWorkerCount}
          </p>
        </div>
        <div className="text-right">
          <p className={cn("text-xs", fullscreen ? "text-neutral-400" : "text-muted-foreground")}>
            {t("Assigned")}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {workPoint.assignedWorkerCount}
          </p>
          {workPoint.subcontractorWorkerCount > 0 && (
            <p className={cn("text-xs", fullscreen ? "text-neutral-400" : "text-muted-foreground")}>
              {t("Subcontractors")}: {workPoint.subcontractorWorkerCount}
            </p>
          )}
        </div>
      </div>

      {workPoint.warningReasons.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {workPoint.warningReasons.map((reason) => (
            <Badge key={reason} variant="warning">
              <AlertTriangle className="h-3 w-3" />
              {warningReasonLabel(reason, t)}
              {reason === "LOCATION_ALERT" && workPoint.openLocationAlertCount > 0
                ? ` ${workPoint.openLocationAlertCount}`
                : ""}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium">{t("Current check-ins")}</h3>
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs",
              fullscreen ? "text-neutral-400" : "text-muted-foreground",
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            {formatDateTime(workPoint.latestActivityAt)}
          </span>
        </div>
        {workPoint.activeCheckIns.length === 0 ? (
          <p className={cn("text-sm", fullscreen ? "text-neutral-400" : "text-muted-foreground")}>
            {t("No workers checked in")}
          </p>
        ) : (
          <div className="space-y-2">
            {workPoint.activeCheckIns.slice(0, 4).map((checkIn) => (
              <div
                key={checkIn.attendanceId}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-md border px-3 py-2",
                  fullscreen ? "border-neutral-800 bg-neutral-950/60" : "bg-background/70",
                )}
              >
                  <span className="min-w-0 text-sm font-medium">
                    <span className="truncate">{checkIn.workerUsername}</span>
                    {checkIn.workerAffiliation === "SUBCONTRACTOR" && (
                      <SubcontractorAffiliationMarker className="ml-2 align-middle" />
                    )}
                  </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatElapsedSince(checkIn.checkedInAt, now)}
                </span>
              </div>
            ))}
            {workPoint.activeCheckIns.length > 4 && (
              <p className={cn("text-xs", fullscreen ? "text-neutral-400" : "text-muted-foreground")}>
                {t("+{count} more", { count: workPoint.activeCheckIns.length - 4 })}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex-1">
        <h3 className="mb-2 text-sm font-medium">{t("Recent events")}</h3>
        {workPoint.recentEvents.length === 0 ? (
          <p className={cn("text-sm", fullscreen ? "text-neutral-400" : "text-muted-foreground")}>
            {t("No recent activity")}
          </p>
        ) : (
          <div className="space-y-2">
            {workPoint.recentEvents.map((event) => (
              <div
                key={`${event.attendanceId}-${event.event}`}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-sm"
              >
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    event.event === "CHECK_IN" ? "bg-emerald-500" : "bg-neutral-400",
                  )}
                />
                <div className="min-w-0">
                  <p className="truncate">
                    <span className="font-medium">{event.workerUsername}</span>{" "}
                    {event.workerAffiliation === "SUBCONTRACTOR" && (
                      <SubcontractorAffiliationMarker className="mr-1 align-middle" />
                    )}
                    <span className={fullscreen ? "text-neutral-300" : "text-muted-foreground"}>
                      {eventLabel(event.event, t)}
                    </span>
                  </p>
                  <p className={cn("text-xs", fullscreen ? "text-neutral-400" : "text-muted-foreground")}>
                    {formatDateTime(event.occurredAt)}
                    {event.checkoutSource === "AUTO" ? ` · ${t("Auto")}` : ""}
                  </p>
                </div>
                <Badge variant={event.source === "QR" ? "success" : "outline"}>
                  {event.source}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button asChild variant={fullscreen ? "secondary" : "ghost"} className="mt-4 justify-start">
        <Link to={`/workpoints/${workPoint.id}`}>
          <ExternalLink className="h-4 w-4" />
          {t("Open workpoint")}
        </Link>
      </Button>
    </article>
  );
}

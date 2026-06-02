import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Building2, CircleAlert, Clock, DollarSign, FileText, MapPin, QrCode } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorkPointDocumentsDialog } from "@/components/workpoints/WorkPointDocumentsDialog";
import { useI18n } from "@/hooks/useI18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMyDailyStats, useMyMonthlySummary } from "@/hooks/useAttendance";
import { useMyAssignedWorkPoints } from "@/hooks/useWorkPoints";
import {
  formatDate,
  formatDateTime,
  formatHours,
  formatMoney,
  formatMonthLabel,
  getCurrentPeriod,
  parsePeriod,
} from "@/lib/format";
import type { DailyStatRow } from "@/services/api/attendanceApi";
import type { AssignedWorkPointSummary } from "@/services/api/workPointApi";

type AttendanceGroup = {
  id: string;
  name: string;
  address?: string;
  deadline?: string | null;
  isCurrentAssignment: boolean;
  rows: DailyStatRow[];
};

function getRowsByWorkPoint(rows: DailyStatRow[]) {
  const byWorkPoint = new Map<string, DailyStatRow[]>();

  for (const row of rows) {
    const current = byWorkPoint.get(row.workPoint.id) ?? [];
    current.push(row);
    byWorkPoint.set(row.workPoint.id, current);
  }

  return byWorkPoint;
}

function getWorkPointTotals(rows: DailyStatRow[]) {
  return rows.reduce(
    (totals, row) => ({
      completeDays: totals.completeDays + (row.complete ? 1 : 0),
      openDays: totals.openDays + (row.complete ? 0 : 1),
      totalEarnings: totals.totalEarnings + row.earnings,
      totalHours: totals.totalHours + row.hours,
    }),
    {
      completeDays: 0,
      openDays: 0,
      totalEarnings: 0,
      totalHours: 0,
    },
  );
}

function buildAttendanceGroups(
  workPoints: AssignedWorkPointSummary[],
  rows: DailyStatRow[],
  previousWorkpointLabel: string,
): AttendanceGroup[] {
  const byWorkPoint = getRowsByWorkPoint(rows);
  const assignedIds = new Set(workPoints.map((workPoint) => workPoint.id));

  const assignedGroups = workPoints.map((workPoint) => ({
    id: workPoint.id,
    name: workPoint.name,
    address: workPoint.address,
    deadline: workPoint.deadline,
    isCurrentAssignment: true,
    rows: byWorkPoint.get(workPoint.id) ?? [],
  }));

  const historicalGroups = Array.from(byWorkPoint.entries())
    .filter(([workPointId]) => !assignedIds.has(workPointId))
    .map(([workPointId, workPointRows]) => ({
      id: workPointId,
      name: workPointRows[0]?.workPoint.name ?? previousWorkpointLabel,
      isCurrentAssignment: false,
      rows: workPointRows,
    }));

  return [...assignedGroups, ...historicalGroups];
}

export default function WorkerHomePage() {
  const { t } = useI18n();
  const [period, setPeriod] = useState(getCurrentPeriod);
  const [documentsWorkPoint, setDocumentsWorkPoint] =
    useState<AssignedWorkPointSummary | null>(null);
  const [year, month] = parsePeriod(period);
  const periodLabel = formatMonthLabel(year, month);

  const {
    data: assignedWorkPoints = [],
    error: assignedWorkPointsError,
    isLoading: isAssignedWorkPointsLoading,
  } = useMyAssignedWorkPoints();
  const {
    data: dailyRows = [],
    error: dailyStatsError,
    isLoading: isDailyStatsLoading,
  } = useMyDailyStats(year, month);
  const {
    data: monthlySummary,
    error: monthlySummaryError,
    isLoading: isMonthlySummaryLoading,
  } = useMyMonthlySummary(year, month);

  const attendanceGroups = useMemo(
    () =>
      buildAttendanceGroups(
        assignedWorkPoints,
        dailyRows,
        t("Previous workpoint"),
      ),
    [assignedWorkPoints, dailyRows, t],
  );

  const hasWage = monthlySummary?.hourlyWage != null;
  const openRecords = Math.max(
    0,
    (monthlySummary?.totalDays ?? 0) - (monthlySummary?.completeDays ?? 0),
  );
  const isLoading =
    isAssignedWorkPointsLoading || isDailyStatsLoading || isMonthlySummaryLoading;
  const hasError =
    assignedWorkPointsError != null ||
    dailyStatsError != null ||
    monthlySummaryError != null;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 overflow-hidden rounded-3xl border bg-card">
        <div className="relative isolate p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Badge variant="outline" className="mb-3 bg-background/70">
                {t("Worker dashboard")}
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("Your Strulix home")}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                {t(
                  "Track your assigned workpoints, attendance, hours, and wage-based earnings for {periodLabel}.",
                  { periodLabel },
                )}
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-56">
              <Label htmlFor="worker-period">{t("Month")}</Label>
              <Input
                id="worker-period"
                type="month"
                value={period}
                onChange={(event) => setPeriod(event.target.value || getCurrentPeriod())}
              />
              <Button asChild>
                <Link to="/scan">
                  <QrCode className="h-4 w-4" />
                  {t("Scan attendance")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size={36} />
        </div>
      )}

      {hasError && !isLoading && (
        <Alert variant="destructive" className="mb-4">
          {t("Failed to load your worker dashboard.")}
        </Alert>
      )}

      {!isLoading && !hasError && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryCard
              label={t("Monthly earnings")}
              value={
                hasWage
                  ? formatMoney(monthlySummary.totalEarnings, { precise: true })
                  : t("Unavailable")
              }
              helper={
                hasWage
                  ? t("Completed attendances only")
                  : t("Ask an admin to set your wage")
              }
              icon={<DollarSign className="h-4 w-4" />}
            />
            <SummaryCard
              label={t("Hourly wage")}
              value={formatMoney(monthlySummary?.hourlyWage, { precise: true })}
              helper={t("Configured on your worker profile")}
              icon={<DollarSign className="h-4 w-4" />}
            />
            <SummaryCard
              label={t("Total hours")}
              value={formatHours(monthlySummary?.totalHours ?? 0)}
              helper={t("{count} complete days", {
                count: `${monthlySummary?.completeDays ?? 0}`,
              })}
              icon={<Clock className="h-4 w-4" />}
            />
            <SummaryCard
              label={t("Attendance days")}
              value={`${monthlySummary?.totalDays ?? 0}`}
              helper={t("{count} complete", {
                count: `${monthlySummary?.completeDays ?? 0}`,
              })}
              icon={<Clock className="h-4 w-4" />}
            />
            <SummaryCard
              label={t("Open records")}
              value={`${openRecords}`}
              helper={t("Missing check-out")}
              icon={<Clock className="h-4 w-4" />}
            />
          </div>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">{t("Assigned workpoints")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("Current workpoints assigned to you.")}
                </p>
              </div>
            </div>

            {assignedWorkPoints.length === 0 ? (
              <Alert>{t("No workpoints are assigned to you yet.")}</Alert>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {assignedWorkPoints.map((workPoint) => {
                  const rows = dailyRows.filter(
                    (row) => row.workPoint.id === workPoint.id,
                  );
                  const totals = getWorkPointTotals(rows);

                  return (
                    <div
                      key={workPoint.id}
                      className="rounded-2xl border bg-card p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold">
                            {workPoint.name}
                          </h3>
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{workPoint.address}</span>
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <Badge variant="outline">
                            {t("Deadline")}: {formatDate(workPoint.deadline)}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDocumentsWorkPoint(workPoint)}
                          >
                            <FileText className="h-4 w-4" />
                            {t("Documents")}
                          </Button>
                        </div>
                      </div>
                      {workPoint.description && (
                        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                          {workPoint.description}
                        </p>
                      )}
                      <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                        <MiniStat label={t("Hours")} value={formatHours(totals.totalHours)} />
                        <MiniStat label={t("Days")} value={`${rows.length}`} />
                        <MiniStat label={t("Complete")} value={`${totals.completeDays}`} />
                        <MiniStat
                          label={t("Earnings")}
                          value={
                            hasWage
                              ? formatMoney(totals.totalEarnings, { precise: true })
                              : t("Unavailable")
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">{t("Attendance by workpoint")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("Your own check-ins and check-outs for {periodLabel}.", {
                    periodLabel,
                  })}
                </p>
              </div>
            </div>

            {attendanceGroups.length === 0 ? (
              <Alert>{t("No attendance records for {periodLabel}.", { periodLabel })}</Alert>
            ) : (
              <div className="space-y-4">
                {attendanceGroups.map((group) => (
                  <AttendanceGroupCard
                    key={group.id}
                    group={group}
                    hasWage={hasWage}
                    periodLabel={periodLabel}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {documentsWorkPoint && (
        <WorkPointDocumentsDialog
          canManage={false}
          open={documentsWorkPoint !== null}
          onOpenChange={(open) => {
            if (!open) setDocumentsWorkPoint(null);
          }}
          workPointId={documentsWorkPoint.id}
          workPointName={documentsWorkPoint.name}
        />
      )}
    </div>
  );
}

function SummaryCard({
  helper,
  icon,
  label,
  value,
}: {
  helper: string;
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/70 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function AttendanceGroupCard({
  group,
  hasWage,
  periodLabel,
}: {
  group: AttendanceGroup;
  hasWage: boolean;
  periodLabel: string;
}) {
  const { t } = useI18n();
  const totals = getWorkPointTotals(group.rows);

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="border-b px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{group.name}</h3>
              {!group.isCurrentAssignment && (
                <Badge variant="warning">{t("Previous")}</Badge>
              )}
            </div>
            {group.address && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{group.address}</span>
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>{formatHours(totals.totalHours)}</span>
            <span>{t("{count} records", { count: group.rows.length })}</span>
            {group.deadline && <span>{t("Deadline")}: {formatDate(group.deadline)}</span>}
          </div>
        </div>
      </div>

      {group.rows.length === 0 ? (
        <div className="p-4">
          <Alert>{t("No attendance recorded here for {periodLabel}.", { periodLabel })}</Alert>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Date")}</TableHead>
                <TableHead>{t("Checked in")}</TableHead>
                <TableHead>{t("Checked out")}</TableHead>
                <TableHead className="text-right">{t("Hours")}</TableHead>
                <TableHead className="text-right">{t("Earnings")}</TableHead>
                <TableHead className="text-center">{t("Status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="min-w-36 font-medium">
                    {formatDate(row.date)}
                  </TableCell>
                  <TableCell className="min-w-36 text-sm text-muted-foreground">
                    {formatDateTime(row.checkedInAt)}
                  </TableCell>
                  <TableCell className="min-w-36 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>{formatDateTime(row.checkedOutAt)}</span>
                      {row.checkoutSource === "AUTO" && (
                        <Badge
                          variant="destructive"
                          title={t("Automatically closed at 22:00")}
                        >
                          <CircleAlert className="h-3 w-3" />
                          {t("Auto")}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatHours(row.hours)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.complete && hasWage
                      ? formatMoney(row.earnings, { precise: true })
                      : row.complete
                        ? t("Unavailable")
                        : t("Open")}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        row.checkoutSource === "AUTO"
                          ? "destructive"
                          : row.complete
                            ? "success"
                            : "warning"
                      }
                    >
                      {row.checkoutSource === "AUTO"
                        ? t("Auto-closed")
                        : row.complete
                          ? t("Complete")
                          : t("Open")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

import { useMemo, useState, type ReactNode } from "react";
import { Building2, CircleAlert, Clock, DollarSign, MapPin } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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

const currencyFormatter = new Intl.NumberFormat(undefined, {
  currency: "RON",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
  style: "currency",
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatHourlyWage(value: number | null | undefined) {
  if (value == null) return "Not set";
  return `${formatCurrency(value)}/h`;
}

function getPeriodLabel(year: number, month: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

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
      name: workPointRows[0]?.workPoint.name ?? "Previous workpoint",
      isCurrentAssignment: false,
      rows: workPointRows,
    }));

  return [...assignedGroups, ...historicalGroups];
}

export default function WorkerHomePage() {
  const [period, setPeriod] = useState(getCurrentPeriod);
  const [year, month] = parsePeriod(period);
  const periodLabel = getPeriodLabel(year, month);

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
    () => buildAttendanceGroups(assignedWorkPoints, dailyRows),
    [assignedWorkPoints, dailyRows],
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
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.18),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.08),transparent_45%)]" />
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Badge variant="outline" className="mb-3 bg-background/70">
                Worker dashboard
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Your BuildPulse home
              </h1>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Track your assigned workpoints, attendance, hours, and wage-based
                earnings for {periodLabel}.
              </p>
            </div>
            <div className="flex w-full flex-col gap-1.5 sm:w-56">
              <Label htmlFor="worker-period">Month</Label>
              <Input
                id="worker-period"
                type="month"
                value={period}
                onChange={(event) => setPeriod(event.target.value || getCurrentPeriod())}
              />
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
          Failed to load your worker dashboard.
        </Alert>
      )}

      {!isLoading && !hasError && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryCard
              label="Monthly earnings"
              value={hasWage ? formatCurrency(monthlySummary.totalEarnings) : "Unavailable"}
              helper={hasWage ? "Completed attendances only" : "Ask an admin to set your wage"}
              icon={<DollarSign className="h-4 w-4" />}
            />
            <SummaryCard
              label="Hourly wage"
              value={formatHourlyWage(monthlySummary?.hourlyWage)}
              helper="Configured on your worker profile"
              icon={<DollarSign className="h-4 w-4" />}
            />
            <SummaryCard
              label="Total hours"
              value={formatHours(monthlySummary?.totalHours ?? 0)}
              helper={`${monthlySummary?.completeDays ?? 0} complete days`}
              icon={<Clock className="h-4 w-4" />}
            />
            <SummaryCard
              label="Attendance days"
              value={`${monthlySummary?.totalDays ?? 0}`}
              helper={`${monthlySummary?.completeDays ?? 0} complete`}
              icon={<Clock className="h-4 w-4" />}
            />
            <SummaryCard
              label="Open records"
              value={`${openRecords}`}
              helper="Missing check-out"
              icon={<Clock className="h-4 w-4" />}
            />
          </div>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">Assigned workpoints</h2>
                <p className="text-sm text-muted-foreground">
                  Current workpoints assigned to you.
                </p>
              </div>
            </div>

            {assignedWorkPoints.length === 0 ? (
              <Alert>No workpoints are assigned to you yet.</Alert>
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
                        <Badge variant="outline">
                          Deadline: {formatDate(workPoint.deadline)}
                        </Badge>
                      </div>
                      {workPoint.description && (
                        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                          {workPoint.description}
                        </p>
                      )}
                      <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                        <MiniStat label="Hours" value={formatHours(totals.totalHours)} />
                        <MiniStat label="Days" value={`${rows.length}`} />
                        <MiniStat label="Complete" value={`${totals.completeDays}`} />
                        <MiniStat
                          label="Earnings"
                          value={
                            hasWage ? formatCurrency(totals.totalEarnings) : "Unavailable"
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
                <h2 className="text-xl font-semibold">Attendance by workpoint</h2>
                <p className="text-sm text-muted-foreground">
                  Your own check-ins and check-outs for {periodLabel}.
                </p>
              </div>
            </div>

            {attendanceGroups.length === 0 ? (
              <Alert>No attendance records for {periodLabel}.</Alert>
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
  const totals = getWorkPointTotals(group.rows);

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="border-b px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{group.name}</h3>
              {!group.isCurrentAssignment && (
                <Badge variant="warning">Previous assignment</Badge>
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
            <span>{group.rows.length} records</span>
            {group.deadline && <span>Deadline: {formatDate(group.deadline)}</span>}
          </div>
        </div>
      </div>

      {group.rows.length === 0 ? (
        <div className="p-4">
          <Alert>No attendance recorded here for {periodLabel}.</Alert>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Check in</TableHead>
                <TableHead>Check out</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead className="text-right">Earnings</TableHead>
                <TableHead className="text-center">Status</TableHead>
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
                          title="Automatically closed at 22:00"
                        >
                          <CircleAlert className="h-3 w-3" />
                          Auto
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatHours(row.hours)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.complete && hasWage
                      ? formatCurrency(row.earnings)
                      : row.complete
                        ? "Unavailable"
                        : "Open"}
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
                        ? "Auto-closed"
                        : row.complete
                          ? "Complete"
                          : "Open"}
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

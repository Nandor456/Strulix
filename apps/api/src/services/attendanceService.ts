import { prisma } from "../../database/prisma.js";
import { Prisma } from "../../database/generated/prisma/client.js";
import {
  ATTENDANCE_TIMEZONE,
  attendanceDateTimeToUtc,
  dateInZone,
} from "../utils/dateHelpers.js";
import QRCode from "qrcode";

export type AttendanceRecord = {
  id: string;
  workerId: string;
  workPointId: string;
  date: Date;
  checkedInAt: Date;
  checkedOutAt: Date | null;
  checkoutSource: string | null;
  source: string;
  worker: { id: string; username: string; email: string };
};

export type AttendanceSummary = {
  workerId: string;
  username: string;
  email: string;
  totalDays: number;
  completeDays: number;
  totalHours: number;
  totalEarnings: number | null;
  firstDate: Date | null;
  lastDate: Date | null;
};

export type ScanResult =
  | {
    event: "CHECK_IN";
    workPointId: string;
    workPointName: string;
    date: Date;
    checkedInAt: Date;
  }
  | CompletedScanResult;

export type CompletedScanResult = {
  event: "CHECK_OUT" | "ALREADY_COMPLETED";
  workPointId: string;
  workPointName: string;
  date: Date;
  checkedInAt: Date;
  checkedOutAt: Date;
  checkoutSource: string | null;
  hours: number;
  earnings: number | null;
};

export type DailyStatRow = {
  id: string;
  date: Date;
  workPoint: { id: string; name: string };
  checkedInAt: Date;
  checkedOutAt: Date | null;
  checkoutSource: string | null;
  hours: number;
  earnings: number;
  complete: boolean;
};

export type MonthlySummary = {
  totalDays: number;
  completeDays: number;
  totalHours: number;
  totalEarnings: number;
  hourlyWage: number | null;
};

export type LiveFollowStatus = "ACTIVE" | "INACTIVE" | "WARNING";
export type LiveFollowWarningReason = "STALE_OPEN_CHECKIN" | "AUTO_CHECKOUT";
export type LiveFollowEventType = "CHECK_IN" | "CHECK_OUT";

export type LiveFollowActiveCheckIn = {
  attendanceId: string;
  workerId: string;
  workerUsername: string;
  workerEmail: string;
  checkedInAt: string;
  source: string;
};

export type LiveFollowRecentEvent = {
  attendanceId: string;
  workerId: string;
  workerUsername: string;
  workerEmail: string;
  event: LiveFollowEventType;
  occurredAt: string;
  source: string;
  checkoutSource: string | null;
};

export type LiveFollowWorkPoint = {
  id: string;
  name: string;
  address: string;
  assignedWorkerCount: number;
  activeWorkerCount: number;
  status: LiveFollowStatus;
  warningReasons: LiveFollowWarningReason[];
  latestActivityAt: string | null;
  activeCheckIns: LiveFollowActiveCheckIn[];
  recentEvents: LiveFollowRecentEvent[];
};

export type LiveFollowSnapshot = {
  generatedAt: string;
  totals: {
    workpoints: number;
    activeWorkers: number;
    activeWorkpoints: number;
    warnings: number;
  };
  workPoints: LiveFollowWorkPoint[];
};

const GEOFENCE_RADIUS_METERS = 200;
const EARTH_RADIUS_METERS = 6_371_000;
const QUARTER_HOUR_MS = 15 * 60 * 1000;
const ATTENDANCE_RECORDING_START_HOUR = 6;
const ATTENDANCE_RECORDING_END_HOUR = 22;
const LIVE_FOLLOW_DEFAULT_EVENT_LIMIT = 5;
const LIVE_FOLLOW_MAX_EVENT_LIMIT = 10;
const LIVE_FOLLOW_STALE_OPEN_MS = 10 * 60 * 60 * 1000;

type LiveFollowRecentEventRow = {
  attendanceId: string;
  workPointId: string;
  workerId: string;
  workerUsername: string;
  workerEmail: string;
  event: LiveFollowEventType;
  occurredAt: Date;
  source: string;
  checkoutSource: string | null;
};

type Coordinates = {
  lat: number;
  lng: number;
};

export function normalizeLiveFollowEventLimit(limit?: number): number {
  if (!Number.isInteger(limit) || limit == null || limit < 1) {
    return LIVE_FOLLOW_DEFAULT_EVENT_LIMIT;
  }

  return Math.min(limit, LIVE_FOLLOW_MAX_EVENT_LIMIT);
}

function eventSortWeight(event: LiveFollowEventType): number {
  return event === "CHECK_OUT" ? 1 : 0;
}

export function limitLiveFollowEvents<T extends {
  event: LiveFollowEventType;
  occurredAt: Date | string;
}>(events: T[], limit?: number): T[] {
  const normalizedLimit = normalizeLiveFollowEventLimit(limit);

  return [...events]
    .sort((a, b) => {
      const timeDiff =
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
      if (timeDiff !== 0) return timeDiff;

      return eventSortWeight(b.event) - eventSortWeight(a.event);
    })
    .slice(0, normalizedLimit);
}

export function evaluateLiveFollowStatus(params: {
  now: Date;
  activeCheckIns: Array<{ checkedInAt: Date | string }>;
  latestEvent?: { event: LiveFollowEventType; checkoutSource: string | null } | null;
}): { status: LiveFollowStatus; warningReasons: LiveFollowWarningReason[] } {
  const warningReasons: LiveFollowWarningReason[] = [];
  const hasStaleOpenCheckIn = params.activeCheckIns.some((checkIn) => {
    const checkedInAt = new Date(checkIn.checkedInAt);
    return params.now.getTime() - checkedInAt.getTime() >= LIVE_FOLLOW_STALE_OPEN_MS;
  });

  if (hasStaleOpenCheckIn) {
    warningReasons.push("STALE_OPEN_CHECKIN");
  }

  if (
    params.latestEvent?.event === "CHECK_OUT" &&
    params.latestEvent.checkoutSource === "AUTO"
  ) {
    warningReasons.push("AUTO_CHECKOUT");
  }

  if (warningReasons.length > 0) {
    return { status: "WARNING", warningReasons };
  }

  if (params.activeCheckIns.length > 0) {
    return { status: "ACTIVE", warningReasons };
  }

  return { status: "INACTIVE", warningReasons };
}

export function computeBillableHours(checkedInAt: Date, checkedOutAt: Date): number {
  const ms = Math.max(0, checkedOutAt.getTime() - checkedInAt.getTime());
  return Math.round(ms / QUARTER_HOUR_MS) / 4;
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function distanceMeters(from: Coordinates, to: Coordinates): number {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

function assertWithinAttendanceRecordingWindow(now: Date): void {
  const date = dateInZone(now, ATTENDANCE_TIMEZONE);
  const startsAt = attendanceDateTimeToUtc({
    date,
    hour: ATTENDANCE_RECORDING_START_HOUR,
    tz: ATTENDANCE_TIMEZONE,
  });
  const endsAt = attendanceDateTimeToUtc({
    date,
    hour: ATTENDANCE_RECORDING_END_HOUR,
    tz: ATTENDANCE_TIMEZONE,
  });

  if (now < startsAt || now >= endsAt) {
    const err = new Error("Attendance can only be recorded between 6:00 AM and 10:00 PM");
    (err as NodeJS.ErrnoException).code = "FORBIDDEN";
    throw err;
  }
}

async function closeEligibleOpenAttendances(now: Date): Promise<number> {
  const today = dateInZone(now, ATTENDANCE_TIMEZONE);
  const openRecords = await prisma.attendance.findMany({
    where: {
      checkedOutAt: null,
      date: { lte: today },
    },
    select: { id: true, date: true },
  });

  const updates = openRecords
    .map((record) => ({
      id: record.id,
      checkedOutAt: attendanceDateTimeToUtc({
        date: record.date,
        hour: 22,
        tz: ATTENDANCE_TIMEZONE,
      }),
    }))
    .filter((record) => record.checkedOutAt <= now);

  if (updates.length === 0) return 0;

  const results = await prisma.$transaction(
    updates.map((record) =>
      prisma.attendance.updateMany({
        where: { id: record.id, checkedOutAt: null },
        data: {
          checkedOutAt: record.checkedOutAt,
          checkoutSource: "AUTO",
        },
      }),
    ),
  );

  return results.reduce((sum, result) => sum + result.count, 0);
}

let activeAutoClose: Promise<number> | null = null;
let autoCloseInterval: NodeJS.Timeout | null = null;

export function autoCloseOpenAttendances(now = new Date()): Promise<number> {
  if (activeAutoClose) return activeAutoClose;

  activeAutoClose = closeEligibleOpenAttendances(now).finally(() => {
    activeAutoClose = null;
  });

  return activeAutoClose;
}

export function startAttendanceAutoCloseJob(): NodeJS.Timeout {
  if (autoCloseInterval) return autoCloseInterval;

  const run = () => {
    void autoCloseOpenAttendances()
      .then((closedCount) => {
        if (closedCount > 0) {
          console.log(`Auto-closed ${closedCount} attendance record(s).`);
        }
      })
      .catch((err) => {
        console.error("Attendance auto-close job failed:", err);
      });
  };

  run();
  autoCloseInterval = setInterval(run, 60_000);
  return autoCloseInterval;
}

async function buildCompletedScanResult(params: {
  userId: string;
  event: CompletedScanResult["event"];
  workPointId: string;
  workPointName: string;
  date: Date;
  checkedInAt: Date;
  checkedOutAt: Date;
  checkoutSource: string | null;
}): Promise<CompletedScanResult> {
  const hours = computeBillableHours(params.checkedInAt, params.checkedOutAt);

  const worker = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { hourlyWage: true },
  });

  const earnings =
    worker?.hourlyWage != null ? hours * worker.hourlyWage : null;

  return {
    event: params.event,
    workPointId: params.workPointId,
    workPointName: params.workPointName,
    date: params.date,
    checkedInAt: params.checkedInAt,
    checkedOutAt: params.checkedOutAt,
    checkoutSource: params.checkoutSource,
    hours,
    earnings,
  };
}

export async function recordAttendance(params: {
  userId: string;
  qrToken: string;
  workerLocation: Coordinates;
  source: "QR" | "MANUAL";
}): Promise<ScanResult> {
  const now = new Date();

  await autoCloseOpenAttendances(now);

  const workPoint = await prisma.workPoint.findUnique({
    where: { qrToken: params.qrToken },
    select: {
      id: true,
      name: true,
      lat: true,
      lng: true,
      workers: { where: { id: params.userId }, select: { id: true } },
    },
  });

  if (!workPoint) {
    const err = new Error("Invalid QR token");
    (err as NodeJS.ErrnoException).code = "NOT_FOUND";
    throw err;
  }

  if (workPoint.workers.length === 0) {
    const err = new Error("You are not assigned to this workpoint");
    (err as NodeJS.ErrnoException).code = "FORBIDDEN";
    throw err;
  }

  if (workPoint.lat === null || workPoint.lng === null) {
    const err = new Error("This workpoint does not have coordinates set");
    (err as NodeJS.ErrnoException).code = "MISSING_COORDINATES";
    throw err;
  }

  const distance = distanceMeters(params.workerLocation, {
    lat: workPoint.lat,
    lng: workPoint.lng,
  });

  if (distance > GEOFENCE_RADIUS_METERS) {
    const err = new Error("You must be within 100m of this workpoint to scan attendance");
    (err as NodeJS.ErrnoException).code = "FORBIDDEN";
    throw err;
  }

  const date = dateInZone(now, ATTENDANCE_TIMEZONE);

  const existing = await prisma.attendance.findUnique({
    where: {
      workerId_workPointId_date: {
        workerId: params.userId,
        workPointId: workPoint.id,
        date,
      },
    },
    select: {
      id: true,
      checkedInAt: true,
      checkedOutAt: true,
      checkoutSource: true,
    },
  });

  if (!existing) {
    assertWithinAttendanceRecordingWindow(now);

    const record = await prisma.attendance.create({
      data: {
        workerId: params.userId,
        workPointId: workPoint.id,
        date,
        checkedInAt: now,
        source: params.source,
      },
      select: { checkedInAt: true },
    });
    return {
      event: "CHECK_IN",
      workPointId: workPoint.id,
      workPointName: workPoint.name,
      date,
      checkedInAt: record.checkedInAt,
    };
  }

  if (existing.checkedOutAt !== null) {
    return buildCompletedScanResult({
      userId: params.userId,
      event: "ALREADY_COMPLETED",
      workPointId: workPoint.id,
      workPointName: workPoint.name,
      date,
      checkedInAt: existing.checkedInAt,
      checkedOutAt: existing.checkedOutAt,
      checkoutSource: existing.checkoutSource,
    });
  }

  assertWithinAttendanceRecordingWindow(now);

  const checkedOutAt = now;

  await prisma.attendance.update({
    where: { id: existing.id },
    data: { checkedOutAt, checkoutSource: "QR" },
  });

  return buildCompletedScanResult({
    userId: params.userId,
    event: "CHECK_OUT",
    workPointId: workPoint.id,
    workPointName: workPoint.name,
    date,
    checkedInAt: existing.checkedInAt,
    checkedOutAt,
    checkoutSource: "QR",
  });
}

export async function listAttendance(params: {
  workPointId: string;
  companyId: string;
  from?: Date;
  to?: Date;
}): Promise<AttendanceRecord[]> {
  await autoCloseOpenAttendances();

  return prisma.attendance.findMany({
    where: {
      workPointId: params.workPointId,
      workPoint: { companyId: params.companyId },
      ...(params.from || params.to
        ? {
          date: {
            ...(params.from ? { gte: params.from } : {}),
            ...(params.to ? { lte: params.to } : {}),
          },
        }
        : {}),
    },
    select: {
      id: true,
      workerId: true,
      workPointId: true,
      date: true,
      checkedInAt: true,
      checkedOutAt: true,
      checkoutSource: true,
      source: true,
      worker: { select: { id: true, username: true, email: true } },
    },
    orderBy: [{ date: "desc" }, { checkedInAt: "desc" }],
  });
}

export async function getLiveFollowSnapshot(params: {
  companyId: string;
  limit?: number;
}): Promise<LiveFollowSnapshot> {
  await autoCloseOpenAttendances();

  const eventLimit = normalizeLiveFollowEventLimit(params.limit);
  const now = new Date();

  const [workPoints, recentEventRows] = await Promise.all([
    prisma.workPoint.findMany({
      where: { companyId: params.companyId },
      select: {
        id: true,
        name: true,
        address: true,
        _count: { select: { workers: true } },
        attendances: {
          where: { checkedOutAt: null },
          select: {
            id: true,
            workerId: true,
            checkedInAt: true,
            source: true,
            worker: { select: { id: true, username: true, email: true } },
          },
          orderBy: [{ checkedInAt: "asc" }, { id: "asc" }],
        },
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    }),
    prisma.$queryRaw<LiveFollowRecentEventRow[]>(Prisma.sql`
      WITH live_events AS (
        SELECT
          a.id AS "attendanceId",
          a.work_point_id AS "workPointId",
          a.worker_id AS "workerId",
          u.username AS "workerUsername",
          u.email AS "workerEmail",
          'CHECK_IN'::text AS "event",
          a.checked_in_at AS "occurredAt",
          a.source AS "source",
          a.checkout_source AS "checkoutSource"
        FROM attendances a
        INNER JOIN "WorkPoint" wp ON wp.id = a.work_point_id
        INNER JOIN "User" u ON u.id = a.worker_id
        WHERE wp.company_id = ${params.companyId}

        UNION ALL

        SELECT
          a.id AS "attendanceId",
          a.work_point_id AS "workPointId",
          a.worker_id AS "workerId",
          u.username AS "workerUsername",
          u.email AS "workerEmail",
          'CHECK_OUT'::text AS "event",
          a.checked_out_at AS "occurredAt",
          a.source AS "source",
          a.checkout_source AS "checkoutSource"
        FROM attendances a
        INNER JOIN "WorkPoint" wp ON wp.id = a.work_point_id
        INNER JOIN "User" u ON u.id = a.worker_id
        WHERE wp.company_id = ${params.companyId}
          AND a.checked_out_at IS NOT NULL
      ),
      ranked_events AS (
        SELECT
          *,
          ROW_NUMBER() OVER (
            PARTITION BY "workPointId"
            ORDER BY
              "occurredAt" DESC,
              CASE WHEN "event" = 'CHECK_OUT' THEN 1 ELSE 0 END DESC
          ) AS "eventRank"
        FROM live_events
      )
      SELECT
        "attendanceId",
        "workPointId",
        "workerId",
        "workerUsername",
        "workerEmail",
        "event",
        "occurredAt",
        "source",
        "checkoutSource"
      FROM ranked_events
      WHERE "eventRank" <= ${eventLimit}
      ORDER BY
        "workPointId" ASC,
        "occurredAt" DESC,
        CASE WHEN "event" = 'CHECK_OUT' THEN 1 ELSE 0 END DESC
    `),
  ]);

  const eventsByWorkPoint = new Map<string, LiveFollowRecentEvent[]>();
  for (const row of recentEventRows) {
    const events = eventsByWorkPoint.get(row.workPointId) ?? [];
    events.push({
      attendanceId: row.attendanceId,
      workerId: row.workerId,
      workerUsername: row.workerUsername,
      workerEmail: row.workerEmail,
      event: row.event,
      occurredAt: row.occurredAt.toISOString(),
      source: row.source,
      checkoutSource: row.checkoutSource,
    });
    eventsByWorkPoint.set(row.workPointId, events);
  }

  const liveWorkPoints = workPoints.map((workPoint): LiveFollowWorkPoint => {
    const activeCheckIns = workPoint.attendances.map((attendance) => ({
      attendanceId: attendance.id,
      workerId: attendance.workerId,
      workerUsername: attendance.worker.username,
      workerEmail: attendance.worker.email,
      checkedInAt: attendance.checkedInAt.toISOString(),
      source: attendance.source,
    }));
    const recentEvents = limitLiveFollowEvents(
      eventsByWorkPoint.get(workPoint.id) ?? [],
      eventLimit,
    );
    const latestEvent = recentEvents[0] ?? null;
    const status = evaluateLiveFollowStatus({
      now,
      activeCheckIns,
      latestEvent,
    });

    return {
      id: workPoint.id,
      name: workPoint.name,
      address: workPoint.address,
      assignedWorkerCount: workPoint._count.workers,
      activeWorkerCount: activeCheckIns.length,
      status: status.status,
      warningReasons: status.warningReasons,
      latestActivityAt: latestEvent?.occurredAt ?? null,
      activeCheckIns,
      recentEvents,
    };
  });

  return {
    generatedAt: now.toISOString(),
    totals: {
      workpoints: liveWorkPoints.length,
      activeWorkers: liveWorkPoints.reduce(
        (total, workPoint) => total + workPoint.activeWorkerCount,
        0,
      ),
      activeWorkpoints: liveWorkPoints.filter(
        (workPoint) => workPoint.activeWorkerCount > 0,
      ).length,
      warnings: liveWorkPoints.filter((workPoint) => workPoint.status === "WARNING")
        .length,
    },
    workPoints: liveWorkPoints,
  };
}

export async function manualMark(params: {
  workerId: string;
  workPointId: string;
  companyId: string;
  date: Date;
  checkedInAt?: Date;
  checkedOutAt?: Date;
}): Promise<AttendanceRecord> {
  const [worker, workPoint] = await Promise.all([
    prisma.user.findFirst({
      where: { id: params.workerId, companyId: params.companyId },
      select: { id: true },
    }),
    prisma.workPoint.findFirst({
      where: { id: params.workPointId, companyId: params.companyId },
      select: { id: true },
    }),
  ]);
  if (!worker || !workPoint) {
    const err = new Error("Worker or workpoint not found");
    (err as NodeJS.ErrnoException).code = "NOT_FOUND";
    throw err;
  }

  const checkedInAt = params.checkedInAt ?? new Date();
  if (params.checkedOutAt && params.checkedOutAt <= checkedInAt) {
    const err = new Error("Check-out time must be after check-in time");
    (err as NodeJS.ErrnoException).code = "INVALID";
    throw err;
  }

  try {
    return await prisma.attendance.create({
      data: {
        workerId: params.workerId,
        workPointId: params.workPointId,
        date: params.date,
        checkedInAt,
        source: "MANUAL",
        ...(params.checkedOutAt
          ? { checkedOutAt: params.checkedOutAt, checkoutSource: "MANUAL" }
          : {}),
      },
      select: {
        id: true,
        workerId: true,
        workPointId: true,
        date: true,
        checkedInAt: true,
        checkedOutAt: true,
        checkoutSource: true,
        source: true,
        worker: { select: { id: true, username: true, email: true } },
      },
    });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      const conflict = new Error("Attendance already exists for this day");
      (conflict as NodeJS.ErrnoException).code = "DUPLICATE";
      throw conflict;
    }
    throw err;
  }
}

export async function setCheckoutTime(
  attendanceId: string,
  companyId: string,
  checkedOutAt: Date,
): Promise<AttendanceRecord> {
  const record = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    select: { checkedInAt: true, workPoint: { select: { companyId: true } } },
  });

  if (!record || record.workPoint.companyId !== companyId) {
    const err = new Error("Attendance record not found");
    (err as NodeJS.ErrnoException).code = "NOT_FOUND";
    throw err;
  }

  if (checkedOutAt <= record.checkedInAt) {
    const err = new Error("Check-out time must be after check-in time");
    (err as NodeJS.ErrnoException).code = "INVALID";
    throw err;
  }

  return prisma.attendance.update({
    where: { id: attendanceId },
    data: { checkedOutAt, checkoutSource: "MANUAL" },
    select: {
      id: true,
      workerId: true,
      workPointId: true,
      date: true,
      checkedInAt: true,
      checkedOutAt: true,
      checkoutSource: true,
      source: true,
      worker: { select: { id: true, username: true, email: true } },
    },
  });
}

export async function updateAttendanceTimes(params: {
  attendanceId: string;
  companyId: string;
  checkedInAt: Date;
  checkedOutAt: Date | null;
}): Promise<AttendanceRecord> {
  const record = await prisma.attendance.findUnique({
    where: { id: params.attendanceId },
    select: { id: true, workPoint: { select: { companyId: true } } },
  });

  if (!record || record.workPoint.companyId !== params.companyId) {
    const err = new Error("Attendance record not found");
    (err as NodeJS.ErrnoException).code = "NOT_FOUND";
    throw err;
  }

  if (params.checkedOutAt && params.checkedOutAt <= params.checkedInAt) {
    const err = new Error("Check-out time must be after check-in time");
    (err as NodeJS.ErrnoException).code = "INVALID";
    throw err;
  }

  try {
    return await prisma.attendance.update({
      where: { id: params.attendanceId },
      data: {
        date: dateInZone(params.checkedInAt),
        checkedInAt: params.checkedInAt,
        checkedOutAt: params.checkedOutAt ?? null,
        checkoutSource: params.checkedOutAt ? "MANUAL" : null,
      },
      select: {
        id: true,
        workerId: true,
        workPointId: true,
        date: true,
        checkedInAt: true,
        checkedOutAt: true,
        checkoutSource: true,
        source: true,
        worker: { select: { id: true, username: true, email: true } },
      },
    });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      const conflict = new Error("Attendance already exists for this day");
      (conflict as NodeJS.ErrnoException).code = "DUPLICATE";
      throw conflict;
    }
    throw err;
  }
}

export async function removeAttendance(
  id: string,
  companyId: string,
): Promise<{ id: string; workPointId: string; workerId: string }> {
  const record = await prisma.attendance.findUnique({
    where: { id },
    select: { id: true, workPoint: { select: { companyId: true } } },
  });
  if (!record || record.workPoint.companyId !== companyId) {
    const err = new Error("Attendance record not found");
    (err as NodeJS.ErrnoException).code = "NOT_FOUND";
    throw err;
  }

  return prisma.attendance.delete({
    where: { id },
    select: { id: true, workPointId: true, workerId: true },
  });
}

export async function getAttendanceObserverUserIds(
  workPointId: string,
  workerId?: string,
): Promise<string[]> {
  const workPoint = await prisma.workPoint.findUnique({
    where: { id: workPointId },
    select: { companyId: true, workers: { select: { id: true } } },
  });
  if (!workPoint) return workerId ? [workerId] : [];

  const operators = await prisma.user.findMany({
    where: { companyId: workPoint.companyId, role: { in: ["ADMIN", "LEADER"] } },
    select: { id: true },
  });

  const userIds = new Set<string>();
  operators.forEach((operator) => userIds.add(operator.id));
  workPoint?.workers.forEach((worker) => userIds.add(worker.id));
  if (workerId) userIds.add(workerId);

  return Array.from(userIds);
}

export async function getQrForWorkPoint(params: {
  workPointId: string;
  companyId: string;
  frontendBaseUrl: string;
}): Promise<{ qrToken: string; qrPng: string }> {
  const workPoint = await prisma.workPoint.findFirst({
    where: { id: params.workPointId, companyId: params.companyId },
    select: { qrToken: true },
  });

  if (!workPoint) {
    const err = new Error("Workpoint not found");
    (err as NodeJS.ErrnoException).code = "NOT_FOUND";
    throw err;
  }

  const url = `${params.frontendBaseUrl}/checkin/${workPoint.qrToken}`;
  const qrPng = await QRCode.toDataURL(url, { width: 512, margin: 2 });

  return { qrToken: workPoint.qrToken, qrPng };
}

export async function rotateQrToken(
  workPointId: string,
  companyId: string,
): Promise<{
  qrToken: string;
  qrPng: string;
  frontendBaseUrl: string;
}> {
  const workPoint = await prisma.workPoint.findFirst({
    where: { id: workPointId, companyId },
    select: { id: true },
  });
  if (!workPoint) {
    const err = new Error("Workpoint not found");
    (err as NodeJS.ErrnoException).code = "NOT_FOUND";
    throw err;
  }

  const updated = await prisma.workPoint.update({
    where: { id: workPointId },
    data: { qrToken: crypto.randomUUID() },
    select: { qrToken: true },
  });

  return { qrToken: updated.qrToken, qrPng: "", frontendBaseUrl: "" };
}

export async function getAttendanceSummary(
  workPointId: string,
  companyId: string,
): Promise<AttendanceSummary[]> {
  await autoCloseOpenAttendances();

  const assignedWorkers = await prisma.workPoint.findFirst({
    where: { id: workPointId, companyId },
    select: {
      workers: {
        select: {
          id: true,
          username: true,
          email: true,
          hourlyWage: true,
        },
      },
    },
  });

  if (!assignedWorkers) return [];

  const records = await prisma.attendance.findMany({
    where: { workPointId, workPoint: { companyId } },
    select: {
      workerId: true,
      date: true,
      checkedInAt: true,
      checkedOutAt: true,
    },
    orderBy: { date: "asc" },
  });

  const byWorker = new Map<
    string,
    { dates: Date[]; totalHours: number }
  >();

  for (const r of records) {
    if (!byWorker.has(r.workerId)) byWorker.set(r.workerId, { dates: [], totalHours: 0 });
    const entry = byWorker.get(r.workerId)!;
    entry.dates.push(r.date);
    if (r.checkedOutAt) {
      entry.totalHours += computeBillableHours(r.checkedInAt, r.checkedOutAt);
    }
  }

  return assignedWorkers.workers.map((w) => {
    const entry = byWorker.get(w.id);
    const dates = entry?.dates ?? [];
    const totalHours = entry?.totalHours ?? 0;
    const completeDays = records.filter(
      (r) => r.workerId === w.id && r.checkedOutAt !== null,
    ).length;
    const totalEarnings =
      w.hourlyWage != null ? totalHours * w.hourlyWage : null;
    return {
      workerId: w.id,
      username: w.username,
      email: w.email,
      totalDays: dates.length,
      completeDays,
      totalHours,
      totalEarnings,
      firstDate: dates[0] ?? null,
      lastDate: dates[dates.length - 1] ?? null,
    };
  });
}

export async function getMyDailyStats(
  userId: string,
  year: number,
  month: number,
): Promise<DailyStatRow[]> {
  await autoCloseOpenAttendances();

  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 0));

  const worker = await prisma.user.findUnique({
    where: { id: userId },
    select: { hourlyWage: true },
  });

  const records = await prisma.attendance.findMany({
    where: {
      workerId: userId,
      date: { gte: from, lte: to },
    },
    select: {
      id: true,
      date: true,
      checkedInAt: true,
      checkedOutAt: true,
      checkoutSource: true,
      workPoint: { select: { id: true, name: true } },
    },
    orderBy: { date: "asc" },
  });

  return records.map((r) => {
    const complete = r.checkedOutAt !== null;
    const hours = complete ? computeBillableHours(r.checkedInAt, r.checkedOutAt!) : 0;
    const earnings =
      complete && worker?.hourlyWage != null ? hours * worker.hourlyWage : 0;
    return {
      id: r.id,
      date: r.date,
      workPoint: r.workPoint,
      checkedInAt: r.checkedInAt,
      checkedOutAt: r.checkedOutAt,
      checkoutSource: r.checkoutSource,
      hours,
      earnings,
      complete,
    };
  });
}

export async function getMyMonthlySummary(
  userId: string,
  year: number,
  month: number,
): Promise<MonthlySummary> {
  const rows = await getMyDailyStats(userId, year, month);
  const worker = await prisma.user.findUnique({
    where: { id: userId },
    select: { hourlyWage: true },
  });

  const completeDays = rows.filter((r) => r.complete).length;
  const totalHours = rows.reduce((sum, r) => sum + r.hours, 0);
  const totalEarnings = rows.reduce((sum, r) => sum + r.earnings, 0);

  return {
    totalDays: rows.length,
    completeDays,
    totalHours,
    totalEarnings,
    hourlyWage: worker?.hourlyWage ?? null,
  };
}

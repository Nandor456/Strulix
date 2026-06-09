import { prisma } from "../../database/prisma.js";
import { Prisma } from "../../database/generated/prisma/client.js";
import { companyWorkPointAccessWhere } from "./accessPolicy.js";
import {
  GEOFENCE_RADIUS_METERS,
  distanceMeters,
  type Coordinates,
} from "../utils/geo.js";

export type AttendanceMonitoringPlatform = "ios" | "android" | "web";
export type AttendanceMonitoringStatus =
  | "ACTIVE"
  | "PENDING"
  | "UNAVAILABLE"
  | "STOPPED";
export type AttendanceLocationCheckStatus =
  | "IN_RADIUS"
  | "OUT_OF_RADIUS"
  | "MISSED";
export type AttendanceLocationAlertType =
  | "OUT_OF_RADIUS"
  | "MISSED_CHECK"
  | "MONITORING_UNAVAILABLE";
export type AttendanceLocationAlertStatus = "OPEN" | "REVIEWED";
export type AttendanceLocationReviewOutcome = "VALID" | "INVALID";

export type OpenAttendanceMonitoringDTO = {
  attendanceId: string;
  workPointId: string;
  workPointName: string;
  checkedInAt: string;
  monitoringStatus: string;
  monitoringPlatform: string | null;
  monitoringStartedAt: string | null;
  nextCheckpointDueAt: string;
  intervalMinutes: number;
  graceMinutes: number;
  radiusMeters: number;
};

export type AttendanceLocationAlertDTO = {
  id: string;
  attendanceId: string;
  checkId: string | null;
  workPointId: string;
  workerId: string;
  type: string;
  status: string;
  dueAt: string | null;
  capturedAt: string | null;
  distanceMeters: number | null;
  lat: number | null;
  lng: number | null;
  reviewOutcome: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  worker: {
    id: string;
    username: string;
    email: string;
    role: string;
    company: { id: string; name: string };
  };
  workPoint: { id: string; name: string; address: string };
  attendance: {
    checkedInAt: string;
    checkedOutAt: string | null;
    source: string;
  };
  reviewer: { id: string; username: string; email: string } | null;
};

export const ATTENDANCE_LOCATION_CHECK_INTERVAL_MS = 60 * 60 * 1000;
export const ATTENDANCE_LOCATION_MISSED_GRACE_MS = 15 * 60 * 1000;
export const ATTENDANCE_LOCATION_SAMPLE_WINDOW_MS = 15 * 60 * 1000;

const MAX_MISSED_CHECKS_PER_ATTENDANCE_RUN = 48;
const MOBILE_MONITORING_PLATFORMS = new Set(["ios", "android"]);

const attendanceLocationAlertSelect = {
  id: true,
  attendanceId: true,
  checkId: true,
  workPointId: true,
  workerId: true,
  type: true,
  status: true,
  dueAt: true,
  capturedAt: true,
  distanceMeters: true,
  lat: true,
  lng: true,
  reviewOutcome: true,
  reviewNote: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
  worker: {
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      company: { select: { id: true, name: true } },
    },
  },
  workPoint: { select: { id: true, name: true, address: true } },
  attendance: {
    select: {
      checkedInAt: true,
      checkedOutAt: true,
      source: true,
    },
  },
  reviewer: {
    select: {
      id: true,
      username: true,
      email: true,
    },
  },
} as const;

type AlertSelect = Prisma.AttendanceLocationAlertGetPayload<{
  select: typeof attendanceLocationAlertSelect;
}>;

export function normalizeMonitoringPlatform(
  platform: unknown,
): AttendanceMonitoringPlatform {
  return platform === "ios" || platform === "android" ? platform : "web";
}

export function monitoringStatusForPlatform(
  platform: AttendanceMonitoringPlatform,
): AttendanceMonitoringStatus {
  return MOBILE_MONITORING_PLATFORMS.has(platform) ? "ACTIVE" : "UNAVAILABLE";
}

export function calculateAttendanceLocationCheckpointDueAt(
  checkedInAt: Date,
  checkpointNumber: number,
): Date {
  return new Date(
    checkedInAt.getTime() +
      Math.max(1, checkpointNumber) * ATTENDANCE_LOCATION_CHECK_INTERVAL_MS,
  );
}

export function checkpointNumberForDueAt(
  checkedInAt: Date,
  dueAt: Date,
): number | null {
  const elapsedMs = dueAt.getTime() - checkedInAt.getTime();
  if (elapsedMs < ATTENDANCE_LOCATION_CHECK_INTERVAL_MS) return null;
  if (elapsedMs % ATTENDANCE_LOCATION_CHECK_INTERVAL_MS !== 0) return null;
  return elapsedMs / ATTENDANCE_LOCATION_CHECK_INTERVAL_MS;
}

export function nextAttendanceLocationCheckpointDueAt(
  checkedInAt: Date,
  now = new Date(),
): Date {
  const elapsedMs = Math.max(0, now.getTime() - checkedInAt.getTime());
  const checkpointNumber =
    Math.floor(elapsedMs / ATTENDANCE_LOCATION_CHECK_INTERVAL_MS) + 1;
  return calculateAttendanceLocationCheckpointDueAt(
    checkedInAt,
    checkpointNumber,
  );
}

export function isCapturedAtWithinCheckpointWindow(params: {
  dueAt: Date;
  capturedAt: Date;
}): boolean {
  const deltaMs = Math.abs(
    params.capturedAt.getTime() - params.dueAt.getTime(),
  );
  return deltaMs <= ATTENDANCE_LOCATION_SAMPLE_WINDOW_MS;
}

export function toAttendanceLocationAlertDTO(
  alert: AlertSelect,
): AttendanceLocationAlertDTO {
  return {
    id: alert.id,
    attendanceId: alert.attendanceId,
    checkId: alert.checkId,
    workPointId: alert.workPointId,
    workerId: alert.workerId,
    type: alert.type,
    status: alert.status,
    dueAt: alert.dueAt?.toISOString() ?? null,
    capturedAt: alert.capturedAt?.toISOString() ?? null,
    distanceMeters: alert.distanceMeters,
    lat: alert.lat,
    lng: alert.lng,
    reviewOutcome: alert.reviewOutcome,
    reviewNote: alert.reviewNote,
    reviewedAt: alert.reviewedAt?.toISOString() ?? null,
    createdAt: alert.createdAt.toISOString(),
    updatedAt: alert.updatedAt.toISOString(),
    worker: alert.worker,
    workPoint: alert.workPoint,
    attendance: {
      checkedInAt: alert.attendance.checkedInAt.toISOString(),
      checkedOutAt: alert.attendance.checkedOutAt?.toISOString() ?? null,
      source: alert.attendance.source,
    },
    reviewer: alert.reviewer,
  };
}

export async function getAttendanceLocationAlertObserverUserIds(
  workPointId: string,
): Promise<string[]> {
  const workPoint = await prisma.workPoint.findUnique({
    where: { id: workPointId },
    select: { companyId: true },
  });
  if (!workPoint) return [];

  const operators = await prisma.user.findMany({
    where: {
      companyId: workPoint.companyId,
      OR: [
        { role: "ADMIN" },
        {
          role: "LEADER",
          OR: [
            { assignedWorkPoints: { some: { id: workPointId } } },
            { attendances: { some: { workPointId } } },
          ],
        },
      ],
    },
    select: { id: true },
  });

  return [...new Set(operators.map((operator) => operator.id))];
}

async function createLocationAlert(params: {
  attendanceId: string;
  checkId?: string | null;
  workPointId: string;
  workerId: string;
  type: AttendanceLocationAlertType;
  dueAt?: Date | null;
  capturedAt?: Date | null;
  distanceMeters?: number | null;
  location?: Coordinates | null;
  dedupeKey: string;
}): Promise<{ alert: AttendanceLocationAlertDTO; created: boolean }> {
  const existing = await prisma.attendanceLocationAlert.findUnique({
    where: { dedupeKey: params.dedupeKey },
    select: attendanceLocationAlertSelect,
  });
  if (existing) {
    return { alert: toAttendanceLocationAlertDTO(existing), created: false };
  }

  try {
    const alert = await prisma.attendanceLocationAlert.create({
      data: {
        attendanceId: params.attendanceId,
        checkId: params.checkId ?? null,
        workPointId: params.workPointId,
        workerId: params.workerId,
        type: params.type,
        dueAt: params.dueAt ?? null,
        capturedAt: params.capturedAt ?? null,
        distanceMeters: params.distanceMeters ?? null,
        lat: params.location?.lat ?? null,
        lng: params.location?.lng ?? null,
        dedupeKey: params.dedupeKey,
      },
      select: attendanceLocationAlertSelect,
    });
    return { alert: toAttendanceLocationAlertDTO(alert), created: true };
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      const alert = await prisma.attendanceLocationAlert.findUniqueOrThrow({
        where: { dedupeKey: params.dedupeKey },
        select: attendanceLocationAlertSelect,
      });
      return { alert: toAttendanceLocationAlertDTO(alert), created: false };
    }
    throw err;
  }
}

export async function createMonitoringUnavailableAlert(
  attendanceId: string,
): Promise<{ alert: AttendanceLocationAlertDTO; created: boolean } | null> {
  const attendance = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    select: {
      id: true,
      workerId: true,
      workPointId: true,
      checkedInAt: true,
    },
  });
  if (!attendance) return null;

  return createLocationAlert({
    attendanceId: attendance.id,
    workPointId: attendance.workPointId,
    workerId: attendance.workerId,
    type: "MONITORING_UNAVAILABLE",
    dueAt: attendance.checkedInAt,
    dedupeKey: `attendance:${attendance.id}:monitoring-unavailable`,
  });
}

export async function listOpenAttendancesForWorker(
  workerId: string,
): Promise<OpenAttendanceMonitoringDTO[]> {
  const now = new Date();
  const records = await prisma.attendance.findMany({
    where: {
      workerId,
      checkedOutAt: null,
    },
    select: {
      id: true,
      workPointId: true,
      checkedInAt: true,
      monitoringStatus: true,
      monitoringPlatform: true,
      monitoringStartedAt: true,
      workPoint: { select: { name: true } },
    },
    orderBy: { checkedInAt: "asc" },
  });

  return records.map((record) => ({
    attendanceId: record.id,
    workPointId: record.workPointId,
    workPointName: record.workPoint.name,
    checkedInAt: record.checkedInAt.toISOString(),
    monitoringStatus: record.monitoringStatus,
    monitoringPlatform: record.monitoringPlatform,
    monitoringStartedAt: record.monitoringStartedAt?.toISOString() ?? null,
    nextCheckpointDueAt: nextAttendanceLocationCheckpointDueAt(
      record.checkedInAt,
      now,
    ).toISOString(),
    intervalMinutes: ATTENDANCE_LOCATION_CHECK_INTERVAL_MS / 60_000,
    graceMinutes: ATTENDANCE_LOCATION_MISSED_GRACE_MS / 60_000,
    radiusMeters: GEOFENCE_RADIUS_METERS,
  }));
}

export async function recordAttendanceLocationCheck(params: {
  workerId: string;
  attendanceId: string;
  dueAt: Date;
  capturedAt: Date;
  location: Coordinates;
  now?: Date;
}): Promise<{
  check: {
    id: string;
    attendanceId: string;
    dueAt: string;
    capturedAt: string | null;
    receivedAt: string | null;
    status: string;
    distanceMeters: number | null;
  };
  alert: AttendanceLocationAlertDTO | null;
}> {
  const now = params.now ?? new Date();
  const attendance = await prisma.attendance.findFirst({
    where: {
      id: params.attendanceId,
      workerId: params.workerId,
      checkedOutAt: null,
      monitoringStatus: "ACTIVE",
    },
    select: {
      id: true,
      workerId: true,
      workPointId: true,
      checkedInAt: true,
      workPoint: {
        select: {
          lat: true,
          lng: true,
        },
      },
    },
  });

  if (!attendance) {
    const err = new Error("Open monitored attendance not found");
    (err as NodeJS.ErrnoException).code = "NOT_FOUND";
    throw err;
  }

  if (attendance.workPoint.lat === null || attendance.workPoint.lng === null) {
    const err = new Error("This workpoint does not have coordinates set");
    (err as NodeJS.ErrnoException).code = "MISSING_COORDINATES";
    throw err;
  }

  const checkpointNumber = checkpointNumberForDueAt(
    attendance.checkedInAt,
    params.dueAt,
  );
  if (!checkpointNumber) {
    const err = new Error("Invalid checkpoint time");
    (err as NodeJS.ErrnoException).code = "INVALID";
    throw err;
  }

  if (
    !isCapturedAtWithinCheckpointWindow({
      dueAt: params.dueAt,
      capturedAt: params.capturedAt,
    })
  ) {
    const err = new Error("Location sample is outside the checkpoint window");
    (err as NodeJS.ErrnoException).code = "INVALID";
    throw err;
  }

  const distance = distanceMeters(params.location, {
    lat: attendance.workPoint.lat,
    lng: attendance.workPoint.lng,
  });
  const status: AttendanceLocationCheckStatus =
    distance > GEOFENCE_RADIUS_METERS ? "OUT_OF_RADIUS" : "IN_RADIUS";
  const shouldStoreCoordinates = status === "OUT_OF_RADIUS";

  const check = await prisma.attendanceLocationCheck.upsert({
    where: {
      attendanceId_dueAt: {
        attendanceId: attendance.id,
        dueAt: params.dueAt,
      },
    },
    create: {
      attendanceId: attendance.id,
      dueAt: params.dueAt,
      capturedAt: params.capturedAt,
      receivedAt: now,
      status,
      distanceMeters: distance,
      lat: shouldStoreCoordinates ? params.location.lat : null,
      lng: shouldStoreCoordinates ? params.location.lng : null,
    },
    update: {
      capturedAt: params.capturedAt,
      receivedAt: now,
      status,
      distanceMeters: distance,
      lat: shouldStoreCoordinates ? params.location.lat : null,
      lng: shouldStoreCoordinates ? params.location.lng : null,
    },
    select: {
      id: true,
      attendanceId: true,
      dueAt: true,
      capturedAt: true,
      receivedAt: true,
      status: true,
      distanceMeters: true,
    },
  });

  let alert: AttendanceLocationAlertDTO | null = null;
  if (status === "OUT_OF_RADIUS") {
    const result = await createLocationAlert({
      attendanceId: attendance.id,
      checkId: check.id,
      workPointId: attendance.workPointId,
      workerId: attendance.workerId,
      type: "OUT_OF_RADIUS",
      dueAt: params.dueAt,
      capturedAt: params.capturedAt,
      distanceMeters: distance,
      location: params.location,
      dedupeKey: `attendance:${attendance.id}:outside:${params.dueAt.toISOString()}`,
    });
    alert = result.alert;
  }

  return {
    check: {
      id: check.id,
      attendanceId: check.attendanceId,
      dueAt: check.dueAt.toISOString(),
      capturedAt: check.capturedAt?.toISOString() ?? null,
      receivedAt: check.receivedAt?.toISOString() ?? null,
      status: check.status,
      distanceMeters: check.distanceMeters,
    },
    alert,
  };
}

export async function createMissedAttendanceLocationAlerts(
  now = new Date(),
): Promise<AttendanceLocationAlertDTO[]> {
  const cutoff = new Date(now.getTime() - ATTENDANCE_LOCATION_MISSED_GRACE_MS);
  const attendances = await prisma.attendance.findMany({
    where: {
      checkedOutAt: null,
      monitoringStatus: "ACTIVE",
      checkedInAt: { lte: new Date(cutoff.getTime() - ATTENDANCE_LOCATION_CHECK_INTERVAL_MS) },
    },
    select: {
      id: true,
      workerId: true,
      workPointId: true,
      checkedInAt: true,
    },
  });

  const createdAlerts: AttendanceLocationAlertDTO[] = [];

  for (const attendance of attendances) {
    let checkpointNumber = 1;
    let dueAt = calculateAttendanceLocationCheckpointDueAt(
      attendance.checkedInAt,
      checkpointNumber,
    );
    let createdForAttendance = 0;

    while (
      dueAt <= cutoff &&
      createdForAttendance < MAX_MISSED_CHECKS_PER_ATTENDANCE_RUN
    ) {
      const check = await prisma.attendanceLocationCheck.upsert({
        where: {
          attendanceId_dueAt: {
            attendanceId: attendance.id,
            dueAt,
          },
        },
        create: {
          attendanceId: attendance.id,
          dueAt,
          status: "MISSED",
        },
        update: {},
        select: {
          id: true,
          status: true,
        },
      });

      if (check.status === "MISSED") {
        const result = await createLocationAlert({
          attendanceId: attendance.id,
          checkId: check.id,
          workPointId: attendance.workPointId,
          workerId: attendance.workerId,
          type: "MISSED_CHECK",
          dueAt,
          dedupeKey: `attendance:${attendance.id}:missed:${dueAt.toISOString()}`,
        });
        if (result.created) createdAlerts.push(result.alert);
      }

      checkpointNumber += 1;
      createdForAttendance += 1;
      dueAt = calculateAttendanceLocationCheckpointDueAt(
        attendance.checkedInAt,
        checkpointNumber,
      );
    }
  }

  return createdAlerts;
}

let activeMonitoringRun: Promise<AttendanceLocationAlertDTO[]> | null = null;
let monitoringInterval: NodeJS.Timeout | null = null;

export function runAttendanceLocationMonitoringJob(
  now = new Date(),
): Promise<AttendanceLocationAlertDTO[]> {
  if (activeMonitoringRun) return activeMonitoringRun;

  activeMonitoringRun = createMissedAttendanceLocationAlerts(now).finally(() => {
    activeMonitoringRun = null;
  });

  return activeMonitoringRun;
}

export function startAttendanceLocationMonitoringJob(params: {
  onAlertsCreated?: (alerts: AttendanceLocationAlertDTO[]) => void;
} = {}): NodeJS.Timeout {
  if (monitoringInterval) return monitoringInterval;

  const run = () => {
    void runAttendanceLocationMonitoringJob()
      .then((alerts) => {
        if (alerts.length > 0) {
          console.log(
            `Created ${alerts.length} attendance location alert(s).`,
          );
          params.onAlertsCreated?.(alerts);
        }
      })
      .catch((err) => {
        console.error("Attendance location monitoring job failed:", err);
      });
  };

  run();
  monitoringInterval = setInterval(run, 60_000);
  return monitoringInterval;
}

export async function listAttendanceLocationAlerts(params: {
  userId: string;
  companyId: string;
  role: string;
  workPointId?: string;
  status?: AttendanceLocationAlertStatus | "ALL";
}): Promise<AttendanceLocationAlertDTO[]> {
  const alerts = await prisma.attendanceLocationAlert.findMany({
    where: {
      ...(params.workPointId ? { workPointId: params.workPointId } : {}),
      ...(params.status && params.status !== "ALL"
        ? { status: params.status }
        : {}),
      workPoint: companyWorkPointAccessWhere(params),
    },
    select: attendanceLocationAlertSelect,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return alerts.map(toAttendanceLocationAlertDTO);
}

export async function reviewAttendanceLocationAlert(params: {
  alertId: string;
  userId: string;
  companyId: string;
  role: string;
  outcome: AttendanceLocationReviewOutcome;
  note?: string | null;
}): Promise<AttendanceLocationAlertDTO> {
  const alert = await prisma.attendanceLocationAlert.findFirst({
    where: {
      id: params.alertId,
      workPoint: companyWorkPointAccessWhere(params),
    },
    select: { id: true },
  });

  if (!alert) {
    const err = new Error("Attendance location alert not found");
    (err as NodeJS.ErrnoException).code = "NOT_FOUND";
    throw err;
  }

  const updated = await prisma.attendanceLocationAlert.update({
    where: { id: alert.id },
    data: {
      status: "REVIEWED",
      reviewOutcome: params.outcome,
      reviewNote: params.note?.trim() ? params.note.trim() : null,
      reviewedBy: params.userId,
      reviewedAt: new Date(),
    },
    select: attendanceLocationAlertSelect,
  });

  return toAttendanceLocationAlertDTO(updated);
}

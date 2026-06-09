import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { prisma } from "../database/prisma.js";
import {
  manualMark,
  recordAttendance,
} from "../src/services/attendanceService.js";

const WORKPOINT_LOCATION = { lat: 45.761186, lng: 25.371426 };
const FAR_LOCATION = { lat: 46.761186, lng: 25.371426 };
const SUCCESS_NOW = new Date("2000-01-01T09:00:00.000Z");
const OUTSIDE_WINDOW_NOW = new Date("2000-01-01T03:00:00.000Z");
const databaseAvailable = await canUseDatabase();

async function canUseDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

function databaseTest(
  name: string,
  fn: (t: TestContext) => Promise<void>,
) {
  test(
    name,
    {
      skip: databaseAvailable ? false : "Postgres test database is unavailable",
    },
    fn,
  );
}

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function createFixture(params: {
  workerRole?: string;
  lat?: number | null;
  lng?: number | null;
} = {}) {
  const suffix = uniqueSuffix();
  const company = await prisma.company.create({
    data: {
      name: `Auto assignment ${suffix}`,
      billingStatus: "ACTIVE",
    },
  });
  const worker = await prisma.user.create({
    data: {
      username: `auto-worker-${suffix}`,
      email: `auto-worker-${suffix}@example.com`,
      password: "hashed-password",
      role: params.workerRole ?? "WORKER",
      companyId: company.id,
    },
  });
  const workPoint = await prisma.workPoint.create({
    data: {
      name: `Auto workpoint ${suffix}`,
      address: "45.761186, 25.371426",
      lat: params.lat === undefined ? WORKPOINT_LOCATION.lat : params.lat,
      lng: params.lng === undefined ? WORKPOINT_LOCATION.lng : params.lng,
      companyId: company.id,
    },
  });

  return { company, worker, workPoint };
}

async function isWorkerConnected(workPointId: string, workerId: string) {
  const workPoint = await prisma.workPoint.findFirst({
    where: {
      id: workPointId,
      workers: { some: { id: workerId } },
    },
    select: { id: true },
  });
  return workPoint !== null;
}

async function attendanceCount(workPointId: string, workerId: string) {
  return prisma.attendance.count({ where: { workPointId, workerId } });
}

async function hasWorkPointChatParticipant(workPointId: string, userId: string) {
  const chat = await prisma.chat.findUnique({
    where: { workPointId },
    select: {
      participants: {
        where: { userId },
        select: { id: true },
      },
    },
  });
  return (chat?.participants.length ?? 0) > 0;
}

databaseTest("unassociated same-company worker scan creates attendance and associates worker", async (t) => {
  const { company, worker, workPoint } = await createFixture();
  t.after(() => prisma.company.delete({ where: { id: company.id } }).then(() => undefined));

  const result = await recordAttendance({
    userId: worker.id,
    companyId: company.id,
    userRole: "WORKER",
    qrToken: workPoint.qrToken,
    workerLocation: WORKPOINT_LOCATION,
    source: "QR",
    now: SUCCESS_NOW,
  });

  assert.equal(result.result.event, "CHECK_IN");
  assert.equal(result.workerAssociated, true);
  assert.equal(await isWorkerConnected(workPoint.id, worker.id), true);
  assert.equal(await attendanceCount(workPoint.id, worker.id), 1);
  assert.equal(await hasWorkPointChatParticipant(workPoint.id, worker.id), true);
});

databaseTest("cross-company QR scan is rejected without association or attendance", async (t) => {
  const first = await createFixture();
  const second = await createFixture();
  t.after(async () => {
    await prisma.company.delete({ where: { id: first.company.id } });
    await prisma.company.delete({ where: { id: second.company.id } });
  });

  await assert.rejects(
    () =>
      recordAttendance({
        userId: second.worker.id,
        companyId: second.company.id,
        userRole: "WORKER",
        qrToken: first.workPoint.qrToken,
        workerLocation: WORKPOINT_LOCATION,
        source: "QR",
        now: SUCCESS_NOW,
      }),
    (error: unknown) => (error as NodeJS.ErrnoException).code === "NOT_FOUND",
  );

  assert.equal(await isWorkerConnected(first.workPoint.id, second.worker.id), false);
  assert.equal(await attendanceCount(first.workPoint.id, second.worker.id), 0);
});

databaseTest("admin QR scans are rejected without association or attendance", async (t) => {
  const admin = await createFixture({ workerRole: "ADMIN" });
  t.after(() => prisma.company.delete({ where: { id: admin.company.id } }).then(() => undefined));

  await assert.rejects(
    () =>
      recordAttendance({
        userId: admin.worker.id,
        companyId: admin.company.id,
        userRole: admin.worker.role,
        qrToken: admin.workPoint.qrToken,
        workerLocation: WORKPOINT_LOCATION,
        source: "QR",
        now: SUCCESS_NOW,
      }),
    (error: unknown) => (error as NodeJS.ErrnoException).code === "FORBIDDEN",
  );

  assert.equal(await isWorkerConnected(admin.workPoint.id, admin.worker.id), false);
  assert.equal(await attendanceCount(admin.workPoint.id, admin.worker.id), 0);
});

databaseTest("unassociated same-company leader scan creates attendance and associates leader", async (t) => {
  const { company, worker: leader, workPoint } = await createFixture({
    workerRole: "LEADER",
  });
  t.after(() => prisma.company.delete({ where: { id: company.id } }).then(() => undefined));

  const result = await recordAttendance({
    userId: leader.id,
    companyId: company.id,
    userRole: "LEADER",
    qrToken: workPoint.qrToken,
    workerLocation: WORKPOINT_LOCATION,
    source: "QR",
    now: SUCCESS_NOW,
  });

  assert.equal(result.result.event, "CHECK_IN");
  assert.equal(result.workerAssociated, true);
  assert.equal(await isWorkerConnected(workPoint.id, leader.id), true);
  assert.equal(await attendanceCount(workPoint.id, leader.id), 1);
  assert.equal(await hasWorkPointChatParticipant(workPoint.id, leader.id), true);
});

databaseTest("geofence, coordinate, and recording-window failures do not associate worker", async (t) => {
  const geofence = await createFixture();
  const coordinates = await createFixture({ lat: null, lng: null });
  const window = await createFixture();
  t.after(async () => {
    await prisma.company.delete({ where: { id: geofence.company.id } });
    await prisma.company.delete({ where: { id: coordinates.company.id } });
    await prisma.company.delete({ where: { id: window.company.id } });
  });

  await assert.rejects(
    () =>
      recordAttendance({
        userId: geofence.worker.id,
        companyId: geofence.company.id,
        userRole: "WORKER",
        qrToken: geofence.workPoint.qrToken,
        workerLocation: FAR_LOCATION,
        source: "QR",
        now: SUCCESS_NOW,
      }),
    (error: unknown) => (error as NodeJS.ErrnoException).code === "FORBIDDEN",
  );
  await assert.rejects(
    () =>
      recordAttendance({
        userId: coordinates.worker.id,
        companyId: coordinates.company.id,
        userRole: "WORKER",
        qrToken: coordinates.workPoint.qrToken,
        workerLocation: WORKPOINT_LOCATION,
        source: "QR",
        now: SUCCESS_NOW,
      }),
    (error: unknown) => (error as NodeJS.ErrnoException).code === "MISSING_COORDINATES",
  );
  await assert.rejects(
    () =>
      recordAttendance({
        userId: window.worker.id,
        companyId: window.company.id,
        userRole: "WORKER",
        qrToken: window.workPoint.qrToken,
        workerLocation: WORKPOINT_LOCATION,
        source: "QR",
        now: OUTSIDE_WINDOW_NOW,
      }),
    (error: unknown) => (error as NodeJS.ErrnoException).code === "FORBIDDEN",
  );

  for (const fixture of [geofence, coordinates, window]) {
    assert.equal(await isWorkerConnected(fixture.workPoint.id, fixture.worker.id), false);
    assert.equal(await attendanceCount(fixture.workPoint.id, fixture.worker.id), 0);
  }
});

databaseTest("manual attendance for an unassociated worker associates the worker", async (t) => {
  const { company, worker, workPoint } = await createFixture();
  t.after(() => prisma.company.delete({ where: { id: company.id } }).then(() => undefined));

  const result = await manualMark({
    workerId: worker.id,
    workPointId: workPoint.id,
    userId: worker.id,
    companyId: company.id,
    role: "ADMIN",
    date: new Date("2000-01-02T00:00:00.000Z"),
    checkedInAt: new Date("2000-01-02T09:00:00.000Z"),
    checkedOutAt: new Date("2000-01-02T17:00:00.000Z"),
  });

  assert.equal(result.record.workerId, worker.id);
  assert.equal(result.workerAssociated, true);
  assert.equal(await isWorkerConnected(workPoint.id, worker.id), true);
  assert.equal(await attendanceCount(workPoint.id, worker.id), 1);
  assert.equal(await hasWorkPointChatParticipant(workPoint.id, worker.id), true);
});

databaseTest("manual attendance for an unassociated leader associates the leader", async (t) => {
  const { company, worker: leader, workPoint } = await createFixture({
    workerRole: "LEADER",
  });
  t.after(() => prisma.company.delete({ where: { id: company.id } }).then(() => undefined));

  const result = await manualMark({
    workerId: leader.id,
    workPointId: workPoint.id,
    userId: leader.id,
    companyId: company.id,
    role: "ADMIN",
    date: new Date("2000-01-06T00:00:00.000Z"),
    checkedInAt: new Date("2000-01-06T09:00:00.000Z"),
    checkedOutAt: new Date("2000-01-06T17:00:00.000Z"),
  });

  assert.equal(result.record.workerId, leader.id);
  assert.equal(result.workerAssociated, true);
  assert.equal(await isWorkerConnected(workPoint.id, leader.id), true);
  assert.equal(await attendanceCount(workPoint.id, leader.id), 1);
  assert.equal(await hasWorkPointChatParticipant(workPoint.id, leader.id), true);
});

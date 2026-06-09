import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { prisma } from "../database/prisma.js";
import {
  getAttendanceObserverUserIds,
  getAttendanceSummary,
  getLiveFollowSnapshot,
  getQrForWorkPoint,
  listAttendance,
  manualMark,
} from "../src/services/attendanceService.js";
import {
  listAttendanceWorkersForWorkPoint,
  listWorkers,
  updateWorker,
} from "../src/services/workerService.js";
import {
  createWorkPoint,
  getWorkPointById,
  listWorkPoints,
} from "../src/services/workPointService.js";
import { listWorkPointDocuments } from "../src/services/workPointDocumentService.js";

const WORKPOINT_LOCATION = { lat: 45.761186, lng: 25.371426 };
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

async function createFixture() {
  const suffix = uniqueSuffix();
  const company = await prisma.company.create({
    data: { name: `Leader access ${suffix}`, billingStatus: "ACTIVE" },
  });
  const admin = await prisma.user.create({
    data: {
      username: `leader-access-admin-${suffix}`,
      email: `leader-access-admin-${suffix}@example.com`,
      password: "hashed-password",
      role: "ADMIN",
      companyId: company.id,
    },
  });
  const assignedLeader = await prisma.user.create({
    data: {
      username: `assigned-leader-${suffix}`,
      email: `assigned-leader-${suffix}@example.com`,
      password: "hashed-password",
      role: "LEADER",
      hourlyWage: 40,
      companyId: company.id,
    },
  });
  const unassignedLeader = await prisma.user.create({
    data: {
      username: `unassigned-leader-${suffix}`,
      email: `unassigned-leader-${suffix}@example.com`,
      password: "hashed-password",
      role: "LEADER",
      companyId: company.id,
    },
  });
  const worker = await prisma.user.create({
    data: {
      username: `leader-access-worker-${suffix}`,
      email: `leader-access-worker-${suffix}@example.com`,
      password: "hashed-password",
      role: "WORKER",
      hourlyWage: 30,
      companyId: company.id,
    },
  });
  const assignedWorkPoint = await prisma.workPoint.create({
    data: {
      name: `Assigned ${suffix}`,
      address: "45.761186, 25.371426",
      lat: WORKPOINT_LOCATION.lat,
      lng: WORKPOINT_LOCATION.lng,
      companyId: company.id,
      workers: { connect: [{ id: assignedLeader.id }, { id: worker.id }] },
    },
  });
  const unassignedWorkPoint = await prisma.workPoint.create({
    data: {
      name: `Unassigned ${suffix}`,
      address: "45.761186, 25.371426",
      lat: WORKPOINT_LOCATION.lat,
      lng: WORKPOINT_LOCATION.lng,
      companyId: company.id,
    },
  });

  await prisma.workPointDocument.createMany({
    data: [
      {
        workPointId: assignedWorkPoint.id,
        originalName: `assigned-${suffix}.pdf`,
        storedName: `assigned-${suffix}.pdf`,
        mimeType: "application/pdf",
        sizeBytes: 123,
      },
      {
        workPointId: unassignedWorkPoint.id,
        originalName: `unassigned-${suffix}.pdf`,
        storedName: `unassigned-${suffix}.pdf`,
        mimeType: "application/pdf",
        sizeBytes: 456,
      },
    ],
  });

  return {
    company,
    admin,
    assignedLeader,
    unassignedLeader,
    worker,
    assignedWorkPoint,
    unassignedWorkPoint,
  };
}

databaseTest("leader workpoint reads are limited to assigned workpoints", async (t) => {
  const fixture = await createFixture();
  t.after(() =>
    prisma.company.delete({ where: { id: fixture.company.id } }).then(() => undefined),
  );

  await manualMark({
    workerId: fixture.worker.id,
    workPointId: fixture.assignedWorkPoint.id,
    userId: fixture.admin.id,
    companyId: fixture.company.id,
    role: "ADMIN",
    date: new Date("2000-02-01T00:00:00.000Z"),
    checkedInAt: new Date("2000-02-01T09:00:00.000Z"),
  });

  const adminWorkPoints = await listWorkPoints({
    userId: fixture.admin.id,
    companyId: fixture.company.id,
    role: "ADMIN",
  });
  assert.deepEqual(
    new Set(adminWorkPoints.map((workPoint) => workPoint.id)),
    new Set([fixture.assignedWorkPoint.id, fixture.unassignedWorkPoint.id]),
  );

  const leaderWorkPoints = await listWorkPoints({
    userId: fixture.assignedLeader.id,
    companyId: fixture.company.id,
    role: "LEADER",
  });
  assert.deepEqual(
    leaderWorkPoints.map((workPoint) => workPoint.id),
    [fixture.assignedWorkPoint.id],
  );

  assert.notEqual(
    await getWorkPointById(fixture.assignedWorkPoint.id, {
      userId: fixture.assignedLeader.id,
      companyId: fixture.company.id,
      role: "LEADER",
    }),
    null,
  );
  assert.equal(
    await getWorkPointById(fixture.unassignedWorkPoint.id, {
      userId: fixture.assignedLeader.id,
      companyId: fixture.company.id,
      role: "LEADER",
    }),
    null,
  );

  const visibleAttendance = await listAttendance({
    workPointId: fixture.assignedWorkPoint.id,
    userId: fixture.assignedLeader.id,
    companyId: fixture.company.id,
    role: "LEADER",
  });
  const hiddenAttendance = await listAttendance({
    workPointId: fixture.unassignedWorkPoint.id,
    userId: fixture.assignedLeader.id,
    companyId: fixture.company.id,
    role: "LEADER",
  });
  assert.equal(visibleAttendance.length, 1);
  assert.equal(hiddenAttendance.length, 0);

  await assert.rejects(
    () =>
      getQrForWorkPoint({
        workPointId: fixture.unassignedWorkPoint.id,
        userId: fixture.assignedLeader.id,
        companyId: fixture.company.id,
        role: "LEADER",
        frontendBaseUrl: "http://localhost:5173",
      }),
    (error: unknown) => (error as NodeJS.ErrnoException).code === "NOT_FOUND",
  );
  const qr = await getQrForWorkPoint({
    workPointId: fixture.assignedWorkPoint.id,
    userId: fixture.assignedLeader.id,
    companyId: fixture.company.id,
    role: "LEADER",
    frontendBaseUrl: "http://localhost:5173",
  });
  assert.equal(qr.qrToken, fixture.assignedWorkPoint.qrToken);

  const snapshot = await getLiveFollowSnapshot({
    userId: fixture.assignedLeader.id,
    companyId: fixture.company.id,
    role: "LEADER",
  });
  assert.deepEqual(
    snapshot.workPoints.map((workPoint) => workPoint.id),
    [fixture.assignedWorkPoint.id],
  );

  const documents = await listWorkPointDocuments({
    workPointId: fixture.assignedWorkPoint.id,
    userId: fixture.assignedLeader.id,
  });
  assert.equal(documents.length, 1);
  await assert.rejects(
    () =>
      listWorkPointDocuments({
        workPointId: fixture.unassignedWorkPoint.id,
        userId: fixture.assignedLeader.id,
      }),
    (error: unknown) => (error as { statusCode?: number }).statusCode === 403,
  );
});

databaseTest("leaders appear in roster, attendance candidates, summaries, and observers", async (t) => {
  const fixture = await createFixture();
  t.after(() =>
    prisma.company.delete({ where: { id: fixture.company.id } }).then(() => undefined),
  );

  const workers = await listWorkers(fixture.company.id);
  assert.deepEqual(
    new Set(workers.map((worker) => worker.role)),
    new Set(["WORKER", "LEADER"]),
  );
  assert.ok(workers.some((worker) => worker.id === fixture.assignedLeader.id));

  const updatedLeader = await updateWorker(fixture.assignedLeader.id, fixture.company.id, {
    hourlyWage: 55,
  });
  assert.equal(updatedLeader.hourlyWage, 55);

  const attendanceWorkers = await listAttendanceWorkersForWorkPoint(
    fixture.assignedWorkPoint.id,
    {
      userId: fixture.admin.id,
      companyId: fixture.company.id,
      role: "ADMIN",
    },
  );
  assert.ok(attendanceWorkers.some((worker) => worker.id === fixture.assignedLeader.id));

  await manualMark({
    workerId: fixture.assignedLeader.id,
    workPointId: fixture.assignedWorkPoint.id,
    userId: fixture.admin.id,
    companyId: fixture.company.id,
    role: "ADMIN",
    date: new Date("2000-02-02T00:00:00.000Z"),
    checkedInAt: new Date("2000-02-02T09:00:00.000Z"),
    checkedOutAt: new Date("2000-02-02T17:00:00.000Z"),
  });

  const summary = await getAttendanceSummary(fixture.assignedWorkPoint.id, {
    userId: fixture.admin.id,
    companyId: fixture.company.id,
    role: "ADMIN",
  });
  const leaderSummary = summary.find(
    (row) => row.workerId === fixture.assignedLeader.id,
  );
  assert.equal(leaderSummary?.totalHours, 8);
  assert.equal(leaderSummary?.totalEarnings, 440);

  const observers = await getAttendanceObserverUserIds(
    fixture.assignedWorkPoint.id,
    fixture.assignedLeader.id,
  );
  assert.ok(observers.includes(fixture.admin.id));
  assert.ok(observers.includes(fixture.assignedLeader.id));
  assert.ok(!observers.includes(fixture.unassignedLeader.id));
});

databaseTest("leader-created workpoints automatically assign the creator", async (t) => {
  const fixture = await createFixture();
  t.after(() =>
    prisma.company.delete({ where: { id: fixture.company.id } }).then(() => undefined),
  );

  const created = await createWorkPoint(
    {
      name: "Leader created",
      address: "45.761186, 25.371426",
      description: null,
    },
    fixture.unassignedLeader.id,
    fixture.company.id,
    "LEADER",
  );

  assert.ok(
    created.workers.some((worker) => worker.id === fixture.unassignedLeader.id),
  );
  const leaderWorkPoints = await listWorkPoints({
    userId: fixture.unassignedLeader.id,
    companyId: fixture.company.id,
    role: "LEADER",
  });
  assert.ok(leaderWorkPoints.some((workPoint) => workPoint.id === created.id));
});


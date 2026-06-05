import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { prisma } from "../database/prisma.js";
import {
  getAttendanceSummary,
  listAttendance,
  manualMark,
  recordAttendance,
} from "../src/services/attendanceService.js";
import {
  acceptSubcontractorInvitation,
  createOrRenewSubcontractorInvitation,
  revokeSubcontractorAccess,
} from "../src/services/subcontractorService.js";
import { listAttendanceWorkersForWorkPoint } from "../src/services/workerService.js";
import { listMyAssignedWorkPoints } from "../src/services/workPointService.js";

const WORKPOINT_LOCATION = { lat: 45.761186, lng: 25.371426 };
const SUCCESS_NOW = new Date("2000-01-03T09:00:00.000Z");
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
  const ownerCompany = await prisma.company.create({
    data: { name: `Owner ${suffix}`, billingStatus: "ACTIVE" },
  });
  const subcontractorCompany = await prisma.company.create({
    data: { name: `Subcontractor ${suffix}`, billingStatus: "ACTIVE" },
  });
  const ownerAdmin = await prisma.user.create({
    data: {
      username: `owner-admin-${suffix}`,
      email: `owner-admin-${suffix}@example.com`,
      password: "hashed-password",
      role: "ADMIN",
      companyId: ownerCompany.id,
    },
  });
  const subcontractorAdmin = await prisma.user.create({
    data: {
      username: `sub-admin-${suffix}`,
      email: `sub-admin-${suffix}@example.com`,
      password: "hashed-password",
      role: "ADMIN",
      companyId: subcontractorCompany.id,
    },
  });
  const subcontractorWorker = await prisma.user.create({
    data: {
      username: `sub-worker-${suffix}`,
      email: `sub-worker-${suffix}@example.com`,
      password: "hashed-password",
      role: "WORKER",
      hourlyWage: 99,
      companyId: subcontractorCompany.id,
    },
  });
  const ownerWorker = await prisma.user.create({
    data: {
      username: `owner-worker-${suffix}`,
      email: `owner-worker-${suffix}@example.com`,
      password: "hashed-password",
      role: "WORKER",
      hourlyWage: 50,
      companyId: ownerCompany.id,
    },
  });
  const workPoint = await prisma.workPoint.create({
    data: {
      name: `Owner workpoint ${suffix}`,
      address: "45.761186, 25.371426",
      lat: WORKPOINT_LOCATION.lat,
      lng: WORKPOINT_LOCATION.lng,
      companyId: ownerCompany.id,
    },
  });

  return {
    ownerCompany,
    subcontractorCompany,
    ownerAdmin,
    subcontractorAdmin,
    subcontractorWorker,
    ownerWorker,
    workPoint,
  };
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

databaseTest("subcontractor invite requires another registered company admin", async (t) => {
  const fixture = await createFixture();
  t.after(async () => {
    await prisma.company.delete({ where: { id: fixture.ownerCompany.id } });
    await prisma.company.delete({
      where: { id: fixture.subcontractorCompany.id },
    });
  });

  await assert.rejects(
    () =>
      createOrRenewSubcontractorInvitation({
        invitedAdminEmail: fixture.ownerAdmin.email,
        invitedById: fixture.ownerAdmin.id,
        ownerCompanyId: fixture.ownerCompany.id,
      }),
    (error: unknown) =>
      error instanceof Error && error.message === "Cannot invite your own company",
  );

  await assert.rejects(
    () =>
      createOrRenewSubcontractorInvitation({
        invitedAdminEmail: fixture.subcontractorWorker.email,
        invitedById: fixture.ownerAdmin.id,
        ownerCompanyId: fixture.ownerCompany.id,
      }),
    (error: unknown) =>
      error instanceof Error &&
      error.message === "Registered subcontractor admin not found",
  );
});

databaseTest("accepted subcontractor worker can attend and is reported as external", async (t) => {
  const fixture = await createFixture();
  t.after(async () => {
    await prisma.company.delete({ where: { id: fixture.ownerCompany.id } });
    await prisma.company.delete({
      where: { id: fixture.subcontractorCompany.id },
    });
  });

  const invitation = await createOrRenewSubcontractorInvitation({
    invitedAdminEmail: fixture.subcontractorAdmin.email,
    invitedById: fixture.ownerAdmin.id,
    ownerCompanyId: fixture.ownerCompany.id,
  });
  await acceptSubcontractorInvitation({
    token: new URL(invitation.acceptUrl).searchParams.get("token") ?? "",
    acceptedById: fixture.subcontractorAdmin.id,
    companyId: fixture.subcontractorCompany.id,
    role: "ADMIN",
  });

  const scan = await recordAttendance({
    userId: fixture.subcontractorWorker.id,
    companyId: fixture.subcontractorCompany.id,
    userRole: "WORKER",
    qrToken: fixture.workPoint.qrToken,
    workerLocation: WORKPOINT_LOCATION,
    source: "QR",
    now: SUCCESS_NOW,
  });

  assert.equal(scan.result.event, "CHECK_IN");
  assert.equal(scan.workerAssociated, true);
  assert.equal(
    await isWorkerConnected(fixture.workPoint.id, fixture.subcontractorWorker.id),
    true,
  );
  assert.equal(
    await hasWorkPointChatParticipant(
      fixture.workPoint.id,
      fixture.subcontractorWorker.id,
    ),
    true,
  );

  const records = await listAttendance({
    workPointId: fixture.workPoint.id,
    companyId: fixture.ownerCompany.id,
  });
  assert.equal(records[0].worker.affiliation, "SUBCONTRACTOR");
  assert.equal(records[0].worker.company.id, fixture.subcontractorCompany.id);

  const summary = await getAttendanceSummary(
    fixture.workPoint.id,
    fixture.ownerCompany.id,
  );
  const subcontractorSummary = summary.find(
    (row) => row.workerId === fixture.subcontractorWorker.id,
  );
  assert.equal(subcontractorSummary?.affiliation, "SUBCONTRACTOR");
  assert.equal(subcontractorSummary?.totalEarnings, null);

  const attendanceWorkers = await listAttendanceWorkersForWorkPoint(
    fixture.workPoint.id,
    fixture.ownerCompany.id,
  );
  const externalWorker = attendanceWorkers.find(
    (worker) => worker.id === fixture.subcontractorWorker.id,
  );
  assert.equal(externalWorker?.affiliation, "SUBCONTRACTOR");
  assert.equal(externalWorker?.hourlyWage, null);

  const assigned = await listMyAssignedWorkPoints(
    fixture.subcontractorWorker.id,
    fixture.subcontractorCompany.id,
  );
  assert.equal(assigned[0].id, fixture.workPoint.id);
  assert.equal(assigned[0].affiliation, "SUBCONTRACTOR");
});

databaseTest("revocation removes subcontractor assignments and blocks future attendance", async (t) => {
  const fixture = await createFixture();
  t.after(async () => {
    await prisma.company.delete({ where: { id: fixture.ownerCompany.id } });
    await prisma.company.delete({
      where: { id: fixture.subcontractorCompany.id },
    });
  });

  const invitation = await createOrRenewSubcontractorInvitation({
    invitedAdminEmail: fixture.subcontractorAdmin.email,
    invitedById: fixture.ownerAdmin.id,
    ownerCompanyId: fixture.ownerCompany.id,
  });
  const accepted = await acceptSubcontractorInvitation({
    token: new URL(invitation.acceptUrl).searchParams.get("token") ?? "",
    acceptedById: fixture.subcontractorAdmin.id,
    companyId: fixture.subcontractorCompany.id,
    role: "ADMIN",
  });
  await manualMark({
    workerId: fixture.subcontractorWorker.id,
    workPointId: fixture.workPoint.id,
    companyId: fixture.ownerCompany.id,
    date: new Date("2000-01-04T00:00:00.000Z"),
    checkedInAt: new Date("2000-01-04T09:00:00.000Z"),
    checkedOutAt: new Date("2000-01-04T17:00:00.000Z"),
  });

  await revokeSubcontractorAccess({
    id: accepted.id,
    ownerCompanyId: fixture.ownerCompany.id,
  });

  assert.equal(
    await isWorkerConnected(fixture.workPoint.id, fixture.subcontractorWorker.id),
    false,
  );
  assert.equal(
    await hasWorkPointChatParticipant(
      fixture.workPoint.id,
      fixture.subcontractorWorker.id,
    ),
    false,
  );
  assert.equal(
    await prisma.attendance.count({
      where: {
        workPointId: fixture.workPoint.id,
        workerId: fixture.subcontractorWorker.id,
      },
    }),
    1,
  );

  await assert.rejects(
    () =>
      recordAttendance({
        userId: fixture.subcontractorWorker.id,
        companyId: fixture.subcontractorCompany.id,
        userRole: "WORKER",
        qrToken: fixture.workPoint.qrToken,
        workerLocation: WORKPOINT_LOCATION,
        source: "QR",
        now: new Date("2000-01-05T09:00:00.000Z"),
      }),
    (error: unknown) => (error as NodeJS.ErrnoException).code === "NOT_FOUND",
  );
});

databaseTest("only subcontractor admin can accept an invitation", async (t) => {
  const fixture = await createFixture();
  t.after(async () => {
    await prisma.company.delete({ where: { id: fixture.ownerCompany.id } });
    await prisma.company.delete({
      where: { id: fixture.subcontractorCompany.id },
    });
  });

  const invitation = await createOrRenewSubcontractorInvitation({
    invitedAdminEmail: fixture.subcontractorAdmin.email,
    invitedById: fixture.ownerAdmin.id,
    ownerCompanyId: fixture.ownerCompany.id,
  });

  await assert.rejects(
    () =>
      acceptSubcontractorInvitation({
        token: new URL(invitation.acceptUrl).searchParams.get("token") ?? "",
        acceptedById: fixture.subcontractorWorker.id,
        companyId: fixture.subcontractorCompany.id,
        role: "WORKER",
      }),
    (error: unknown) =>
      error instanceof Error &&
      error.message === "Only a subcontractor admin can accept this invitation",
  );
});

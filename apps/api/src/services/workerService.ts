import { prisma } from "../../database/prisma.js";
import { syncCompanySeatQuantity } from "./billingService.js";
import {
  affiliationForCompany,
  getAcceptedSubcontractorCompanyIds,
  type WorkerAffiliation,
} from "./subcontractorService.js";

type CompanySummary = {
  id: string;
  name: string;
};

export type WorkerSummary = {
  id: string;
  username: string;
  email: string;
  role: string;
  assignedWorkPointCount: number;
  hourlyWage: number | null;
  company: CompanySummary;
  affiliation: WorkerAffiliation;
};

export type WorkerStats = WorkerSummary;

type SelectedWorker = {
  id: string;
  username: string;
  email: string;
  role: string;
  companyId: string;
  company: CompanySummary;
  hourlyWage: number | null;
  _count: { assignedWorkPoints: number };
};

const workerSummarySelect = {
  id: true,
  username: true,
  email: true,
  role: true,
  companyId: true,
  company: { select: { id: true, name: true } },
  hourlyWage: true,
  _count: { select: { assignedWorkPoints: true } },
} as const;

function toWorkerSummary(worker: SelectedWorker, ownerCompanyId: string): WorkerSummary {
  const affiliation = affiliationForCompany({
    ownerCompanyId,
    workerCompanyId: worker.companyId,
  });

  return {
    id: worker.id,
    username: worker.username,
    email: worker.email,
    role: worker.role,
    company: worker.company,
    affiliation,
    hourlyWage: affiliation === "OWN_COMPANY" ? worker.hourlyWage : null,
    assignedWorkPointCount: worker._count.assignedWorkPoints,
  };
}

export async function listWorkers(companyId: string): Promise<WorkerSummary[]> {
  const workers = await prisma.user.findMany({
    where: { companyId, role: "WORKER" },
    select: workerSummarySelect,
    orderBy: { username: "asc" },
  });

  return workers.map((worker) => toWorkerSummary(worker, companyId));
}

export async function listWorkersForWorkPoint(
  workPointId: string,
  companyId: string,
): Promise<WorkerStats[]> {
  const workPoint = await prisma.workPoint.findFirst({
    where: { id: workPointId, companyId },
    select: {
      companyId: true,
      workers: {
        select: workerSummarySelect,
        orderBy: { username: "asc" },
      },
    },
  });

  if (!workPoint) return [];

  return workPoint.workers.map((worker) =>
    toWorkerSummary(worker, workPoint.companyId),
  );
}

export async function listAttendanceWorkersForWorkPoint(
  workPointId: string,
  companyId: string,
): Promise<WorkerSummary[]> {
  const workPoint = await prisma.workPoint.findFirst({
    where: { id: workPointId, companyId },
    select: { id: true, companyId: true },
  });

  if (!workPoint) return [];

  const subcontractorCompanyIds = await getAcceptedSubcontractorCompanyIds(
    companyId,
  );
  const companyIds = [companyId, ...subcontractorCompanyIds];

  const workers = await prisma.user.findMany({
    where: {
      role: "WORKER",
      companyId: { in: companyIds },
    },
    select: workerSummarySelect,
    orderBy: [{ company: { name: "asc" } }, { username: "asc" }],
  });

  return workers.map((worker) => toWorkerSummary(worker, workPoint.companyId));
}

export async function updateWorker(
  workerId: string,
  companyId: string,
  data: { username?: string; email?: string; role?: string; hourlyWage?: number | null },
): Promise<WorkerSummary> {
  if (data.role === "ADMIN") {
    throw new Error("A company can have only one admin");
  }

  const existingWorker = await prisma.user.findFirst({
    where: { id: workerId, companyId },
    select: { id: true, role: true },
  });
  if (!existingWorker) {
    throw new Error("User not found");
  }
  if (existingWorker.role === "ADMIN") {
    throw new Error("Admin cannot be edited here");
  }

  const worker = await prisma.user.update({
    where: { id: workerId },
    data,
    select: {
      ...workerSummarySelect,
    },
  });
  return toWorkerSummary(worker, companyId);
}

export async function deleteWorker(workerId: string, companyId: string): Promise<void> {
  const worker = await prisma.user.findFirst({
    where: { id: workerId, companyId },
    select: { id: true, role: true },
  });
  if (!worker) {
    throw new Error("User not found");
  }
  if (worker.role === "ADMIN") {
    throw new Error("Admin cannot be deleted here");
  }

  await prisma.user.delete({ where: { id: workerId } });
  void syncCompanySeatQuantity(companyId).catch((error) => {
    console.error("Failed to sync Stripe seat quantity after user deletion:", error);
  });
}

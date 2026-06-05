import { randomBytes } from "node:crypto";
import { prisma } from "../../database/prisma.js";
import {
  buildSubcontractorInvitationEmail,
  sendEmail,
} from "./emailService.js";

const SUBCONTRACTOR_INVITATION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export type WorkerAffiliation = "OWN_COMPANY" | "SUBCONTRACTOR";
export type SubcontractorAccessStatus =
  | "pending"
  | "accepted"
  | "revoked"
  | "expired";

type CompanySummary = {
  id: string;
  name: string;
};

type SubcontractorAccessRow = {
  id: string;
  status: string;
  token: string;
  invitedAdminEmail: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  ownerCompany: CompanySummary;
  subcontractorCompany: CompanySummary;
};

export type SubcontractorAccessDTO = {
  id: string;
  ownerCompany: CompanySummary;
  subcontractorCompany: CompanySummary;
  invitedAdminEmail: string;
  status: SubcontractorAccessStatus;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  acceptUrl: string;
};

export class SubcontractorAccessError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
    this.name = "SubcontractorAccessError";
  }
}

const subcontractorAccessSelect = {
  id: true,
  status: true,
  token: true,
  invitedAdminEmail: true,
  expiresAt: true,
  acceptedAt: true,
  revokedAt: true,
  createdAt: true,
  ownerCompany: { select: { id: true, name: true } },
  subcontractorCompany: { select: { id: true, name: true } },
} as const;

function getAppBaseUrl(): string {
  return process.env.APP_BASE_URL || "http://localhost:5173";
}

function buildAcceptUrl(token: string): string {
  const base = getAppBaseUrl().replace(/\/$/, "");
  const params = new URLSearchParams({ token });
  return `${base}/subcontractors/accept?${params.toString()}`;
}

function computeStatus(access: {
  status: string;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  expiresAt: Date;
}): SubcontractorAccessStatus {
  if (access.revokedAt || access.status === "REVOKED") return "revoked";
  if (access.acceptedAt || access.status === "ACCEPTED") return "accepted";
  if (access.expiresAt.getTime() < Date.now()) return "expired";
  return "pending";
}

function toDTO(access: SubcontractorAccessRow): SubcontractorAccessDTO {
  return {
    id: access.id,
    ownerCompany: access.ownerCompany,
    subcontractorCompany: access.subcontractorCompany,
    invitedAdminEmail: access.invitedAdminEmail,
    status: computeStatus(access),
    expiresAt: access.expiresAt.toISOString(),
    acceptedAt: access.acceptedAt?.toISOString() ?? null,
    revokedAt: access.revokedAt?.toISOString() ?? null,
    createdAt: access.createdAt.toISOString(),
    acceptUrl: buildAcceptUrl(access.token),
  };
}

export function affiliationForCompany(params: {
  ownerCompanyId: string;
  workerCompanyId: string;
}): WorkerAffiliation {
  return params.ownerCompanyId === params.workerCompanyId
    ? "OWN_COMPANY"
    : "SUBCONTRACTOR";
}

export async function hasAcceptedSubcontractorAccess(params: {
  ownerCompanyId: string;
  subcontractorCompanyId: string;
}): Promise<boolean> {
  if (params.ownerCompanyId === params.subcontractorCompanyId) return true;

  const access = await prisma.companySubcontractorAccess.findUnique({
    where: {
      ownerCompanyId_subcontractorCompanyId: {
        ownerCompanyId: params.ownerCompanyId,
        subcontractorCompanyId: params.subcontractorCompanyId,
      },
    },
    select: { id: true, status: true, acceptedAt: true, revokedAt: true },
  });

  return (
    access !== null &&
    access.status === "ACCEPTED" &&
    access.acceptedAt !== null &&
    access.revokedAt === null
  );
}

export async function getAcceptedSubcontractorCompanyIds(
  ownerCompanyId: string,
): Promise<string[]> {
  const rows = await prisma.companySubcontractorAccess.findMany({
    where: {
      ownerCompanyId,
      status: "ACCEPTED",
      acceptedAt: { not: null },
      revokedAt: null,
    },
    select: { subcontractorCompanyId: true },
  });

  return rows.map((row) => row.subcontractorCompanyId);
}

export async function listOutgoingSubcontractorAccess(
  ownerCompanyId: string,
): Promise<SubcontractorAccessDTO[]> {
  const rows = await prisma.companySubcontractorAccess.findMany({
    where: { ownerCompanyId },
    select: subcontractorAccessSelect,
    orderBy: { createdAt: "desc" },
  });

  return rows.map(toDTO);
}

export async function listIncomingSubcontractorAccess(
  subcontractorCompanyId: string,
): Promise<SubcontractorAccessDTO[]> {
  const rows = await prisma.companySubcontractorAccess.findMany({
    where: { subcontractorCompanyId },
    select: subcontractorAccessSelect,
    orderBy: { createdAt: "desc" },
  });

  return rows.map(toDTO);
}

export async function createOrRenewSubcontractorInvitation(params: {
  invitedAdminEmail: string;
  invitedById: string;
  ownerCompanyId: string;
}): Promise<SubcontractorAccessDTO> {
  const invitedAdminEmail = params.invitedAdminEmail.trim().toLowerCase();
  const [ownerCompany, invitedAdmin] = await Promise.all([
    prisma.company.findUnique({
      where: { id: params.ownerCompanyId },
      select: { id: true, name: true },
    }),
    prisma.user.findUnique({
      where: { email: invitedAdminEmail },
      select: {
        id: true,
        email: true,
        role: true,
        companyId: true,
        company: { select: { id: true, name: true } },
      },
    }),
  ]);

  if (!ownerCompany) {
    throw new SubcontractorAccessError("Company not found", 404);
  }
  if (!invitedAdmin || invitedAdmin.role !== "ADMIN") {
    throw new SubcontractorAccessError(
      "Registered subcontractor admin not found",
      404,
    );
  }
  if (invitedAdmin.companyId === params.ownerCompanyId) {
    throw new SubcontractorAccessError("Cannot invite your own company", 400);
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SUBCONTRACTOR_INVITATION_TTL_MS);
  const existing = await prisma.companySubcontractorAccess.findUnique({
    where: {
      ownerCompanyId_subcontractorCompanyId: {
        ownerCompanyId: params.ownerCompanyId,
        subcontractorCompanyId: invitedAdmin.companyId,
      },
    },
    select: subcontractorAccessSelect,
  });

  if (existing && computeStatus(existing) === "accepted") {
    throw new SubcontractorAccessError(
      "Subcontractor access is already accepted",
      409,
    );
  }

  const data = {
    status: "PENDING" as const,
    token,
    invitedAdminEmail,
    invitedById: params.invitedById,
    expiresAt,
    acceptedAt: null,
    acceptedById: null,
    revokedAt: null,
  };

  const access = existing
    ? await prisma.companySubcontractorAccess.update({
        where: { id: existing.id },
        data,
        select: subcontractorAccessSelect,
      })
    : await prisma.companySubcontractorAccess.create({
        data: {
          ...data,
          ownerCompanyId: params.ownerCompanyId,
          subcontractorCompanyId: invitedAdmin.companyId,
        },
        select: subcontractorAccessSelect,
      });

  await sendEmail(
    buildSubcontractorInvitationEmail({
      email: invitedAdmin.email,
      ownerCompanyName: ownerCompany.name,
      subcontractorCompanyName: invitedAdmin.company.name,
      acceptUrl: buildAcceptUrl(access.token),
    }),
  );

  return toDTO(access);
}

export async function acceptSubcontractorInvitation(params: {
  token: string;
  acceptedById: string;
  companyId: string;
  role: string;
}): Promise<SubcontractorAccessDTO> {
  if (params.role !== "ADMIN") {
    throw new SubcontractorAccessError(
      "Only a subcontractor admin can accept this invitation",
      403,
    );
  }

  const access = await prisma.companySubcontractorAccess.findUnique({
    where: { token: params.token },
    select: subcontractorAccessSelect,
  });

  if (!access || access.subcontractorCompany.id !== params.companyId) {
    throw new SubcontractorAccessError("Invitation not found", 404);
  }

  const status = computeStatus(access);
  if (status === "revoked") {
    throw new SubcontractorAccessError("Invitation has been revoked", 410);
  }
  if (status === "expired") {
    throw new SubcontractorAccessError("Invitation has expired", 410);
  }
  if (status === "accepted") {
    return toDTO(access);
  }

  const updated = await prisma.companySubcontractorAccess.update({
    where: { id: access.id },
    data: {
      status: "ACCEPTED",
      acceptedAt: new Date(),
      acceptedById: params.acceptedById,
      revokedAt: null,
    },
    select: subcontractorAccessSelect,
  });

  return toDTO(updated);
}

export async function revokeSubcontractorAccess(params: {
  id: string;
  ownerCompanyId: string;
}): Promise<SubcontractorAccessDTO> {
  const access = await prisma.companySubcontractorAccess.findFirst({
    where: { id: params.id, ownerCompanyId: params.ownerCompanyId },
    select: {
      ...subcontractorAccessSelect,
      subcontractorCompanyId: true,
      ownerCompanyId: true,
    },
  });

  if (!access) {
    throw new SubcontractorAccessError("Subcontractor access not found", 404);
  }

  const updated = await prisma.companySubcontractorAccess.update({
    where: { id: access.id },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
    },
    select: subcontractorAccessSelect,
  });

  await removeSubcontractorAssignments({
    ownerCompanyId: access.ownerCompanyId,
    subcontractorCompanyId: access.subcontractorCompanyId,
  });

  return toDTO(updated);
}

async function removeSubcontractorAssignments(params: {
  ownerCompanyId: string;
  subcontractorCompanyId: string;
}): Promise<void> {
  const workPoints = await prisma.workPoint.findMany({
    where: {
      companyId: params.ownerCompanyId,
      workers: { some: { companyId: params.subcontractorCompanyId } },
    },
    select: {
      id: true,
      workers: {
        where: { companyId: params.subcontractorCompanyId },
        select: { id: true },
      },
    },
  });

  const workerIds = Array.from(
    new Set(workPoints.flatMap((workPoint) => workPoint.workers.map((w) => w.id))),
  );
  if (workerIds.length === 0) return;

  await prisma.$transaction([
    prisma.chatParticipant.deleteMany({
      where: {
        userId: { in: workerIds },
        chat: { workPointId: { in: workPoints.map((workPoint) => workPoint.id) } },
      },
    }),
    ...workPoints.map((workPoint) =>
      prisma.workPoint.update({
        where: { id: workPoint.id },
        data: {
          workers: {
            disconnect: workPoint.workers.map((worker) => ({ id: worker.id })),
          },
        },
      }),
    ),
  ]);
}

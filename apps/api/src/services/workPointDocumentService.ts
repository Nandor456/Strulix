import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "../../database/prisma.js";
import {
  companyWorkPointAccessWhere,
  isAttendanceParticipantRole,
  workPointAssignmentWhere,
} from "./accessPolicy.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const WORKPOINT_DOCUMENT_UPLOAD_DIR = path.resolve(
  __dirname,
  "../../private/workpoint-documents",
);

export const WORKPOINT_DOCUMENT_MAX_FILE_SIZE = 10 * 1024 * 1024;

export const WORKPOINT_DOCUMENT_ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type UploadedBySummary = {
  id: string;
  username: string;
  email: string;
  role: string;
};

type WorkPointDocumentRecord = {
  id: string;
  workPointId: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
  uploadedBy: UploadedBySummary | null;
};

export type WorkPointDocumentSummary = {
  id: string;
  workPointId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
  uploadedBy: UploadedBySummary | null;
};

export type WorkPointDocumentFile = WorkPointDocumentSummary & {
  filePath: string;
};

export class WorkPointDocumentError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "WorkPointDocumentError";
    this.statusCode = statusCode;
  }
}

const documentSelect = {
  id: true,
  workPointId: true,
  originalName: true,
  storedName: true,
  mimeType: true,
  sizeBytes: true,
  createdAt: true,
  uploadedBy: {
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
    },
  },
} as const;

function toSummary(document: WorkPointDocumentRecord): WorkPointDocumentSummary {
  return {
    id: document.id,
    workPointId: document.workPointId,
    originalName: document.originalName,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    createdAt: document.createdAt,
    uploadedBy: document.uploadedBy,
  };
}

export function getWorkPointDocumentPath(storedName: string) {
  return path.join(WORKPOINT_DOCUMENT_UPLOAD_DIR, storedName);
}

async function removeStoredFile(storedName: string) {
  try {
    await fs.unlink(getWorkPointDocumentPath(storedName));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn("Failed to remove workpoint document file:", error);
    }
  }
}

async function ensureWorkPointTarget(params: {
  workPointId: string;
  userId: string;
  companyId: string;
  role: string;
}) {
  const workPoint = await prisma.workPoint.findFirst({
    where: {
      id: params.workPointId,
      ...companyWorkPointAccessWhere(params),
    },
    select: { id: true },
  });

  if (!workPoint) {
    throw new WorkPointDocumentError("Workpoint not found", 404);
  }
}

async function assertCanAccessWorkPointDocuments(params: {
  workPointId: string;
  userId: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true, companyId: true, role: true },
  });

  if (!user) {
    throw new WorkPointDocumentError("Unauthorized", 401);
  }

  const workPoint = await prisma.workPoint.findFirst({
    where:
      user.role === "ADMIN"
        ? { id: params.workPointId, companyId: user.companyId }
        : isAttendanceParticipantRole(user.role)
          ? { id: params.workPointId, ...workPointAssignmentWhere(user.id) }
          : { id: "__forbidden__" },
    select: { id: true },
  });

  if (workPoint) {
    return;
  }

  throw new WorkPointDocumentError("Forbidden", 403);
}

export async function listWorkPointDocuments(params: {
  workPointId: string;
  userId: string;
}): Promise<WorkPointDocumentSummary[]> {
  await assertCanAccessWorkPointDocuments(params);

  const documents = await prisma.workPointDocument.findMany({
    where: { workPointId: params.workPointId },
    select: documentSelect,
    orderBy: { createdAt: "desc" },
  });

  return documents.map(toSummary);
}

export async function createWorkPointDocument(params: {
  workPointId: string;
  uploadedById: string;
  companyId: string;
  userRole: string;
  file: Express.Multer.File;
}): Promise<WorkPointDocumentSummary> {
  try {
    await ensureWorkPointTarget({
      workPointId: params.workPointId,
      userId: params.uploadedById,
      companyId: params.companyId,
      role: params.userRole,
    });

    const document = await prisma.workPointDocument.create({
      data: {
        workPointId: params.workPointId,
        uploadedById: params.uploadedById,
        originalName: params.file.originalname,
        storedName: params.file.filename,
        mimeType: params.file.mimetype,
        sizeBytes: params.file.size,
      },
      select: documentSelect,
    });

    return toSummary(document);
  } catch (error) {
    await removeStoredFile(params.file.filename);
    throw error;
  }
}

export async function deleteWorkPointDocument(
  documentId: string,
  params: {
    userId: string;
    companyId: string;
    role: string;
  },
): Promise<void> {
  const document = await prisma.workPointDocument.findFirst({
    where: {
      id: documentId,
      workPoint: companyWorkPointAccessWhere(params),
    },
    select: {
      id: true,
      storedName: true,
    },
  });

  if (!document) {
    throw new WorkPointDocumentError("Document not found", 404);
  }

  await prisma.workPointDocument.delete({ where: { id: documentId } });
  await removeStoredFile(document.storedName);
}

export async function getWorkPointDocumentFile(params: {
  documentId: string;
  userId: string;
}): Promise<WorkPointDocumentFile> {
  const [document, user] = await Promise.all([
    prisma.workPointDocument.findUnique({
      where: { id: params.documentId },
      select: {
        ...documentSelect,
        workPoint: {
          select: { companyId: true },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true, companyId: true, role: true },
    }),
  ]);

  if (!document || !user) {
    throw new WorkPointDocumentError("Document not found", 404);
  }
  const canAccess =
    user.role === "ADMIN"
      ? document.workPoint.companyId === user.companyId
      : isAttendanceParticipantRole(user.role)
        ? (await prisma.workPoint.count({
          where: {
            id: document.workPointId,
            ...workPointAssignmentWhere(user.id),
          },
        })) > 0
        : false;

  if (!canAccess) {
    throw new WorkPointDocumentError("Forbidden", 403);
  }

  const filePath = getWorkPointDocumentPath(document.storedName);
  try {
    await fs.access(filePath);
  } catch {
    throw new WorkPointDocumentError("Document file not found", 404);
  }

  return {
    ...toSummary(document),
    filePath,
  };
}

export async function listWorkPointDocumentStoredNames(workPointId: string) {
  const documents = await prisma.workPointDocument.findMany({
    where: { workPointId },
    select: { storedName: true },
  });

  return documents.map((document) => document.storedName);
}

export async function removeWorkPointDocumentFiles(storedNames: string[]) {
  await Promise.all(storedNames.map(removeStoredFile));
}

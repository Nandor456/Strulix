import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "../../database/prisma.js";

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

type WorkPointDocumentWithAssignment = WorkPointDocumentRecord & {
  workPoint: {
    workers: Array<{ id: string }>;
  };
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

async function ensureWorkPointTarget(workPointId: string) {
  const workPoint = await prisma.workPoint.findUnique({
    where: { id: workPointId },
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
  const [user, workPoint] = await Promise.all([
    prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true, role: true },
    }),
    prisma.workPoint.findUnique({
      where: { id: params.workPointId },
      select: {
        id: true,
        workers: {
          where: { id: params.userId },
          select: { id: true },
        },
      },
    }),
  ]);

  if (!user) {
    throw new WorkPointDocumentError("Unauthorized", 401);
  }
  if (!workPoint) {
    throw new WorkPointDocumentError("Workpoint not found", 404);
  }
  if (user.role === "ADMIN" || user.role === "LEADER") {
    return;
  }
  if (user.role === "WORKER" && workPoint.workers.length > 0) {
    return;
  }

  throw new WorkPointDocumentError("Forbidden", 403);
}

function canAccessDocumentFile(params: {
  userRole: string;
  document: WorkPointDocumentWithAssignment;
}) {
  return (
    params.userRole === "ADMIN" ||
    params.userRole === "LEADER" ||
    (params.userRole === "WORKER" && params.document.workPoint.workers.length > 0)
  );
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
  file: Express.Multer.File;
}): Promise<WorkPointDocumentSummary> {
  try {
    await ensureWorkPointTarget(params.workPointId);

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

export async function deleteWorkPointDocument(documentId: string): Promise<void> {
  const document = await prisma.workPointDocument.findUnique({
    where: { id: documentId },
    select: { id: true, storedName: true },
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
          select: {
            workers: {
              where: { id: params.userId },
              select: { id: true },
            },
          },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true, role: true },
    }),
  ]);

  if (!document) {
    throw new WorkPointDocumentError("Document not found", 404);
  }
  if (!user) {
    throw new WorkPointDocumentError("Unauthorized", 401);
  }
  if (!canAccessDocumentFile({ userRole: user.role, document })) {
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

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "../../database/prisma.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const WORKER_DOCUMENT_UPLOAD_DIR = path.resolve(
  __dirname,
  "../../private/worker-documents",
);

export const WORKER_DOCUMENT_MAX_FILE_SIZE = 10 * 1024 * 1024;

export const WORKER_DOCUMENT_ALLOWED_MIME_TYPES = new Set([
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

type WorkerDocumentRecord = {
  id: string;
  workerId: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
  uploadedBy: UploadedBySummary | null;
};

export type WorkerDocumentSummary = {
  id: string;
  workerId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
  uploadedBy: UploadedBySummary | null;
};

export type WorkerDocumentFile = WorkerDocumentSummary & {
  filePath: string;
};

export class WorkerDocumentError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "WorkerDocumentError";
    this.statusCode = statusCode;
  }
}

const documentSelect = {
  id: true,
  workerId: true,
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

function toSummary(document: WorkerDocumentRecord): WorkerDocumentSummary {
  return {
    id: document.id,
    workerId: document.workerId,
    originalName: document.originalName,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    createdAt: document.createdAt,
    uploadedBy: document.uploadedBy,
  };
}

export function getWorkerDocumentPath(storedName: string) {
  return path.join(WORKER_DOCUMENT_UPLOAD_DIR, storedName);
}

async function removeStoredFile(storedName: string) {
  try {
    await fs.unlink(getWorkerDocumentPath(storedName));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn("Failed to remove worker document file:", error);
    }
  }
}

async function ensureWorkerTarget(workerId: string) {
  const worker = await prisma.user.findUnique({
    where: { id: workerId },
    select: { id: true, role: true },
  });

  if (!worker || worker.role !== "WORKER") {
    throw new WorkerDocumentError("Worker not found", 404);
  }
}

export async function listWorkerDocuments(
  workerId: string,
): Promise<WorkerDocumentSummary[]> {
  await ensureWorkerTarget(workerId);

  const documents = await prisma.workerDocument.findMany({
    where: { workerId },
    select: documentSelect,
    orderBy: { createdAt: "desc" },
  });

  return documents.map(toSummary);
}

export async function listMyWorkerDocuments(
  workerId: string,
): Promise<WorkerDocumentSummary[]> {
  const documents = await prisma.workerDocument.findMany({
    where: { workerId },
    select: documentSelect,
    orderBy: { createdAt: "desc" },
  });

  return documents.map(toSummary);
}

export async function createWorkerDocument(params: {
  workerId: string;
  uploadedById: string;
  file: Express.Multer.File;
}): Promise<WorkerDocumentSummary> {
  try {
    await ensureWorkerTarget(params.workerId);

    const document = await prisma.workerDocument.create({
      data: {
        workerId: params.workerId,
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

export async function deleteWorkerDocument(documentId: string): Promise<void> {
  const document = await prisma.workerDocument.findUnique({
    where: { id: documentId },
    select: { id: true, storedName: true },
  });

  if (!document) {
    throw new WorkerDocumentError("Document not found", 404);
  }

  await prisma.workerDocument.delete({ where: { id: documentId } });
  await removeStoredFile(document.storedName);
}

export async function getWorkerDocumentFile(params: {
  documentId: string;
  userId: string;
}): Promise<WorkerDocumentFile> {
  const [document, user] = await Promise.all([
    prisma.workerDocument.findUnique({
      where: { id: params.documentId },
      select: documentSelect,
    }),
    prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true, role: true },
    }),
  ]);

  if (!document) {
    throw new WorkerDocumentError("Document not found", 404);
  }
  if (!user) {
    throw new WorkerDocumentError("Unauthorized", 401);
  }

  const canAccess =
    user.role === "ADMIN" ||
    user.role === "LEADER" ||
    (user.role === "WORKER" && document.workerId === user.id);

  if (!canAccess) {
    throw new WorkerDocumentError("Forbidden", 403);
  }

  const filePath = getWorkerDocumentPath(document.storedName);
  try {
    await fs.access(filePath);
  } catch {
    throw new WorkerDocumentError("Document file not found", 404);
  }

  return {
    ...toSummary(document),
    filePath,
  };
}

import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../types/AuthRequest.js";
import {
  WorkerDocumentError,
  createWorkerDocument,
  deleteWorkerDocument,
  getWorkerDocumentFile,
  listMyWorkerDocuments,
  listWorkerDocuments,
} from "../services/workerDocumentService.js";

function statusForError(error: unknown, fallbackStatus = 500) {
  if (error instanceof WorkerDocumentError) return error.statusCode;
  return fallbackStatus;
}

function messageForError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function encodeDispositionFilename(filename: string) {
  const fallback = filename
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/["\\]/g, "_");
  const encoded = encodeURIComponent(filename)
    .replace(/['()]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/\*/g, "%2A");

  return `filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

export async function listWorkerDocumentsController(
  req: AuthenticatedRequest<{ workerId: string }>,
  res: Response,
) {
  const { workerId } = req.params;

  try {
    const documents = await listWorkerDocuments(workerId);
    res.json({ documents });
  } catch (error) {
    res
      .status(statusForError(error))
      .json({ error: messageForError(error, "Failed to list worker documents") });
  }
}

export async function uploadWorkerDocumentController(
  req: AuthenticatedRequest<{ workerId: string }>,
  res: Response,
) {
  const { workerId } = req.params;
  const file = req.file as Express.Multer.File | undefined;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const document = await createWorkerDocument({
      workerId,
      uploadedById: req.auth!.userId,
      file,
    });
    res.status(201).json({ document });
  } catch (error) {
    res
      .status(statusForError(error))
      .json({ error: messageForError(error, "Failed to upload worker document") });
  }
}

export async function deleteWorkerDocumentController(
  req: AuthenticatedRequest<{ documentId: string }>,
  res: Response,
) {
  const { documentId } = req.params;

  try {
    await deleteWorkerDocument(documentId);
    res.status(204).send();
  } catch (error) {
    res
      .status(statusForError(error))
      .json({ error: messageForError(error, "Failed to delete worker document") });
  }
}

export async function listMyWorkerDocumentsController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const documents = await listMyWorkerDocuments(req.auth!.userId);
    res.json({ documents });
  } catch (error) {
    res
      .status(statusForError(error))
      .json({ error: messageForError(error, "Failed to list your documents") });
  }
}

export async function streamWorkerDocumentFileController(
  req: AuthenticatedRequest<{ documentId: string }>,
  res: Response,
  next: NextFunction,
) {
  const { documentId } = req.params;
  const download = req.query.download === "1";

  try {
    const document = await getWorkerDocumentFile({
      documentId,
      userId: req.auth!.userId,
    });

    res.setHeader("Content-Type", document.mimeType);
    res.setHeader(
      "Content-Disposition",
      `${download ? "attachment" : "inline"}; ${encodeDispositionFilename(
        document.originalName,
      )}`,
    );
    res.sendFile(document.filePath, (error) => {
      if (error) next(error);
    });
  } catch (error) {
    res
      .status(statusForError(error))
      .json({ error: messageForError(error, "Failed to load worker document") });
  }
}

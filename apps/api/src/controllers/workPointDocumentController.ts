import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../types/AuthRequest.js";
import {
  WorkPointDocumentError,
  createWorkPointDocument,
  deleteWorkPointDocument,
  getWorkPointDocumentFile,
  listWorkPointDocuments,
} from "../services/workPointDocumentService.js";

function statusForError(error: unknown, fallbackStatus = 500) {
  if (error instanceof WorkPointDocumentError) return error.statusCode;
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

export async function listWorkPointDocumentsController(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
) {
  const { id } = req.params;

  try {
    const documents = await listWorkPointDocuments({
      workPointId: id,
      userId: req.auth!.userId,
    });
    res.json({ documents });
  } catch (error) {
    res
      .status(statusForError(error))
      .json({ error: messageForError(error, "Failed to list workpoint documents") });
  }
}

export async function uploadWorkPointDocumentController(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
) {
  const { id } = req.params;
  const file = req.file as Express.Multer.File | undefined;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const document = await createWorkPointDocument({
      workPointId: id,
      uploadedById: req.auth!.userId,
      companyId: req.auth!.companyId,
      userRole: req.auth!.role,
      file,
    });
    res.status(201).json({ document });
  } catch (error) {
    res
      .status(statusForError(error))
      .json({ error: messageForError(error, "Failed to upload workpoint document") });
  }
}

export async function deleteWorkPointDocumentController(
  req: AuthenticatedRequest<{ documentId: string }>,
  res: Response,
) {
  const { documentId } = req.params;

  try {
    await deleteWorkPointDocument(documentId, {
      userId: req.auth!.userId,
      companyId: req.auth!.companyId,
      role: req.auth!.role,
    });
    res.status(204).send();
  } catch (error) {
    res
      .status(statusForError(error))
      .json({ error: messageForError(error, "Failed to delete workpoint document") });
  }
}

export async function streamWorkPointDocumentFileController(
  req: AuthenticatedRequest<{ documentId: string }>,
  res: Response,
  next: NextFunction,
) {
  const { documentId } = req.params;
  const download = req.query.download === "1";

  try {
    const document = await getWorkPointDocumentFile({
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
      .json({ error: messageForError(error, "Failed to load workpoint document") });
  }
}

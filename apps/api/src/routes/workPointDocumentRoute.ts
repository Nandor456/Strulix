import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import multer from "multer";
import {
  ensureAuthenticated,
  ensureRole,
} from "../middlewares/authMiddleware.js";
import {
  deleteWorkPointDocumentController,
  listWorkPointDocumentsController,
  streamWorkPointDocumentFileController,
  uploadWorkPointDocumentController,
} from "../controllers/workPointDocumentController.js";
import {
  WORKPOINT_DOCUMENT_ALLOWED_MIME_TYPES,
  WORKPOINT_DOCUMENT_MAX_FILE_SIZE,
  WORKPOINT_DOCUMENT_UPLOAD_DIR,
} from "../services/workPointDocumentService.js";

const router = Router();

const adminLeaderAccess = [ensureRole("LEADER", "ADMIN")];

if (!fs.existsSync(WORKPOINT_DOCUMENT_UPLOAD_DIR)) {
  fs.mkdirSync(WORKPOINT_DOCUMENT_UPLOAD_DIR, { recursive: true });
}

function extensionForMimeType(mimeType: string) {
  switch (mimeType) {
    case "application/pdf":
      return ".pdf";
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    default:
      return "";
  }
}

const workPointDocumentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, WORKPOINT_DOCUMENT_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const extension = extensionForMimeType(file.mimetype);
    cb(null, `workpoint-document-${Date.now()}-${randomUUID()}${extension}`);
  },
});

const workPointDocumentUpload = multer({
  storage: workPointDocumentStorage,
  limits: { fileSize: WORKPOINT_DOCUMENT_MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!WORKPOINT_DOCUMENT_ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error("Only PDF and image files are supported"));
      return;
    }
    cb(null, true);
  },
});

function handleWorkPointDocumentUpload(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  workPointDocumentUpload.single("file")(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    const message =
      error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
        ? "File must be 10 MB or smaller"
        : error instanceof Error
          ? error.message
          : "Failed to upload file";

    res.status(400).json({ error: message });
  });
}

router.use(ensureAuthenticated);
router.get("/workpoints/:id/documents", listWorkPointDocumentsController);
router.post(
  "/workpoints/:id/documents",
  adminLeaderAccess,
  handleWorkPointDocumentUpload,
  uploadWorkPointDocumentController,
);
router.get(
  "/workpoint-documents/:documentId/file",
  streamWorkPointDocumentFileController,
);
router.delete(
  "/workpoint-documents/:documentId",
  adminLeaderAccess,
  deleteWorkPointDocumentController,
);

export default router;

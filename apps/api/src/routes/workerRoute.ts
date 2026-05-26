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
  assignWorkerController,
  deleteWorkerController,
  listWorkPointWorkersController,
  listWorkersController,
  removeWorkerController,
  updateWorkerController,
} from "../controllers/workerController.js";
import {
  deleteWorkerDocumentController,
  listMyWorkerDocumentsController,
  listWorkerDocumentsController,
  streamWorkerDocumentFileController,
  uploadWorkerDocumentController,
} from "../controllers/workerDocumentController.js";
import {
  WORKER_DOCUMENT_ALLOWED_MIME_TYPES,
  WORKER_DOCUMENT_MAX_FILE_SIZE,
  WORKER_DOCUMENT_UPLOAD_DIR,
} from "../services/workerDocumentService.js";

const router = Router();

const admin_leaderAccess = [ensureRole("LEADER", "ADMIN")];
const admin_leader_workerAccess = [ensureRole("ADMIN", "LEADER", "WORKER")];


if (!fs.existsSync(WORKER_DOCUMENT_UPLOAD_DIR)) {
  fs.mkdirSync(WORKER_DOCUMENT_UPLOAD_DIR, { recursive: true });
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

const workerDocumentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, WORKER_DOCUMENT_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const extension = extensionForMimeType(file.mimetype);
    cb(null, `worker-document-${Date.now()}-${randomUUID()}${extension}`);
  },
});

const workerDocumentUpload = multer({
  storage: workerDocumentStorage,
  limits: { fileSize: WORKER_DOCUMENT_MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!WORKER_DOCUMENT_ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error("Only PDF and image files are supported"));
      return;
    }
    cb(null, true);
  },
});

function handleWorkerDocumentUpload(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  workerDocumentUpload.single("file")(req, res, (error: unknown) => {
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
router.get("/workers", admin_leaderAccess, listWorkersController);
router.get("/workers/:workerId/documents", admin_leaderAccess, listWorkerDocumentsController);
router.post(
  "/workers/:workerId/documents",
  admin_leaderAccess,
  handleWorkerDocumentUpload,
  uploadWorkerDocumentController,
);
router.get("/workpoints/:id/workers", admin_leaderAccess, listWorkPointWorkersController);
router.post("/workpoints/:id/workers", admin_leaderAccess, assignWorkerController);
router.delete("/workpoints/:id/workers/:workerId", admin_leaderAccess, removeWorkerController);
router.put("/workers/:workerId", admin_leaderAccess, updateWorkerController);
router.delete("/workers/:workerId", admin_leaderAccess, deleteWorkerController);
router.get("/worker-documents/me", admin_leader_workerAccess, listMyWorkerDocumentsController);
router.get(
  "/worker-documents/:documentId/file",
  ensureAuthenticated,
  streamWorkerDocumentFileController,
);
router.delete(
  "/worker-documents/:documentId",
  admin_leaderAccess,
  deleteWorkerDocumentController,
);

export default router;

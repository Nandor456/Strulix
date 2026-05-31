import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import {
  ensureAuthenticated,
  ensureActiveBillingForWrites,
} from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
  listChatsController,
  getMessagesController,
  createDirectChatController,
  sendMessageController,
  markReadController,
  uploadAttachmentController,
  listUsersController,
} from "../controllers/messagingController.js";
import {
  createDirectChatSchema,
  getMessagesSchema,
  sendMessageSchema,
  markReadSchema,
} from "../schemas/messagingSchemas.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "../../uploads/messaging");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `attachment-${suffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const router = Router();

router.use(ensureAuthenticated);

router.get("/chats", listChatsController);
router.post(
  "/chats/direct",
  ensureActiveBillingForWrites,
  validate(createDirectChatSchema),
  createDirectChatController,
);
router.get(
  "/chats/:chatId/messages",
  validate(getMessagesSchema),
  getMessagesController,
);
router.post(
  "/chats/:chatId/messages",
  ensureActiveBillingForWrites,
  validate(sendMessageSchema),
  sendMessageController,
);
router.post(
  "/chats/:chatId/read",
  ensureActiveBillingForWrites,
  validate(markReadSchema),
  markReadController,
);
router.post(
  "/chats/:chatId/attachment",
  ensureActiveBillingForWrites,
  upload.single("file"),
  uploadAttachmentController,
);
router.get("/users", listUsersController);

export default router;

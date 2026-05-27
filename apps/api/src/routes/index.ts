import { Router } from "express";
import healthRouter from "./healthRoute.js";
import authRouter from "./authRoute.js";
import invitationRouter from "./invitationRoute.js";
import attendanceRouter from "./attendanceRoute.js";
import leaveRequestRouter from "./leaveRequestRoute.js";
import messagingRouter from "./messagingRoute.js";
import pushRouter from "./pushRoute.js";
import workPointDocumentRouter from "./workPointDocumentRoute.js";
import workPointRouter from "./workPointRoute.js";
import workerRouter from "./workerRoute.js";

const router = Router();

// Grouped routers
router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/invitations", invitationRouter);
router.use("/attendance", attendanceRouter);
router.use("/leave-requests", leaveRequestRouter);
router.use("/messaging", messagingRouter);
router.use("/push", pushRouter);
router.use("/", workPointDocumentRouter);
router.use("/workpoints", workPointRouter);
router.use("/", workerRouter);

export default router;

import { Router } from "express";
import {
  ensureAuthenticated,
  ensureRole,
} from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
  approveLeaveRequestController,
  cancelLeaveRequestController,
  createLeaveRequestController,
  listAllLeaveRequestsController,
  listMyLeaveRequestsController,
  rejectLeaveRequestController,
} from "../controllers/leaveRequestController.js";
import {
  createLeaveRequestSchema,
  leaveRequestIdSchema,
} from "../schemas/leaveRequestSchemas.js";

const router = Router();

router.use(ensureAuthenticated);

router.get("/", ensureRole("ADMIN", "LEADER"), listAllLeaveRequestsController);
router.get("/my", listMyLeaveRequestsController);
router.post(
  "/",
  ensureRole("WORKER", "LEADER"),
  validate(createLeaveRequestSchema),
  createLeaveRequestController,
);
router.patch(
  "/:id/approve",
  ensureRole("ADMIN", "LEADER"),
  validate(leaveRequestIdSchema),
  approveLeaveRequestController,
);
router.patch(
  "/:id/reject",
  ensureRole("ADMIN", "LEADER"),
  validate(leaveRequestIdSchema),
  rejectLeaveRequestController,
);
router.delete(
  "/:id",
  validate(leaveRequestIdSchema),
  cancelLeaveRequestController,
);

export default router;

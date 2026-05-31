import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import {
  ensureAuthenticated,
  ensureActiveBillingForWrites,
  ensureRole,
} from "../middlewares/authMiddleware.js";
import {
  createInvitationSchema,
  revokeInvitationSchema,
} from "../schemas/invitationSchemas.js";
import {
  createInvitationController,
  listInvitationsController,
  revokeInvitationController,
} from "../controllers/invitationController.js";

const router = Router();

router.use(ensureAuthenticated, ensureRole("ADMIN", "LEADER"));

router.get("/", listInvitationsController);
router.post(
  "/",
  ensureActiveBillingForWrites,
  validate(createInvitationSchema),
  createInvitationController,
);
router.delete(
  "/:id",
  ensureActiveBillingForWrites,
  validate(revokeInvitationSchema),
  revokeInvitationController,
);

export default router;

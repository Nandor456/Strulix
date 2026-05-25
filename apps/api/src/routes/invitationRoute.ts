import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import {
  ensureAuthenticated,
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
router.post("/", validate(createInvitationSchema), createInvitationController);
router.delete(
  "/:id",
  validate(revokeInvitationSchema),
  revokeInvitationController,
);

export default router;

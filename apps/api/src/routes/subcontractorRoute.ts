import { Router } from "express";
import {
  ensureAuthenticated,
  ensureActiveBillingForWrites,
  ensureRole,
} from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
  acceptSubcontractorInvitationController,
  createSubcontractorInvitationController,
  listIncomingSubcontractorsController,
  listOutgoingSubcontractorsController,
  revokeSubcontractorAccessController,
} from "../controllers/subcontractorController.js";
import {
  acceptSubcontractorInvitationSchema,
  createSubcontractorInvitationSchema,
  revokeSubcontractorAccessSchema,
} from "../schemas/subcontractorSchemas.js";

const router = Router();

router.use(ensureAuthenticated);

router.get("/", ensureRole("ADMIN", "LEADER"), listOutgoingSubcontractorsController);
router.post(
  "/",
  ensureRole("ADMIN", "LEADER"),
  ensureActiveBillingForWrites,
  validate(createSubcontractorInvitationSchema),
  createSubcontractorInvitationController,
);
router.get(
  "/incoming",
  ensureRole("ADMIN"),
  listIncomingSubcontractorsController,
);
router.post(
  "/accept",
  ensureRole("ADMIN"),
  ensureActiveBillingForWrites,
  validate(acceptSubcontractorInvitationSchema),
  acceptSubcontractorInvitationController,
);
router.delete(
  "/:id",
  ensureRole("ADMIN", "LEADER"),
  ensureActiveBillingForWrites,
  validate(revokeSubcontractorAccessSchema),
  revokeSubcontractorAccessController,
);

export default router;

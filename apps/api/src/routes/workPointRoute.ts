import { Router } from "express";
import {
  ensureAuthenticated,
  ensureActiveBillingForWrites,
  ensureRole,
} from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
  createWorkPointController,
  deleteWorkPointController,
  getWorkPointController,
  listMyAssignedWorkPointsController,
  listWorkPointsController,
  updateWorkPointController,
} from "../controllers/workPointController.js";
import {
  createWorkPointSchema,
  updateWorkPointSchema,
  workPointIdSchema,
} from "../schemas/workPointSchemas.js";

const router = Router();

router.get("/me", ensureAuthenticated, listMyAssignedWorkPointsController);

router.use(ensureAuthenticated, ensureRole("ADMIN", "LEADER"));

router.get("/", listWorkPointsController);
router.post(
  "/",
  ensureActiveBillingForWrites,
  validate(createWorkPointSchema),
  createWorkPointController,
);
router.get("/:id", validate(workPointIdSchema), getWorkPointController);
router.put(
  "/:id",
  ensureActiveBillingForWrites,
  validate(updateWorkPointSchema),
  updateWorkPointController,
);
router.delete(
  "/:id",
  ensureActiveBillingForWrites,
  validate(workPointIdSchema),
  deleteWorkPointController,
);

export default router;

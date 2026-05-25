import { Router } from "express";
import { ensureAuthenticated } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
  registerPushDeviceController,
  unregisterPushDeviceController,
} from "../controllers/pushController.js";
import {
  registerPushDeviceSchema,
  unregisterPushDeviceSchema,
} from "../schemas/pushSchemas.js";

const router = Router();

router.use(ensureAuthenticated);

router.post("/devices", validate(registerPushDeviceSchema), registerPushDeviceController);
router.delete(
  "/devices",
  validate(unregisterPushDeviceSchema),
  unregisterPushDeviceController,
);

export default router;

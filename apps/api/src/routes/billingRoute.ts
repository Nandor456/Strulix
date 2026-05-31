import { Router } from "express";
import {
  billingPortalController,
  billingStatusController,
  completeCompanySignupController,
  createCompanySignupCheckoutController,
} from "../controllers/billingController.js";
import {
  ensureAuthenticated,
  ensureRole,
} from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
  companySignupCheckoutSchema,
  companySignupCompleteSchema,
} from "../schemas/billingSchemas.js";

const router = Router();

router.post(
  "/company-signup/checkout",
  validate(companySignupCheckoutSchema),
  createCompanySignupCheckoutController,
);
router.post(
  "/company-signup/complete",
  validate(companySignupCompleteSchema),
  completeCompanySignupController,
);
router.get("/status", ensureAuthenticated, billingStatusController);
router.post(
  "/portal",
  ensureAuthenticated,
  ensureRole("ADMIN"),
  billingPortalController,
);

export default router;

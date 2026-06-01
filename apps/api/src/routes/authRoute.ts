import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../schemas/authSchemas.js";
import { ensureAuthenticated } from "../middlewares/authMiddleware.js";
import {
  registerController,
  forgotPasswordController,
  loginController,
  logoutController,
  meController,
  refreshController,
  resetPasswordController,
} from "../controllers/authController.js";

const router = Router();

router.post("/register", validate(registerSchema), registerController);
router.post("/login", validate(loginSchema), loginController);
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  forgotPasswordController,
);
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  resetPasswordController,
);
router.post("/refresh", refreshController);
router.post("/logout", logoutController);
router.get("/user", ensureAuthenticated, meController);

export default router;

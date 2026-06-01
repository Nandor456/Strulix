import { Router } from "express";
import {
  ensureAuthenticated,
  ensureActiveBillingForWrites,
  ensureRole,
} from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
  checkinController,
  listAttendanceController,
  manualMarkController,
  deleteAttendanceController,
  updateAttendanceTimesController,
  updateCheckoutController,
  getQrController,
  rotateQrController,
  exportAttendanceController,
  getMyDailyStatsController,
  getMyMonthlySummaryController,
  liveFollowController,
} from "../controllers/attendanceController.js";
import {
  checkinSchema,
  listAttendanceSchema,
  liveFollowSchema,
  manualMarkSchema,
  deleteAttendanceSchema,
  updateAttendanceTimesSchema,
  updateCheckoutSchema,
  qrSchema,
  exportSchema,
  myStatsSchema,
} from "../schemas/attendanceSchemas.js";

const router = Router();

// Any authenticated user can check in/out via QR
router.post(
  "/checkin",
  ensureAuthenticated,
  ensureActiveBillingForWrites,
  validate(checkinSchema),
  checkinController,
);

// Any authenticated user can read their own stats
router.get("/me/daily", ensureAuthenticated, validate(myStatsSchema), getMyDailyStatsController);
router.get("/me/monthly", ensureAuthenticated, validate(myStatsSchema), getMyMonthlySummaryController);

// Workpoint operators
const workPointAccess = [ensureAuthenticated, ensureRole("ADMIN", "LEADER")];
const adminAccess = [ensureAuthenticated, ensureRole("ADMIN")];

router.get("/live-follow", workPointAccess, validate(liveFollowSchema), liveFollowController);
router.get("/workpoint/:id", workPointAccess, validate(listAttendanceSchema), listAttendanceController);
router.post("/workpoint/:id/manual", workPointAccess, ensureActiveBillingForWrites, validate(manualMarkSchema), manualMarkController);
router.patch("/:id/checkout", adminAccess, ensureActiveBillingForWrites, validate(updateCheckoutSchema), updateCheckoutController);
router.patch("/:id/times", adminAccess, ensureActiveBillingForWrites, validate(updateAttendanceTimesSchema), updateAttendanceTimesController);
router.delete("/:id", workPointAccess, ensureActiveBillingForWrites, validate(deleteAttendanceSchema), deleteAttendanceController);
router.get("/workpoint/:id/qr", workPointAccess, validate(qrSchema), getQrController);
router.post("/workpoint/:id/qr/rotate", workPointAccess, ensureActiveBillingForWrites, validate(qrSchema), rotateQrController);
router.get("/workpoint/:id/export", workPointAccess, validate(exportSchema), exportAttendanceController);

export default router;

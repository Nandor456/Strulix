import { Response } from "express";
import ExcelJS from "exceljs";
import { AuthenticatedRequest } from "../types/AuthRequest.js";
import {
  recordAttendance,
  listAttendance,
  manualMark,
  removeAttendance,
  setCheckoutTime,
  updateAttendanceTimes,
  getQrForWorkPoint,
  rotateQrToken,
  getAttendanceSummary,
  getAttendanceObserverUserIds,
  getLiveFollowSnapshot,
  getMyDailyStats,
  getMyMonthlySummary,
  computeBillableHours,
} from "../services/attendanceService.js";
import { getWorkPointChatId } from "../services/messagingService.js";
import { emitAttendanceChanged, emitChatChanged } from "../realtime/socketServer.js";

function notifyAttendanceChanged(params: {
  workPointId: string;
  workerId?: string;
  attendanceId?: string;
}) {
  void (async () => {
    try {
      const userIds = await getAttendanceObserverUserIds(
        params.workPointId,
        params.workerId,
      );
      emitAttendanceChanged(
        {
          workPointId: params.workPointId,
          workerId: params.workerId,
          attendanceId: params.attendanceId,
          changedAt: new Date().toISOString(),
        },
        userIds,
      );
    } catch (error) {
      console.error("notifyAttendanceChanged error:", error);
    }
  })();
}

function notifyWorkPointChatChanged(workPointId: string, extraUserIds: string[] = []) {
  void (async () => {
    try {
      const chatId = await getWorkPointChatId(workPointId);
      if (chatId) await emitChatChanged(chatId, extraUserIds);
    } catch (error) {
      console.error("notifyWorkPointChatChanged error:", error);
    }
  })();
}

function getFrontendBaseUrl(req: AuthenticatedRequest): string {
  return (
    process.env.FRONTEND_BASE_URL ??
    `${req.protocol}://${req.hostname}${req.hostname === "localhost" ? ":5173" : ""}`
  );
}

function parseDate(value: unknown): Date | undefined {
  if (typeof value !== "string" || !value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

export async function checkinController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = req.auth!.userId;
  const { qrToken, lat, lng } = req.body as {
    qrToken: string;
    lat: number;
    lng: number;
  };

  try {
    const result = await recordAttendance({
      userId,
      companyId: req.auth!.companyId,
      userRole: req.auth!.role,
      qrToken,
      workerLocation: { lat, lng },
      source: "QR",
    });
    if (result.result.event !== "ALREADY_COMPLETED") {
      notifyAttendanceChanged({
        workPointId: result.result.workPointId,
        workerId: userId,
      });
    }
    if (result.workerAssociated) {
      notifyWorkPointChatChanged(result.result.workPointId, [userId]);
    }
    res.json(result.result);
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err) {
      const code = (err as { code: string }).code;
      if (code === "NOT_FOUND") {
        res.status(404).json({ error: "Invalid QR code" });
        return;
      }
      if (code === "FORBIDDEN") {
        res.status(403).json({
          error: err instanceof Error ? err.message : "Forbidden",
        });
        return;
      }
      if (code === "MISSING_COORDINATES") {
        res.status(409).json({
          error: err instanceof Error ? err.message : "Workpoint coordinates are missing",
        });
        return;
      }
    }
    console.error("checkinController error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function listAttendanceController(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
): Promise<void> {
  const workPointId = req.params.id;
  const from = parseDate(req.query.from);
  const to = parseDate(req.query.to);

  try {
    const records = await listAttendance({
      workPointId,
      userId: req.auth!.userId,
      companyId: req.auth!.companyId,
      role: req.auth!.role,
      from,
      to,
    });
    res.json(records);
  } catch (err) {
    console.error("listAttendanceController error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function liveFollowController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const limit = Number(req.query.limit ?? 5);

  try {
    const snapshot = await getLiveFollowSnapshot({
      userId: req.auth!.userId,
      companyId: req.auth!.companyId,
      role: req.auth!.role,
      limit,
    });
    res.json(snapshot);
  } catch (err) {
    console.error("liveFollowController error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function manualMarkController(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
): Promise<void> {
  const workPointId = req.params.id;
  const {
    workerId,
    date: dateStr,
    checkedInAt: checkedInAtStr,
    checkedOutAt: checkedOutAtStr,
  } = req.body as {
    workerId: string;
    date: string;
    checkedInAt?: string;
    checkedOutAt?: string;
  };

  const date = new Date(`${dateStr}T00:00:00.000Z`);
  const checkedInAt = checkedInAtStr ? new Date(checkedInAtStr) : undefined;
  const checkedOutAt = checkedOutAtStr ? new Date(checkedOutAtStr) : undefined;

  try {
    const result = await manualMark({
      workerId,
      workPointId,
      userId: req.auth!.userId,
      companyId: req.auth!.companyId,
      role: req.auth!.role,
      date,
      checkedInAt,
      checkedOutAt,
    });
    const { record } = result;
    notifyAttendanceChanged({
      workPointId: record.workPointId,
      workerId: record.workerId,
      attendanceId: record.id,
    });
    if (result.workerAssociated) {
      notifyWorkPointChatChanged(record.workPointId, [record.workerId]);
    }
    res.status(201).json(record);
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "DUPLICATE"
    ) {
      res.status(409).json({ error: "Attendance already exists for this day" });
      return;
    }
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "INVALID"
    ) {
      res.status(400).json({ error: err instanceof Error ? err.message : "Invalid" });
      return;
    }
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "NOT_FOUND"
    ) {
      res.status(404).json({ error: err instanceof Error ? err.message : "Not found" });
      return;
    }
    console.error("manualMarkController error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateCheckoutController(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  const { checkedOutAt: checkedOutAtStr } = req.body as { checkedOutAt: string };

  try {
    const record = await setCheckoutTime(
      id,
      req.auth!.companyId,
      new Date(checkedOutAtStr),
    );
    notifyAttendanceChanged({
      workPointId: record.workPointId,
      workerId: record.workerId,
      attendanceId: record.id,
    });
    res.json(record);
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err) {
      const code = (err as { code: string }).code;
      if (code === "NOT_FOUND") {
        res.status(404).json({ error: "Attendance record not found" });
        return;
      }
      if (code === "INVALID") {
        res.status(400).json({ error: err instanceof Error ? err.message : "Invalid" });
        return;
      }
    }
    console.error("updateCheckoutController error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateAttendanceTimesController(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  const {
    checkedInAt: checkedInAtStr,
    checkedOutAt: checkedOutAtStr,
  } = req.body as {
    checkedInAt: string;
    checkedOutAt: string | null;
  };

  try {
    const record = await updateAttendanceTimes({
      attendanceId: id,
      companyId: req.auth!.companyId,
      checkedInAt: new Date(checkedInAtStr),
      checkedOutAt: checkedOutAtStr ? new Date(checkedOutAtStr) : null,
    });
    notifyAttendanceChanged({
      workPointId: record.workPointId,
      workerId: record.workerId,
      attendanceId: record.id,
    });
    res.json(record);
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err) {
      const code = (err as { code: string }).code;
      if (code === "NOT_FOUND") {
        res.status(404).json({ error: "Attendance record not found" });
        return;
      }
      if (code === "INVALID") {
        res.status(400).json({ error: err instanceof Error ? err.message : "Invalid" });
        return;
      }
      if (code === "DUPLICATE") {
        res.status(409).json({ error: "Attendance already exists for this day" });
        return;
      }
    }
    console.error("updateAttendanceTimesController error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteAttendanceController(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  try {
    const record = await removeAttendance(id, {
      userId: req.auth!.userId,
      companyId: req.auth!.companyId,
      role: req.auth!.role,
    });
    notifyAttendanceChanged({
      workPointId: record.workPointId,
      workerId: record.workerId,
      attendanceId: record.id,
    });
    res.json({ message: "Deleted" });
  } catch (err) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "NOT_FOUND"
    ) {
      res.status(404).json({ error: "Attendance record not found" });
      return;
    }
    console.error("deleteAttendanceController error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getQrController(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
): Promise<void> {
  const workPointId = req.params.id;
  try {
    const result = await getQrForWorkPoint({
      workPointId,
      userId: req.auth!.userId,
      companyId: req.auth!.companyId,
      role: req.auth!.role,
      frontendBaseUrl: getFrontendBaseUrl(req),
    });
    res.json(result);
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "NOT_FOUND"
    ) {
      res.status(404).json({ error: "Workpoint not found" });
      return;
    }
    console.error("getQrController error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function rotateQrController(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
): Promise<void> {
  const workPointId = req.params.id;
  try {
    const { qrToken } = await rotateQrToken(workPointId, {
      userId: req.auth!.userId,
      companyId: req.auth!.companyId,
      role: req.auth!.role,
    });
    const frontendBaseUrl = getFrontendBaseUrl(req);
    const result = await getQrForWorkPoint({
      workPointId,
      userId: req.auth!.userId,
      companyId: req.auth!.companyId,
      role: req.auth!.role,
      frontendBaseUrl,
    });
    res.json({ qrToken, qrPng: result.qrPng });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "NOT_FOUND"
    ) {
      res.status(404).json({ error: "Workpoint not found" });
      return;
    }
    console.error("rotateQrController error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getMyDailyStatsController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = req.auth!.userId;
  const { year, month } = req.query as unknown as { year: number; month: number };

  try {
    const rows = await getMyDailyStats(userId, year, month);
    res.json(rows);
  } catch (err) {
    console.error("getMyDailyStatsController error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getMyMonthlySummaryController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = req.auth!.userId;
  const { year, month } = req.query as unknown as { year: number; month: number };

  try {
    const summary = await getMyMonthlySummary(userId, year, month);
    res.json(summary);
  } catch (err) {
    console.error("getMyMonthlySummaryController error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function exportAttendanceController(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
): Promise<void> {
  const workPointId = req.params.id;
  const from = parseDate(req.query.from);
  const to = parseDate(req.query.to);

  try {
    const [records, summary] = await Promise.all([
      listAttendance({
        workPointId,
        userId: req.auth!.userId,
        companyId: req.auth!.companyId,
        role: req.auth!.role,
        from,
        to,
      }),
      getAttendanceSummary(workPointId, {
        userId: req.auth!.userId,
        companyId: req.auth!.companyId,
        role: req.auth!.role,
      }),
    ]);

    const workbook = new ExcelJS.Workbook();

    // Sheet 1: raw attendance events
    const sheet1 = workbook.addWorksheet("Attendance");
    sheet1.columns = [
      { header: "Date", key: "date", width: 14 },
      { header: "Worker", key: "worker", width: 28 },
      { header: "Email", key: "email", width: 32 },
      { header: "Worker company", key: "workerCompany", width: 28 },
      { header: "Worker type", key: "workerType", width: 18 },
      { header: "Source", key: "source", width: 10 },
      { header: "Checkout source", key: "checkoutSource", width: 16 },
      { header: "Checked-in at", key: "checkedInAt", width: 22 },
      { header: "Checked-out at", key: "checkedOutAt", width: 22 },
      { header: "Hours", key: "hours", width: 10 },
    ];

    const header1 = sheet1.getRow(1);
    header1.font = { bold: true };
    header1.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9E1F2" },
    };
    header1.alignment = { vertical: "middle" };
    header1.height = 20;

    const formatDate = (d: Date) =>
      new Date(d).toLocaleDateString("ro-RO", { timeZone: "UTC" });
    const formatDateTime = (d: Date) => new Date(d).toLocaleString("ro-RO");

    for (const r of records) {
      const hours =
        r.checkedOutAt != null
          ? computeBillableHours(r.checkedInAt, r.checkedOutAt)
          : null;
      sheet1.addRow({
        date: formatDate(r.date),
        worker: r.worker.username,
        email: r.worker.email,
        workerCompany: r.worker.company.name,
        workerType:
          r.worker.affiliation === "SUBCONTRACTOR"
            ? "Subcontractor"
            : "Own company",
        source: r.source,
        checkoutSource: r.checkoutSource ?? "—",
        checkedInAt: formatDateTime(r.checkedInAt),
        checkedOutAt: r.checkedOutAt ? formatDateTime(r.checkedOutAt) : "—",
        hours: hours ?? "incomplete",
      });
    }

    sheet1.eachRow((row, rowNumber) => {
      if (rowNumber > 1 && rowNumber % 2 === 0) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF5F5F5" },
        };
      }
    });

    // Sheet 2: per-worker summary
    const sheet2 = workbook.addWorksheet("Summary");
    sheet2.columns = [
      { header: "Worker", key: "worker", width: 28 },
      { header: "Email", key: "email", width: 32 },
      { header: "Worker company", key: "workerCompany", width: 28 },
      { header: "Worker type", key: "workerType", width: 18 },
      { header: "Total Presence Days", key: "totalDays", width: 22 },
      { header: "Complete Days", key: "completeDays", width: 16 },
      { header: "Total Hours", key: "totalHours", width: 14 },
      { header: "Total Earnings (RON)", key: "totalEarnings", width: 22 },
      { header: "First Date", key: "firstDate", width: 14 },
      { header: "Last Date", key: "lastDate", width: 14 },
    ];

    const header2 = sheet2.getRow(1);
    header2.font = { bold: true };
    header2.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9E1F2" },
    };
    header2.alignment = { vertical: "middle" };
    header2.height = 20;

    for (const s of summary) {
      sheet2.addRow({
        worker: s.username,
        email: s.email,
        workerCompany: s.company.name,
        workerType:
          s.affiliation === "SUBCONTRACTOR" ? "Subcontractor" : "Own company",
        totalDays: s.totalDays,
        completeDays: s.completeDays,
        totalHours: s.totalHours,
        totalEarnings: s.totalEarnings != null ? s.totalEarnings.toFixed(2) : "—",
        firstDate: s.firstDate ? formatDate(s.firstDate) : "—",
        lastDate: s.lastDate ? formatDate(s.lastDate) : "—",
      });
    }

    sheet2.eachRow((row, rowNumber) => {
      if (rowNumber > 1 && rowNumber % 2 === 0) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF5F5F5" },
        };
      }
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="attendance-${workPointId}.xlsx"`,
    );

    const buffer = await workbook.xlsx.writeBuffer();
    res.send(buffer);
  } catch (err) {
    console.error("exportAttendanceController error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

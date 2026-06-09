import { api } from "./axios";

export type CheckoutSource = "QR" | "MANUAL" | "AUTO";
export type WorkerAffiliation = "OWN_COMPANY" | "SUBCONTRACTOR";

export interface CompanySummary {
  id: string;
  name: string;
}

export interface AttendanceWorkerSummary {
  id: string;
  username: string;
  email: string;
  role: string;
  company: CompanySummary;
  affiliation: WorkerAffiliation;
}

export interface AttendanceRecord {
  id: string;
  workerId: string;
  workPointId: string;
  date: string;
  checkedInAt: string;
  checkedOutAt: string | null;
  checkoutSource: CheckoutSource | null;
  source: "QR" | "MANUAL";
  worker: AttendanceWorkerSummary;
}

export interface QrData {
  qrToken: string;
  qrPng: string;
}

export type ScanResult =
  | {
      event: "CHECK_IN";
      attendanceId: string;
      workPointId: string;
      workPointName: string;
      date: string;
      checkedInAt: string;
      monitoringStatus: string;
      monitoringPlatform: string | null;
      monitoringStartedAt: string | null;
      nextCheckpointDueAt: string | null;
    }
  | {
      event: "CHECK_OUT" | "ALREADY_COMPLETED";
      attendanceId: string;
      workPointId: string;
      workPointName: string;
      date: string;
      checkedInAt: string;
      checkedOutAt: string;
      checkoutSource: CheckoutSource | null;
      hours: number;
      earnings: number | null;
    };

export interface DailyStatRow {
  id: string;
  date: string;
  workPoint: { id: string; name: string };
  checkedInAt: string;
  checkedOutAt: string | null;
  checkoutSource: CheckoutSource | null;
  hours: number;
  earnings: number;
  complete: boolean;
}

export interface MonthlySummary {
  totalDays: number;
  completeDays: number;
  totalHours: number;
  totalEarnings: number;
  hourlyWage: number | null;
}

export type LiveFollowStatus = "ACTIVE" | "INACTIVE" | "WARNING";
export type LiveFollowWarningReason =
  | "STALE_OPEN_CHECKIN"
  | "AUTO_CHECKOUT"
  | "LOCATION_ALERT";
export type LiveFollowEventType = "CHECK_IN" | "CHECK_OUT";

export interface LiveFollowActiveCheckIn {
  attendanceId: string;
  workerId: string;
  workerUsername: string;
  workerEmail: string;
  workerCompany: CompanySummary;
  workerAffiliation: WorkerAffiliation;
  checkedInAt: string;
  source: "QR" | "MANUAL" | string;
}

export interface LiveFollowRecentEvent {
  attendanceId: string;
  workerId: string;
  workerUsername: string;
  workerEmail: string;
  workerCompany: CompanySummary;
  workerAffiliation: WorkerAffiliation;
  event: LiveFollowEventType;
  occurredAt: string;
  source: "QR" | "MANUAL" | string;
  checkoutSource: CheckoutSource | null;
}

export interface LiveFollowWorkPoint {
  id: string;
  name: string;
  address: string;
  assignedWorkerCount: number;
  ownWorkerCount: number;
  subcontractorWorkerCount: number;
  activeWorkerCount: number;
  status: LiveFollowStatus;
  warningReasons: LiveFollowWarningReason[];
  openLocationAlertCount: number;
  latestActivityAt: string | null;
  activeCheckIns: LiveFollowActiveCheckIn[];
  recentEvents: LiveFollowRecentEvent[];
}

export interface LiveFollowSnapshot {
  generatedAt: string;
  totals: {
    workpoints: number;
    activeWorkers: number;
    activeWorkpoints: number;
    warnings: number;
  };
  workPoints: LiveFollowWorkPoint[];
}

export interface ScanLocation {
  lat: number;
  lng: number;
}

export interface OpenAttendanceMonitoring {
  attendanceId: string;
  workPointId: string;
  workPointName: string;
  checkedInAt: string;
  monitoringStatus: string;
  monitoringPlatform: string | null;
  monitoringStartedAt: string | null;
  nextCheckpointDueAt: string;
  intervalMinutes: number;
  graceMinutes: number;
  radiusMeters: number;
}

export type AttendanceLocationAlertType =
  | "OUT_OF_RADIUS"
  | "MISSED_CHECK"
  | "MONITORING_UNAVAILABLE";
export type AttendanceLocationAlertStatus = "OPEN" | "REVIEWED";
export type AttendanceLocationReviewOutcome = "VALID" | "INVALID";

export interface AttendanceLocationAlert {
  id: string;
  attendanceId: string;
  checkId: string | null;
  workPointId: string;
  workerId: string;
  type: AttendanceLocationAlertType | string;
  status: AttendanceLocationAlertStatus | string;
  dueAt: string | null;
  capturedAt: string | null;
  distanceMeters: number | null;
  lat: number | null;
  lng: number | null;
  reviewOutcome: AttendanceLocationReviewOutcome | string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  worker: AttendanceWorkerSummary;
  workPoint: { id: string; name: string; address: string };
  attendance: {
    checkedInAt: string;
    checkedOutAt: string | null;
    source: "QR" | "MANUAL" | string;
  };
  reviewer: { id: string; username: string; email: string } | null;
}

export const attendanceAPI = {
  async checkin(qrToken: string, location: ScanLocation): Promise<ScanResult> {
    const res = await api.post<ScanResult>("/attendance/checkin", {
      qrToken,
      lat: location.lat,
      lng: location.lng,
      monitoringPlatform: "web",
    });
    return res.data;
  },

  async getMyOpenAttendances(): Promise<OpenAttendanceMonitoring[]> {
    const res = await api.get<{ attendances: OpenAttendanceMonitoring[] }>(
      "/attendance/me/open",
    );
    return res.data.attendances;
  },

  async recordLocationCheck(input: {
    attendanceId: string;
    dueAt: string;
    capturedAt: string;
    lat: number;
    lng: number;
  }): Promise<{
    check: {
      id: string;
      attendanceId: string;
      dueAt: string;
      capturedAt: string | null;
      receivedAt: string | null;
      status: string;
      distanceMeters: number | null;
    };
    alert: AttendanceLocationAlert | null;
  }> {
    const res = await api.post("/attendance/location-checks", input);
    return res.data;
  },

  async listLocationAlerts(params?: {
    workPointId?: string;
    status?: AttendanceLocationAlertStatus | "ALL";
  }): Promise<AttendanceLocationAlert[]> {
    const res = await api.get<{ alerts: AttendanceLocationAlert[] }>(
      "/attendance/location-alerts",
      { params },
    );
    return res.data.alerts;
  },

  async reviewLocationAlert(input: {
    alertId: string;
    outcome: AttendanceLocationReviewOutcome;
    note?: string | null;
  }): Promise<AttendanceLocationAlert> {
    const res = await api.patch<{ alert: AttendanceLocationAlert }>(
      `/attendance/location-alerts/${input.alertId}/review`,
      {
        outcome: input.outcome,
        note: input.note ?? null,
      },
    );
    return res.data.alert;
  },

  async list(
    workPointId: string,
    params?: { from?: string; to?: string },
  ): Promise<AttendanceRecord[]> {
    const res = await api.get<AttendanceRecord[]>(
      `/attendance/workpoint/${workPointId}`,
      { params },
    );
    return res.data;
  },

  async getLiveFollow(limit = 5): Promise<LiveFollowSnapshot> {
    const res = await api.get<LiveFollowSnapshot>("/attendance/live-follow", {
      params: { limit },
    });
    return res.data;
  },

  async manualMark(
    workPointId: string,
    workerId: string,
    date: string,
    checkedInAt?: string,
    checkedOutAt?: string,
  ): Promise<AttendanceRecord> {
    const res = await api.post<AttendanceRecord>(
      `/attendance/workpoint/${workPointId}/manual`,
      {
        workerId,
        date,
        ...(checkedInAt ? { checkedInAt } : {}),
        ...(checkedOutAt ? { checkedOutAt } : {}),
      },
    );
    return res.data;
  },

  async updateCheckout(id: string, checkedOutAt: string): Promise<AttendanceRecord> {
    const res = await api.patch<AttendanceRecord>(`/attendance/${id}/checkout`, {
      checkedOutAt,
    });
    return res.data;
  },

  async updateTimes(
    id: string,
    input: { checkedInAt: string; checkedOutAt: string | null },
  ): Promise<AttendanceRecord> {
    const res = await api.patch<AttendanceRecord>(`/attendance/${id}/times`, input);
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/attendance/${id}`);
  },

  async getQr(workPointId: string): Promise<QrData> {
    const res = await api.get<QrData>(`/attendance/workpoint/${workPointId}/qr`);
    return res.data;
  },

  async rotateQr(workPointId: string): Promise<QrData> {
    const res = await api.post<QrData>(
      `/attendance/workpoint/${workPointId}/qr/rotate`,
    );
    return res.data;
  },

  async exportXlsx(
    workPointId: string,
    params?: { from?: string; to?: string },
  ): Promise<Blob> {
    const res = await api.get(`/attendance/workpoint/${workPointId}/export`, {
      params,
      responseType: "blob",
    });
    return res.data as Blob;
  },

  async getMyDailyStats(year: number, month: number): Promise<DailyStatRow[]> {
    const res = await api.get<DailyStatRow[]>("/attendance/me/daily", {
      params: { year, month },
    });
    return res.data;
  },

  async getMyMonthlySummary(year: number, month: number): Promise<MonthlySummary> {
    const res = await api.get<MonthlySummary>("/attendance/me/monthly", {
      params: { year, month },
    });
    return res.data;
  },
};

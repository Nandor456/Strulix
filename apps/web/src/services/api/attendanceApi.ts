import { api } from "./axios";

export type CheckoutSource = "QR" | "MANUAL" | "AUTO";

export interface AttendanceRecord {
  id: string;
  workerId: string;
  workPointId: string;
  date: string;
  checkedInAt: string;
  checkedOutAt: string | null;
  checkoutSource: CheckoutSource | null;
  source: "QR" | "MANUAL";
  worker: { id: string; username: string; email: string };
}

export interface QrData {
  qrToken: string;
  qrPng: string;
}

export type ScanResult =
  | {
      event: "CHECK_IN";
      workPointId: string;
      workPointName: string;
      date: string;
      checkedInAt: string;
    }
  | {
      event: "CHECK_OUT" | "ALREADY_COMPLETED";
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

export interface ScanLocation {
  lat: number;
  lng: number;
}

export const attendanceAPI = {
  async checkin(qrToken: string, location: ScanLocation): Promise<ScanResult> {
    const res = await api.post<ScanResult>("/attendance/checkin", {
      qrToken,
      lat: location.lat,
      lng: location.lng,
    });
    return res.data;
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

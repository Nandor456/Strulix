import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { attendanceAPI } from "../services/api/attendanceApi";
import { QUERY_KEYS } from "../services/queryClient";

export const useWorkPointAttendance = (
  workPointId: string,
  params?: { from?: string; to?: string },
) =>
  useQuery({
    queryKey: QUERY_KEYS.attendance.forWorkPoint(workPointId, params),
    queryFn: () => attendanceAPI.list(workPointId, params),
    enabled: Boolean(workPointId),
  });

export const useLiveFollow = (limit = 5) =>
  useQuery({
    queryKey: QUERY_KEYS.attendance.liveFollow,
    queryFn: () => attendanceAPI.getLiveFollow(limit),
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

export const useAttendanceLocationAlerts = (params?: {
  workPointId?: string;
  status?: "OPEN" | "REVIEWED" | "ALL";
}) =>
  useQuery({
    queryKey: QUERY_KEYS.attendance.locationAlerts(params),
    queryFn: () => attendanceAPI.listLocationAlerts(params),
    enabled: params?.workPointId !== "",
  });

export const useReviewAttendanceLocationAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      alertId: string;
      outcome: "VALID" | "INVALID";
      note?: string | null;
    }) => attendanceAPI.reviewLocationAlert(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.attendance.locationAlertsBase,
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendance.liveFollow });
    },
  });
};

export const useWorkPointQr = (workPointId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.attendance.qr(workPointId),
    queryFn: () => attendanceAPI.getQr(workPointId),
    enabled: Boolean(workPointId),
    staleTime: Infinity,
  });

export const useCheckin = () =>
  useMutation({
    mutationFn: ({
      lat,
      lng,
      qrToken,
    }: {
      qrToken: string;
      lat: number;
      lng: number;
    }) => attendanceAPI.checkin(qrToken, { lat, lng }),
  });

export const useManualMark = (workPointId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workerId,
      date,
      checkedInAt,
      checkedOutAt,
    }: {
      workerId: string;
      date: string;
      checkedInAt?: string;
      checkedOutAt?: string;
    }) => attendanceAPI.manualMark(workPointId, workerId, date, checkedInAt, checkedOutAt),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.attendance.byWorkPoint(workPointId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.workers.forWorkPoint(workPointId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.workers.forAttendance(workPointId),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workers.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workPoints.all });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.workPoints.detail(workPointId),
      });
    },
  });
};

export const useUpdateCheckout = (workPointId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, checkedOutAt }: { id: string; checkedOutAt: string }) =>
      attendanceAPI.updateCheckout(id, checkedOutAt),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.attendance.byWorkPoint(workPointId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.attendance.locationAlertsBase,
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendance.liveFollow });
    },
  });
};

export const useUpdateAttendanceTimes = (workPointId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      checkedInAt,
      checkedOutAt,
    }: {
      id: string;
      checkedInAt: string;
      checkedOutAt: string | null;
    }) => attendanceAPI.updateTimes(id, { checkedInAt, checkedOutAt }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.attendance.byWorkPoint(workPointId),
      });
    },
  });
};

export const useDeleteAttendance = (workPointId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => attendanceAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.attendance.byWorkPoint(workPointId),
      });
    },
  });
};

export const useRotateQrToken = (workPointId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => attendanceAPI.rotateQr(workPointId),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.attendance.qr(workPointId), data);
    },
  });
};

export const useMyDailyStats = (year: number, month: number) =>
  useQuery({
    queryKey: QUERY_KEYS.attendance.myDaily(year, month),
    queryFn: () => attendanceAPI.getMyDailyStats(year, month),
  });

export const useMyMonthlySummary = (year: number, month: number) =>
  useQuery({
    queryKey: QUERY_KEYS.attendance.myMonthly(year, month),
    queryFn: () => attendanceAPI.getMyMonthlySummary(year, month),
  });

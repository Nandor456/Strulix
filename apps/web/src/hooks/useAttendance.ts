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

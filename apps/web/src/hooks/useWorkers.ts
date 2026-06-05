import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workerAPI } from "../services/api/workerApi";
import { QUERY_KEYS } from "../services/queryClient";

export const useWorkers = () =>
  useQuery({
    queryKey: QUERY_KEYS.workers.all,
    queryFn: () => workerAPI.listWorkers(),
  });

export const useWorkPointWorkers = (workPointId: string | null) =>
  useQuery({
    queryKey: workPointId
      ? QUERY_KEYS.workers.forWorkPoint(workPointId)
      : ["workers", "workpoint", "__disabled__"],
    queryFn: () => workerAPI.listWorkPointWorkers(workPointId!),
    enabled: Boolean(workPointId),
  });

export const useAttendanceWorkers = (workPointId: string | null) =>
  useQuery({
    queryKey: workPointId
      ? QUERY_KEYS.workers.forAttendance(workPointId)
      : ["workers", "attendance", "__disabled__"],
    queryFn: () => workerAPI.listAttendanceWorkers(workPointId!),
    enabled: Boolean(workPointId),
  });

export const useUpdateWorker = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workerId,
      data,
    }: {
      workerId: string;
      data: { username?: string; email?: string; role?: string; hourlyWage?: number | null };
    }) => workerAPI.updateWorker(workerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workers.all });
    },
  });
};

export const useDeleteWorker = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workerId: string) => workerAPI.deleteWorker(workerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workers.all });
    },
  });
};

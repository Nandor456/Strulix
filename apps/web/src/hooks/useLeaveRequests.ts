import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  leaveRequestAPI,
  type CreateLeaveRequestInput,
  type LeaveRequest,
} from "@/services/api/leaveRequestApi";
import { QUERY_KEYS } from "@/services/queryClient";
import { useAuth } from "@/hooks/useAuth";

export function sortLeaveRequests(requests: LeaveRequest[]) {
  return [...requests].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function upsertLeaveRequest(
  requests: LeaveRequest[] | undefined,
  leaveRequest: LeaveRequest,
) {
  const current = requests ?? [];
  const exists = current.some((request) => request.id === leaveRequest.id);
  const next = exists
    ? current.map((request) =>
        request.id === leaveRequest.id ? leaveRequest : request,
      )
    : [leaveRequest, ...current];

  return sortLeaveRequests(next);
}

export function removeLeaveRequest(
  requests: LeaveRequest[] | undefined,
  leaveRequestId: string,
) {
  return (requests ?? []).filter((request) => request.id !== leaveRequestId);
}

function useLeaveRequestCache() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return {
    upsert(leaveRequest: LeaveRequest) {
      queryClient.setQueryData<LeaveRequest[]>(
        QUERY_KEYS.leaveRequests.mine,
        (old) => {
          if (!old) return old;
          const belongsToCurrentUser = leaveRequest.userId === user?.id;
          const alreadyExists = old.some(
            (request) => request.id === leaveRequest.id,
          );
          return belongsToCurrentUser || alreadyExists
            ? upsertLeaveRequest(old, leaveRequest)
            : old;
        },
      );
      queryClient.setQueryData<LeaveRequest[]>(
        QUERY_KEYS.leaveRequests.all,
        (old) => (old ? upsertLeaveRequest(old, leaveRequest) : old),
      );
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.leaveRequests.all,
      });
    },
    remove(leaveRequestId: string) {
      queryClient.setQueryData<LeaveRequest[]>(
        QUERY_KEYS.leaveRequests.mine,
        (old) => removeLeaveRequest(old, leaveRequestId),
      );
      queryClient.setQueryData<LeaveRequest[]>(
        QUERY_KEYS.leaveRequests.all,
        (old) => (old ? removeLeaveRequest(old, leaveRequestId) : old),
      );
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.leaveRequests.all,
      });
    },
  };
}

export const useAllLeaveRequests = (enabled: boolean) =>
  useQuery({
    queryKey: QUERY_KEYS.leaveRequests.all,
    queryFn: () => leaveRequestAPI.listAll(),
    enabled,
  });

export const useMyLeaveRequests = () =>
  useQuery({
    queryKey: QUERY_KEYS.leaveRequests.mine,
    queryFn: () => leaveRequestAPI.listMine(),
  });

export const useCreateLeaveRequest = () => {
  const leaveRequestCache = useLeaveRequestCache();
  return useMutation({
    mutationFn: (input: CreateLeaveRequestInput) =>
      leaveRequestAPI.create(input),
    onSuccess: leaveRequestCache.upsert,
  });
};

export const useApproveLeaveRequest = () => {
  const leaveRequestCache = useLeaveRequestCache();
  return useMutation({
    mutationFn: (id: string) => leaveRequestAPI.approve(id),
    onSuccess: leaveRequestCache.upsert,
  });
};

export const useRejectLeaveRequest = () => {
  const leaveRequestCache = useLeaveRequestCache();
  return useMutation({
    mutationFn: (id: string) => leaveRequestAPI.reject(id),
    onSuccess: leaveRequestCache.upsert,
  });
};

export const useCancelLeaveRequest = () => {
  const leaveRequestCache = useLeaveRequestCache();
  return useMutation({
    mutationFn: (id: string) => leaveRequestAPI.cancel(id),
    onSuccess: (leaveRequest) => leaveRequestCache.remove(leaveRequest.id),
  });
};

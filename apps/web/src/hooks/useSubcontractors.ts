import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subcontractorAPI } from "../services/api/subcontractorApi";
import { QUERY_KEYS } from "../services/queryClient";

export const useOutgoingSubcontractors = () =>
  useQuery({
    queryKey: QUERY_KEYS.subcontractors.outgoing,
    queryFn: () => subcontractorAPI.listOutgoing(),
  });

export const useIncomingSubcontractors = () =>
  useQuery({
    queryKey: QUERY_KEYS.subcontractors.incoming,
    queryFn: () => subcontractorAPI.listIncoming(),
  });

export const useCreateSubcontractorInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { invitedAdminEmail: string }) =>
      subcontractorAPI.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subcontractors.outgoing,
      });
    },
  });
};

export const useAcceptSubcontractorInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => subcontractorAPI.accept(token),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subcontractors.incoming,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subcontractors.outgoing,
      });
    },
  });
};

export const useRevokeSubcontractorAccess = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subcontractorAPI.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subcontractors.outgoing,
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workPoints.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workers.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendance.all });
    },
  });
};

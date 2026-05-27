import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workPointDocumentApi } from "@/services/api/workPointDocumentApi";
import { QUERY_KEYS } from "@/services/queryClient";

export const useWorkPointDocuments = (workPointId: string | null) =>
  useQuery({
    queryKey: workPointId
      ? QUERY_KEYS.workPointDocuments.forWorkPoint(workPointId)
      : ["workpoint-documents", "workpoint", "__disabled__"],
    queryFn: () => workPointDocumentApi.listForWorkPoint(workPointId!),
    enabled: Boolean(workPointId),
  });

export const useUploadWorkPointDocument = (workPointId: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) =>
      workPointDocumentApi.uploadForWorkPoint(workPointId!, file),
    onSuccess: () => {
      if (!workPointId) return;
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.workPointDocuments.forWorkPoint(workPointId),
      });
    },
  });
};

export const useDeleteWorkPointDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => workPointDocumentApi.delete(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.workPointDocuments.all,
      });
    },
  });
};

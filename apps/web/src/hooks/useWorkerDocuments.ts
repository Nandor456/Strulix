import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workerDocumentApi } from "@/services/api/workerDocumentApi";
import { QUERY_KEYS } from "@/services/queryClient";

export const useWorkerDocuments = (workerId: string | null) =>
  useQuery({
    queryKey: workerId
      ? QUERY_KEYS.workerDocuments.forWorker(workerId)
      : ["worker-documents", "worker", "__disabled__"],
    queryFn: () => workerDocumentApi.listForWorker(workerId!),
    enabled: Boolean(workerId),
  });

export const useMyWorkerDocuments = () =>
  useQuery({
    queryKey: QUERY_KEYS.workerDocuments.mine,
    queryFn: () => workerDocumentApi.listMine(),
  });

export const useUploadWorkerDocument = (workerId: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => workerDocumentApi.uploadForWorker(workerId!, file),
    onSuccess: () => {
      if (!workerId) return;
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.workerDocuments.forWorker(workerId),
      });
    },
  });
};

export const useDeleteWorkerDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => workerDocumentApi.delete(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.workerDocuments.all,
      });
    },
  });
};

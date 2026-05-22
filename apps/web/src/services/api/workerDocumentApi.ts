import { api } from "./axios";
import { API_BASE_URL } from "./config";

export interface WorkerDocumentUploader {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface WorkerDocumentSummary {
  id: string;
  workerId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  uploadedBy: WorkerDocumentUploader | null;
}

export function getWorkerDocumentFileUrl(documentId: string, download = false) {
  const query = download ? "?download=1" : "";
  return `${API_BASE_URL}/worker-documents/${encodeURIComponent(documentId)}/file${query}`;
}

export const workerDocumentApi = {
  async listForWorker(workerId: string): Promise<WorkerDocumentSummary[]> {
    const res = await api.get<{ documents: WorkerDocumentSummary[] }>(
      `/workers/${workerId}/documents`,
    );
    return res.data.documents;
  },

  async uploadForWorker(
    workerId: string,
    file: File,
  ): Promise<WorkerDocumentSummary> {
    const form = new FormData();
    form.append("file", file);

    const res = await api.post<{ document: WorkerDocumentSummary }>(
      `/workers/${workerId}/documents`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data.document;
  },

  async delete(documentId: string): Promise<void> {
    await api.delete(`/worker-documents/${documentId}`);
  },

  async listMine(): Promise<WorkerDocumentSummary[]> {
    const res = await api.get<{ documents: WorkerDocumentSummary[] }>(
      "/worker-documents/me",
    );
    return res.data.documents;
  },
};

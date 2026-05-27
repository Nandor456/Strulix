import { api } from "./axios";
import { API_BASE_URL } from "./config";

export interface WorkPointDocumentUploader {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface WorkPointDocumentSummary {
  id: string;
  workPointId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  uploadedBy: WorkPointDocumentUploader | null;
}

export function getWorkPointDocumentFileUrl(documentId: string, download = false) {
  const query = download ? "?download=1" : "";
  return `${API_BASE_URL}/workpoint-documents/${encodeURIComponent(documentId)}/file${query}`;
}

export const workPointDocumentApi = {
  async listForWorkPoint(workPointId: string): Promise<WorkPointDocumentSummary[]> {
    const res = await api.get<{ documents: WorkPointDocumentSummary[] }>(
      `/workpoints/${workPointId}/documents`,
    );
    return res.data.documents;
  },

  async uploadForWorkPoint(
    workPointId: string,
    file: File,
  ): Promise<WorkPointDocumentSummary> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<{ document: WorkPointDocumentSummary }>(
      `/workpoints/${workPointId}/documents`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data.document;
  },

  async delete(documentId: string): Promise<void> {
    await api.delete(`/workpoint-documents/${documentId}`);
  },
};

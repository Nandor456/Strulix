import { api } from "./axios";

export interface PublicUserSummary {
  id: string;
  username: string;
  email: string;
  role: string;
}

export type WorkerAffiliation = "OWN_COMPANY" | "SUBCONTRACTOR";

export interface CompanySummary {
  id: string;
  name: string;
}

export interface WorkPointWorker extends PublicUserSummary {
  hourlyWage: number | null;
  company: CompanySummary;
  affiliation: WorkerAffiliation;
}

export interface WorkPointSummary {
  id: string;
  company: CompanySummary;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  description: string | null;
  userId: string | null;
  uploadedAt: string;
  deadline: string | null;
  owner: PublicUserSummary | null;
  workerCount: number;
  ownWorkerCount: number;
  subcontractorWorkerCount: number;
  attendanceCount: number;
}

export type AssignedWorkPointSummary = Omit<
  WorkPointSummary,
  "workerCount" | "ownWorkerCount" | "subcontractorWorkerCount" | "attendanceCount"
> & {
  affiliation: WorkerAffiliation;
};

export interface WorkPointDetail extends WorkPointSummary {
  workers: WorkPointWorker[];
}

export interface WorkPointInput {
  name: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  description?: string | null;
  deadline?: string | null;
}

export type WorkPointUpdate = Partial<WorkPointInput>;

export const workPointAPI = {
  async list(): Promise<WorkPointSummary[]> {
    const res = await api.get<{ workPoints: WorkPointSummary[] }>("/workpoints");
    return res.data.workPoints;
  },

  async listAssignedToMe(): Promise<AssignedWorkPointSummary[]> {
    const res = await api.get<{ workPoints: AssignedWorkPointSummary[] }>(
      "/workpoints/me",
    );
    return res.data.workPoints;
  },

  async get(id: string): Promise<WorkPointDetail> {
    const res = await api.get<{ workPoint: WorkPointDetail }>(`/workpoints/${id}`);
    return res.data.workPoint;
  },

  async create(data: WorkPointInput): Promise<WorkPointDetail> {
    const res = await api.post<{ workPoint: WorkPointDetail }>("/workpoints", data);
    return res.data.workPoint;
  },

  async update(id: string, data: WorkPointUpdate): Promise<WorkPointDetail> {
    const res = await api.put<{ workPoint: WorkPointDetail }>(`/workpoints/${id}`, data);
    return res.data.workPoint;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/workpoints/${id}`);
  },
};

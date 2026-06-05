import { api } from "./axios";

export type WorkerAffiliation = "OWN_COMPANY" | "SUBCONTRACTOR";

export interface CompanySummary {
  id: string;
  name: string;
}

export interface WorkerSummary {
  id: string;
  username: string;
  email: string;
  role: string;
  assignedWorkPointCount: number;
  hourlyWage: number | null;
  company: CompanySummary;
  affiliation: WorkerAffiliation;
}

export type WorkerStats = WorkerSummary;

export const workerAPI = {
  async listWorkers(): Promise<WorkerSummary[]> {
    const res = await api.get<{ workers: WorkerSummary[] }>("/workers");
    return res.data.workers;
  },

  async listWorkPointWorkers(workPointId: string): Promise<WorkerStats[]> {
    const res = await api.get<{ workers: WorkerStats[] }>(
      `/workpoints/${workPointId}/workers`,
    );
    return res.data.workers;
  },

  async listAttendanceWorkers(workPointId: string): Promise<WorkerStats[]> {
    const res = await api.get<{ workers: WorkerStats[] }>(
      `/workpoints/${workPointId}/attendance-workers`,
    );
    return res.data.workers;
  },

  async updateWorker(
    workerId: string,
    data: { username?: string; email?: string; role?: string; hourlyWage?: number | null },
  ): Promise<WorkerSummary> {
    const res = await api.put<{ worker: WorkerSummary }>(
      `/workers/${workerId}`,
      data,
    );
    return res.data.worker;
  },

  async deleteWorker(workerId: string): Promise<void> {
    await api.delete(`/workers/${workerId}`);
  },
};

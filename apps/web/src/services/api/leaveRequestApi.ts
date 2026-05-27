import { api } from "./axios";

export type LeaveRequestType = "VACATION" | "SICK";
export type LeaveRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: LeaveRequestType;
  startDate: string;
  endDate: string;
  days: number;
  status: LeaveRequestStatus;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewedByName: string | null;
}

export interface CreateLeaveRequestInput {
  type: LeaveRequestType;
  startDate: string;
  endDate: string;
}

export const leaveRequestAPI = {
  async listAll(): Promise<LeaveRequest[]> {
    const res = await api.get<{ leaveRequests: LeaveRequest[] }>(
      "/leave-requests",
    );
    return res.data.leaveRequests;
  },

  async listMine(): Promise<LeaveRequest[]> {
    const res = await api.get<{ leaveRequests: LeaveRequest[] }>(
      "/leave-requests/my",
    );
    return res.data.leaveRequests;
  },

  async create(input: CreateLeaveRequestInput): Promise<LeaveRequest> {
    const res = await api.post<{ leaveRequest: LeaveRequest }>(
      "/leave-requests",
      input,
    );
    return res.data.leaveRequest;
  },

  async approve(id: string): Promise<LeaveRequest> {
    const res = await api.patch<{ leaveRequest: LeaveRequest }>(
      `/leave-requests/${id}/approve`,
    );
    return res.data.leaveRequest;
  },

  async reject(id: string): Promise<LeaveRequest> {
    const res = await api.patch<{ leaveRequest: LeaveRequest }>(
      `/leave-requests/${id}/reject`,
    );
    return res.data.leaveRequest;
  },

  async cancel(id: string): Promise<LeaveRequest> {
    const res = await api.delete<{ leaveRequest: LeaveRequest }>(
      `/leave-requests/${id}`,
    );
    return res.data.leaveRequest;
  },
};

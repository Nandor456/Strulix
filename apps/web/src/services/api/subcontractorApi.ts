import { api } from "./axios";

export type SubcontractorAccessStatus =
  | "pending"
  | "accepted"
  | "revoked"
  | "expired";

export interface CompanySummary {
  id: string;
  name: string;
}

export interface SubcontractorAccess {
  id: string;
  ownerCompany: CompanySummary;
  subcontractorCompany: CompanySummary;
  invitedAdminEmail: string;
  status: SubcontractorAccessStatus;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  acceptUrl: string;
}

export const subcontractorAPI = {
  async listOutgoing(): Promise<SubcontractorAccess[]> {
    const res = await api.get<{ subcontractors: SubcontractorAccess[] }>(
      "/subcontractors",
    );
    return res.data.subcontractors;
  },

  async listIncoming(): Promise<SubcontractorAccess[]> {
    const res = await api.get<{ subcontractors: SubcontractorAccess[] }>(
      "/subcontractors/incoming",
    );
    return res.data.subcontractors;
  },

  async create(input: { invitedAdminEmail: string }): Promise<SubcontractorAccess> {
    const res = await api.post<{ subcontractor: SubcontractorAccess }>(
      "/subcontractors",
      input,
    );
    return res.data.subcontractor;
  },

  async accept(token: string): Promise<SubcontractorAccess> {
    const res = await api.post<{ subcontractor: SubcontractorAccess }>(
      "/subcontractors/accept",
      { token },
    );
    return res.data.subcontractor;
  },

  async revoke(id: string): Promise<SubcontractorAccess> {
    const res = await api.delete<{ subcontractor: SubcontractorAccess }>(
      `/subcontractors/${id}`,
    );
    return res.data.subcontractor;
  },
};

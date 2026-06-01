import { api } from "./axios";

export const authAPI = {
  async requestPasswordReset(email: string) {
    const res = await api.post<{ ok: true }>("/auth/forgot-password", { email });
    return res.data;
  },

  async resetPassword(input: { token: string; password: string }) {
    const res = await api.post<{ ok: true }>("/auth/reset-password", input);
    return res.data;
  },
};

import { api } from "./axios";

export type BillingStatus =
  | "UNPAID"
  | "TRIALING"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED";

export type BillingStatusResponse = {
  billingStatus: BillingStatus;
  paymentProvider: string | null;
  hasStripeCustomer: boolean;
  hasStripeSubscription: boolean;
  paidSeatCount: number;
  activeUserCount: number;
  paidUntil: string | null;
};

export const billingAPI = {
  async createCompanySignupCheckout(input: {
    username: string;
    email: string;
    password: string;
    companyName: string;
  }) {
    const res = await api.post<{ url: string }>(
      "/billing/company-signup/checkout",
      input,
    );
    return res.data;
  },

  async completeCompanySignup(sessionId: string) {
    const res = await api.post<{ id: string }>(
      "/billing/company-signup/complete",
      { sessionId },
    );
    return res.data;
  },

  async status(): Promise<BillingStatusResponse> {
    const res = await api.get<BillingStatusResponse>("/billing/status");
    return res.data;
  },

  async createPortalSession(returnUrl: string) {
    const res = await api.post<{ url: string }>("/billing/portal", {
      returnUrl,
    });
    return res.data;
  },
};

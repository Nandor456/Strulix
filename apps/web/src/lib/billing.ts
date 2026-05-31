import type { BillingStatus } from "@/services/api/billingApi";

const ACTIVE_BILLING_STATUSES = new Set<BillingStatus>(["ACTIVE", "TRIALING"]);

export function isBillingActive(status: string | undefined) {
  return ACTIVE_BILLING_STATUSES.has(status as BillingStatus);
}

export function isBillingRequiredError(error: unknown) {
  const response = (error as {
    response?: { status?: number; data?: { code?: string } };
  })?.response;

  return response?.status === 402 && response.data?.code === "billing_required";
}

import { useMutation, useQuery } from "@tanstack/react-query";
import { billingAPI } from "@/services/api/billingApi";
import { QUERY_KEYS } from "@/services/queryClient";

export function useBillingStatus(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.billing.status,
    queryFn: () => billingAPI.status(),
    enabled,
  });
}

export function useBillingPortal() {
  return useMutation({
    mutationFn: (returnUrl: string) => billingAPI.createPortalSession(returnUrl),
  });
}

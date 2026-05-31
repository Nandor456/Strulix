import type { QueryKey } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";

export const QUERY_KEYS = {
  workPoints: {
    all: ["workpoints"] as const,
    assignedToMe: ["workpoints", "me"] as const,
    detail: (workPointId: string) => ["workpoints", workPointId] as const,
  },
  workers: {
    all: ["workers"] as const,
    forWorkPoint: (workPointId: string) =>
      ["workers", "workpoint", workPointId] as const,
  },
  workerDocuments: {
    all: ["worker-documents"] as const,
    forWorker: (workerId: string) =>
      ["worker-documents", "worker", workerId] as const,
    mine: ["worker-documents", "me"] as const,
  },
  workPointDocuments: {
    all: ["workpoint-documents"] as const,
    forWorkPoint: (workPointId: string) =>
      ["workpoint-documents", "workpoint", workPointId] as const,
  },
  invitations: {
    all: ["invitations"] as const,
  },
  leaveRequests: {
    all: ["leave-requests"] as const,
    mine: ["leave-requests", "my"] as const,
  },
  attendance: {
    all: ["attendance"] as const,
    byWorkPoint: (workPointId: string) =>
      ["attendance", "workpoint", workPointId] as const,
    forWorkPoint: (workPointId: string, params?: object) =>
      ["attendance", "workpoint", workPointId, params] as const,
    qr: (workPointId: string) => ["attendance", "qr", workPointId] as const,
    myDaily: (year: number, month: number) =>
      ["attendance", "me", "daily", year, month] as const,
    myMonthly: (year: number, month: number) =>
      ["attendance", "me", "monthly", year, month] as const,
  },
  messaging: {
    chats: ["messaging", "chats"] as const,
    messages: (chatId: string) => ["messaging", "messages", chatId] as const,
    users: ["messaging", "users"] as const,
  },
  billing: {
    status: ["billing", "status"] as const,
  },
} as const;

const USER_SCOPED_QUERY_PREFIXES = [
  QUERY_KEYS.attendance.all,
  ["attendance", "me"] as const,
  QUERY_KEYS.invitations.all,
  QUERY_KEYS.leaveRequests.all,
  QUERY_KEYS.workPoints.all,
  QUERY_KEYS.workers.all,
  QUERY_KEYS.workerDocuments.all,
  QUERY_KEYS.workPointDocuments.all,
  QUERY_KEYS.messaging.chats,
  QUERY_KEYS.messaging.users,
  QUERY_KEYS.billing.status,
] as const satisfies readonly QueryKey[];

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export async function resetUserScopedQueries(client: QueryClient) {
  await Promise.all(
    USER_SCOPED_QUERY_PREFIXES.map((queryKey) =>
      client.cancelQueries({ queryKey })
    )
  );

  USER_SCOPED_QUERY_PREFIXES.forEach((queryKey) => {
    client.removeQueries({ queryKey });
  });
}

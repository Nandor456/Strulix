import type {
  LeaveRequest,
  LeaveRequestStatus,
  LeaveRequestType,
} from "@/services/api/leaveRequestApi";
import type { TranslationParams } from "@/lib/i18n";

type Translate = (key: string, params?: TranslationParams) => string;

export function leaveTypeLabel(type: LeaveRequestType, t: Translate): string {
  return type === "VACATION" ? t("Vacation leave") : t("Sick leave");
}

export function leaveStatusLabel(
  status: LeaveRequestStatus,
  t: Translate,
): string {
  if (status === "APPROVED") return t("Approved");
  if (status === "REJECTED") return t("Rejected");
  return t("Pending");
}

export function leaveRequestTone(request: LeaveRequest): string {
  if (request.status === "REJECTED") {
    return "border-muted bg-muted/45 text-muted-foreground";
  }

  if (request.type === "SICK") {
    return request.status === "APPROVED"
      ? "border-rose-500/30 bg-rose-500/15 text-rose-800 dark:text-rose-200"
      : "border-rose-500/20 bg-rose-500/10 text-rose-700/80 dark:text-rose-200/80";
  }

  return request.status === "APPROVED"
    ? "border-blue-500/30 bg-blue-500/15 text-blue-800 dark:text-blue-200"
    : "border-blue-500/20 bg-blue-500/10 text-blue-700/80 dark:text-blue-200/80";
}

export function statusDotClass(request: LeaveRequest): string {
  if (request.status === "REJECTED") return "bg-muted-foreground/35";
  if (request.type === "SICK") {
    return request.status === "APPROVED" ? "bg-rose-500" : "bg-rose-300";
  }
  return request.status === "APPROVED" ? "bg-blue-500" : "bg-blue-300";
}

export function statusBadgeVariant(status: LeaveRequestStatus) {
  if (status === "APPROVED") return "success" as const;
  if (status === "REJECTED") return "secondary" as const;
  return "warning" as const;
}

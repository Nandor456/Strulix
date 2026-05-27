import { Check, Clock3, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { LeaveRequest } from "@/services/api/leaveRequestApi";
import { useI18n } from "@/hooks/useI18n";
import {
  leaveRequestTone,
  leaveStatusLabel,
  leaveTypeLabel,
  statusBadgeVariant,
} from "./leaveRequestStyles";
import { cn } from "@/lib/utils";

type LeaveRequestListProps = {
  requests: LeaveRequest[];
  currentUserId: string;
  canReview: boolean;
  isActionPending: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onCancel: (id: string) => void;
};

export function LeaveRequestList({
  requests,
  currentUserId,
  canReview,
  isActionPending,
  onApprove,
  onReject,
  onCancel,
}: LeaveRequestListProps) {
  const { t } = useI18n();
  const pendingRequests = requests.filter(
    (request) => request.status === "PENDING",
  );
  const listedRequests = canReview
    ? requests.filter((request) => request.status !== "PENDING")
    : requests;

  return (
    <aside className="space-y-5">
      {canReview && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">{t("Pending approvals")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("Requests waiting for a manager decision.")}
              </p>
            </div>
            <Badge variant="outline" className="bg-background">
              {pendingRequests.length}
            </Badge>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              {t("No pending requests.")}
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <LeaveRequestCard
                  key={request.id}
                  request={request}
                  currentUserId={currentUserId}
                  canReview={canReview}
                  isActionPending={isActionPending}
                  onApprove={onApprove}
                  onReject={onReject}
                  onCancel={onCancel}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">
            {canReview ? t("All leave requests") : t("Your leave requests")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {canReview
              ? t("Approved and rejected requests stay visible here.")
              : t("Track your submitted leave requests and approval status.")}
          </p>
        </div>

        {listedRequests.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <Clock3 className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">
              {canReview
                ? t("No reviewed leave requests yet.")
                : t("No leave requests yet.")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {listedRequests.map((request) => (
              <LeaveRequestCard
                key={request.id}
                request={request}
                currentUserId={currentUserId}
                canReview={canReview}
                isActionPending={isActionPending}
                onApprove={onApprove}
                onReject={onReject}
                onCancel={onCancel}
              />
            ))}
          </div>
        )}
      </section>
    </aside>
  );
}

type LeaveRequestCardProps = Omit<LeaveRequestListProps, "requests"> & {
  request: LeaveRequest;
};

function LeaveRequestCard({
  request,
  currentUserId,
  canReview,
  isActionPending,
  onApprove,
  onReject,
  onCancel,
}: LeaveRequestCardProps) {
  const { t } = useI18n();
  const isOwnRequest = request.userId === currentUserId;
  const canReviewRequest =
    canReview && request.status === "PENDING" && !isOwnRequest;
  const canCancelRequest = request.status === "PENDING" && isOwnRequest;

  return (
    <article className={cn("rounded-xl border p-3 shadow-sm", leaveRequestTone(request))}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">
            {leaveTypeLabel(request.type, t)}
          </h3>
          <p className="mt-1 truncate text-xs opacity-80">
            {request.userName} · {request.userEmail}
          </p>
        </div>
        <Badge variant={statusBadgeVariant(request.status)}>
          {leaveStatusLabel(request.status, t)}
        </Badge>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="opacity-70">{t("Start date")}</p>
          <p className="font-medium">{formatDate(request.startDate)}</p>
        </div>
        <div>
          <p className="opacity-70">{t("End date")}</p>
          <p className="font-medium">{formatDate(request.endDate)}</p>
        </div>
        <div>
          <p className="opacity-70">{t("Days")}</p>
          <p className="font-medium">{request.days}</p>
        </div>
        <div>
          <p className="opacity-70">{t("Submitted")}</p>
          <p className="font-medium">{formatDate(request.createdAt)}</p>
        </div>
      </div>

      {(canReviewRequest || canCancelRequest) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {canReviewRequest && (
            <>
              <Button
                type="button"
                size="sm"
                disabled={isActionPending}
                onClick={() => onApprove(request.id)}
              >
                <Check className="h-4 w-4" />
                {t("Approve")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={isActionPending}
                onClick={() => onReject(request.id)}
              >
                <X className="h-4 w-4" />
                {t("Reject")}
              </Button>
            </>
          )}
          {canCancelRequest && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isActionPending}
              onClick={() => onCancel(request.id)}
            >
              <X className="h-4 w-4" />
              {t("Cancel request")}
            </Button>
          )}
        </div>
      )}
    </article>
  );
}

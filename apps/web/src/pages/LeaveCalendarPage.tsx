import { useMemo, useState } from "react";
import { CalendarDays, CircleAlert } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { CalendarMonthView } from "@/components/leave/CalendarMonthView";
import { LeaveRequestList } from "@/components/leave/LeaveRequestList";
import { LeaveTypeSelector } from "@/components/leave/LeaveTypeSelector";
import { SelectedRangeSummary } from "@/components/leave/SelectedRangeSummary";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import {
  useAllLeaveRequests,
  useApproveLeaveRequest,
  useCancelLeaveRequest,
  useCreateLeaveRequest,
  useMyLeaveRequests,
  useRejectLeaveRequest,
} from "@/hooks/useLeaveRequests";
import {
  monthAfter,
  selectedRangeOverlapsRequest,
  todayDateKey,
} from "@/lib/leaveDates";
import type {
  LeaveRequest,
  LeaveRequestType,
} from "@/services/api/leaveRequestApi";

function apiErrorMessage(error: unknown, fallback: string) {
  return (
    (error as { response?: { data?: { error?: string } } })?.response?.data
      ?.error ?? fallback
  );
}

export default function LeaveCalendarPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [leaveType, setLeaveType] = useState<LeaveRequestType | "">("");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const canReview = user?.role === "ADMIN" || user?.role === "LEADER";
  const canCreate = user?.role === "WORKER" || user?.role === "LEADER";

  const myRequestsQuery = useMyLeaveRequests();
  const allRequestsQuery = useAllLeaveRequests(canReview);
  const createRequest = useCreateLeaveRequest();
  const approveRequest = useApproveLeaveRequest();
  const rejectRequest = useRejectLeaveRequest();
  const cancelRequest = useCancelLeaveRequest();

  const myRequests = useMemo(
    () => myRequestsQuery.data ?? [],
    [myRequestsQuery.data],
  );
  const allRequests = useMemo(
    () => allRequestsQuery.data ?? [],
    [allRequestsQuery.data],
  );
  const visibleRequests = canReview ? allRequests : myRequests;
  const activeOwnRequests = useMemo(
    () =>
      myRequests.filter(
        (request) =>
          request.status === "PENDING" || request.status === "APPROVED",
      ),
    [myRequests],
  );
  const isLoading =
    myRequestsQuery.isLoading || (canReview && allRequestsQuery.isLoading);
  const hasError =
    myRequestsQuery.error != null || (canReview && allRequestsQuery.error != null);
  const isActionPending =
    createRequest.isPending ||
    approveRequest.isPending ||
    rejectRequest.isPending ||
    cancelRequest.isPending;

  function resetSelection() {
    setStartDate(null);
    setEndDate(null);
    setLeaveType("");
    setValidationMessage(null);
  }

  function selectedRangeOverlapsOwnRequest(start: string, end: string) {
    return activeOwnRequests.some((request) =>
      selectedRangeOverlapsRequest({ startDate: start, endDate: end }, request),
    );
  }

  function handleDateClick(dateKey: string) {
    if (!canCreate) return;

    if (dateKey < todayDateKey()) {
      const message = t("You cannot select past dates.");
      setValidationMessage(message);
      toast({ title: message, variant: "error" });
      return;
    }

    setValidationMessage(null);

    if (!startDate || endDate) {
      setStartDate(dateKey);
      setEndDate(null);
      return;
    }

    const nextStart = dateKey < startDate ? dateKey : startDate;
    const nextEnd = dateKey < startDate ? startDate : dateKey;
    setStartDate(nextStart);
    setEndDate(nextEnd);

    if (selectedRangeOverlapsOwnRequest(nextStart, nextEnd)) {
      setValidationMessage(t("This period overlaps with an existing request."));
    }
  }

  async function handleSubmit() {
    if (!startDate || !endDate) {
      const message = t("Please select a start and end date.");
      setValidationMessage(message);
      toast({ title: message, variant: "error" });
      return;
    }

    if (!leaveType) {
      const message = t("Please choose a leave type.");
      setValidationMessage(message);
      toast({ title: message, variant: "error" });
      return;
    }

    if (startDate < todayDateKey()) {
      const message = t("You cannot select past dates.");
      setValidationMessage(message);
      toast({ title: message, variant: "error" });
      return;
    }

    if (selectedRangeOverlapsOwnRequest(startDate, endDate)) {
      const message = t("This period overlaps with an existing request.");
      setValidationMessage(message);
      toast({ title: message, variant: "error" });
      return;
    }

    try {
      await createRequest.mutateAsync({ type: leaveType, startDate, endDate });
      toast({ title: t("Leave request submitted."), variant: "success" });
      resetSelection();
    } catch (error) {
      toast({
        title: apiErrorMessage(error, t("Failed to submit leave request.")),
        variant: "error",
      });
    }
  }

  async function handleApprove(id: string) {
    try {
      await approveRequest.mutateAsync(id);
      toast({ title: t("Leave request approved."), variant: "success" });
    } catch (error) {
      toast({
        title: apiErrorMessage(error, t("Failed to approve leave request.")),
        variant: "error",
      });
    }
  }

  async function handleReject(id: string) {
    try {
      await rejectRequest.mutateAsync(id);
      toast({ title: t("Leave request rejected."), variant: "success" });
    } catch (error) {
      toast({
        title: apiErrorMessage(error, t("Failed to reject leave request.")),
        variant: "error",
      });
    }
  }

  async function handleCancel(id: string) {
    if (!window.confirm(t("Cancel this pending request?"))) return;
    try {
      await cancelRequest.mutateAsync(id);
      toast({ title: t("Leave request canceled."), variant: "success" });
    } catch (error) {
      toast({
        title: apiErrorMessage(error, t("Failed to cancel leave request.")),
        variant: "error",
      });
    }
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
          <CalendarDays className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("Leave Calendar")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {canCreate
              ? t("Select a leave period directly on the calendar.")
              : t("Review employee leave requests and approved absences.")}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size={36} />
        </div>
      ) : hasError ? (
        <Alert variant="destructive">
          {t("Failed to load leave requests.")}
        </Alert>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
          <CalendarMonthView
            monthDate={monthDate}
            requests={visibleRequests}
            selectedRange={{ startDate, endDate }}
            canSelect={canCreate}
            onPreviousMonth={() => setMonthDate((current) => monthAfter(current, -1))}
            onNextMonth={() => setMonthDate((current) => monthAfter(current, 1))}
            onDateClick={handleDateClick}
          />

          <div className="space-y-5">
            {canCreate && (
              <section className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm">
                <LeaveTypeSelector
                  value={leaveType}
                  onChange={setLeaveType}
                  disabled={createRequest.isPending}
                />
                {validationMessage && (
                  <div className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{validationMessage}</span>
                  </div>
                )}
                <SelectedRangeSummary
                  leaveType={leaveType}
                  startDate={startDate}
                  endDate={endDate}
                  isSubmitting={createRequest.isPending}
                  onSubmit={handleSubmit}
                  onClear={resetSelection}
                />
              </section>
            )}

            <LeaveRequestList
              requests={visibleRequests as LeaveRequest[]}
              currentUserId={user?.id ?? ""}
              canReview={canReview}
              isActionPending={isActionPending}
              onApprove={handleApprove}
              onReject={handleReject}
              onCancel={handleCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}

import { CalendarCheck2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { countInclusiveDays } from "@/lib/leaveDates";
import type { LeaveRequestType } from "@/services/api/leaveRequestApi";
import { useI18n } from "@/hooks/useI18n";
import { leaveTypeLabel } from "./leaveRequestStyles";

type SelectedRangeSummaryProps = {
  leaveType: LeaveRequestType | "";
  startDate: string | null;
  endDate: string | null;
  isSubmitting: boolean;
  onSubmit: () => void;
  onClear: () => void;
};

export function SelectedRangeSummary({
  leaveType,
  startDate,
  endDate,
  isSubmitting,
  onSubmit,
  onClear,
}: SelectedRangeSummaryProps) {
  const { t } = useI18n();
  const hasCompleteRange = Boolean(startDate && endDate);
  const days = hasCompleteRange
    ? countInclusiveDays(startDate!, endDate!)
    : 0;

  return (
    <div className="rounded-xl border bg-muted/35 p-4">
      <div className="flex items-center gap-2">
        <CalendarCheck2 className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">{t("Selected period")}</h2>
        {hasCompleteRange && (
          <Badge variant="outline" className="ml-auto bg-background/80">
            {t("{count} days", { count: days })}
          </Badge>
        )}
      </div>

      <dl className="mt-4 grid gap-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">{t("Leave type")}</dt>
          <dd className="font-medium">
            {leaveType ? leaveTypeLabel(leaveType, t) : t("Not selected")}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">{t("Start date")}</dt>
          <dd className="font-medium">
            {startDate ? formatDate(startDate) : t("Not selected")}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">{t("End date")}</dt>
          <dd className="font-medium">
            {endDate ? formatDate(endDate) : t("Not selected")}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          className="flex-1"
          disabled={isSubmitting}
          onClick={onSubmit}
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? t("Submitting...") : t("Submit request")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting || (!startDate && !endDate && !leaveType)}
          onClick={onClear}
        >
          <X className="h-4 w-4" />
          {t("Clear")}
        </Button>
      </div>
    </div>
  );
}

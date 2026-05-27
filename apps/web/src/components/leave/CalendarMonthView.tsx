import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDate, formatMonthLabel } from "@/lib/format";
import {
  buildMonthGrid,
  isDateInRange,
  requestsForDate,
  todayDateKey,
  type SelectedRange,
} from "@/lib/leaveDates";
import { cn } from "@/lib/utils";
import type { LeaveRequest } from "@/services/api/leaveRequestApi";
import { useI18n } from "@/hooks/useI18n";
import {
  leaveRequestTone,
  leaveStatusLabel,
  leaveTypeLabel,
  statusDotClass,
} from "./leaveRequestStyles";

type CalendarMonthViewProps = {
  monthDate: Date;
  requests: LeaveRequest[];
  selectedRange: SelectedRange;
  canSelect: boolean;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onDateClick: (dateKey: string) => void;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarMonthView({
  monthDate,
  requests,
  selectedRange,
  canSelect,
  onPreviousMonth,
  onNextMonth,
  onDateClick,
}: CalendarMonthViewProps) {
  const { t } = useI18n();
  const days = buildMonthGrid(monthDate);
  const today = todayDateKey();

  return (
    <section className="rounded-2xl border bg-card p-3 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={t("Previous month")}
          onClick={onPreviousMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <h2 className="text-lg font-semibold sm:text-xl">
            {formatMonthLabel(monthDate.getFullYear(), monthDate.getMonth() + 1)}
          </h2>
          {canSelect && (
            <p className="text-xs text-muted-foreground">
              {t("Click a start date, then an end date.")}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={t("Next month")}
          onClick={onNextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase text-muted-foreground sm:gap-2">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-1">
            {t(day)}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1 sm:gap-2">
        {days.map((day) => {
          const dayRequests = requestsForDate(day.dateKey, requests);
          return (
            <CalendarDayCell
              key={day.dateKey}
              dateKey={day.dateKey}
              dayNumber={day.dayNumber}
              isCurrentMonth={day.isCurrentMonth}
              isToday={day.dateKey === today}
              isPast={day.dateKey < today}
              isRangeStart={day.dateKey === selectedRange.startDate}
              isRangeEnd={day.dateKey === selectedRange.endDate}
              isInSelectedRange={isDateInRange(
                day.dateKey,
                selectedRange.startDate,
                selectedRange.endDate,
              )}
              requests={dayRequests}
              canSelect={canSelect}
              onDateClick={onDateClick}
            />
          );
        })}
      </div>
    </section>
  );
}

type CalendarDayCellProps = {
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isInSelectedRange: boolean;
  requests: LeaveRequest[];
  canSelect: boolean;
  onDateClick: (dateKey: string) => void;
};

function CalendarDayCell(props: CalendarDayCellProps) {
  const { t } = useI18n();
  const isSelectedEndpoint = props.isRangeStart || props.isRangeEnd;
  const visibleRequests = props.requests.slice(0, 2);
  const hiddenCount = Math.max(0, props.requests.length - visibleRequests.length);

  const button = (
    <button
      type="button"
      aria-disabled={props.canSelect && props.isPast}
      onClick={() => props.onDateClick(props.dateKey)}
      className={cn(
        "relative flex min-h-20 w-full flex-col rounded-lg border p-1.5 text-left transition sm:min-h-24 sm:p-2 lg:min-h-28",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        props.isCurrentMonth ? "bg-background" : "bg-muted/25 text-muted-foreground",
        props.isToday && "ring-2 ring-primary/30",
        props.isPast && "bg-muted/30 text-muted-foreground",
        props.isInSelectedRange && "border-emerald-500/30 bg-emerald-500/10",
        isSelectedEndpoint && "border-emerald-600 bg-emerald-600/15",
        props.canSelect && !props.isPast && "hover:border-primary/40 hover:bg-accent",
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
          props.isToday && "bg-primary text-primary-foreground",
          isSelectedEndpoint && "bg-emerald-600 text-white",
        )}
      >
        {props.dayNumber}
      </span>

      {visibleRequests.length > 0 && (
        <div className="mt-auto space-y-1 pt-2">
          {visibleRequests.map((request) => (
            <div
              key={request.id}
              className={cn(
                "flex min-w-0 items-center gap-1 rounded-md border px-1.5 py-1 text-[10px] leading-none",
                leaveRequestTone(request),
                request.status === "PENDING" && "opacity-80",
              )}
            >
              <span
                className={cn("h-1.5 w-1.5 shrink-0 rounded-full", statusDotClass(request))}
              />
              <span className="truncate">
                {leaveTypeLabel(request.type, t)}
              </span>
            </div>
          ))}
          {hiddenCount > 0 && (
            <div className="text-[10px] text-muted-foreground">
              +{hiddenCount}
            </div>
          )}
        </div>
      )}
    </button>
  );

  if (props.requests.length === 0) return button;

  return (
    <Popover>
      <PopoverTrigger asChild>{button}</PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <PopoverHeader>
          <PopoverTitle>{formatDate(props.dateKey)}</PopoverTitle>
        </PopoverHeader>
        <div className="space-y-2">
          {props.requests.map((request) => (
            <div
              key={request.id}
              className={cn("rounded-lg border p-2", leaveRequestTone(request))}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{leaveTypeLabel(request.type, t)}</p>
                <span className="text-xs">
                  {leaveStatusLabel(request.status, t)}
                </span>
              </div>
              <p className="mt-1 text-xs opacity-80">
                {request.userName} · {formatDate(request.startDate)} -{" "}
                {formatDate(request.endDate)}
              </p>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

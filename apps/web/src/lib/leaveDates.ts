import type { LeaveRequest } from "@/services/api/leaveRequestApi";

const DAY_MS = 24 * 60 * 60 * 1000;

export type CalendarDay = {
  date: Date;
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
};

export type SelectedRange = {
  startDate: string | null;
  endDate: string | null;
};

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function todayDateKey(): string {
  return toDateKey(new Date());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function monthAfter(date: Date, deltaMonths: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + deltaMonths, 1);
}

export function buildMonthGrid(monthDate: Date): CalendarDay[] {
  const firstOfMonth = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth(),
    1,
  );
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
  const firstGridDay = addDays(firstOfMonth, -mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(firstGridDay, index);
    return {
      date,
      dateKey: toDateKey(date),
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === monthDate.getMonth(),
    };
  });
}

export function isDateInRange(
  dateKey: string,
  startDate: string | null,
  endDate: string | null,
): boolean {
  if (!startDate || !endDate) return false;
  return dateKey >= startDate && dateKey <= endDate;
}

export function countInclusiveDays(startDate: string, endDate: string): number {
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);
  return Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1;
}

export function selectedRangeOverlapsRequest(
  range: { startDate: string; endDate: string },
  request: LeaveRequest,
): boolean {
  return range.startDate <= request.endDate && range.endDate >= request.startDate;
}

export function requestsForDate(
  dateKey: string,
  requests: LeaveRequest[],
): LeaveRequest[] {
  return requests.filter(
    (request) =>
      request.status !== "REJECTED" &&
      request.startDate <= dateKey &&
      request.endDate >= dateKey,
  );
}

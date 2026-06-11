export const ATTENDANCE_TIMEZONE =
  process.env.ATTENDANCE_TIMEZONE ?? "Europe/Bucharest";

type DateParts = {
  year: number;
  month: number;
  day: number;
};

type DateTimeParts = DateParts & {
  hour: number;
  minute: number;
  second: number;
};

function getDateTimePartsInZone(date: Date, tz: string): DateTimeParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) => {
    const part = parts.find((p) => p.type === type);
    if (!part) throw new Error(`Missing ${type} date part`);
    return Number(part.value);
  };

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
}

// Returns a Date at UTC midnight representing the calendar day in the given
// timezone so attendance rows can be grouped and filtered consistently.
export function dateInZone(date: Date, tz: string = ATTENDANCE_TIMEZONE): Date {
  const parts = getDateTimePartsInZone(date, tz);

  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

export function todayInZone(tz: string = ATTENDANCE_TIMEZONE): Date {
  return dateInZone(new Date(), tz);
}

function getStoredAttendanceDateParts(date: Date): DateParts {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

export function attendanceDateTimeToUtc(params: {
  date: Date;
  hour: number;
  minute?: number;
  second?: number;
  tz?: string;
}): Date {
  const { year, month, day } = getStoredAttendanceDateParts(params.date);
  const desiredUtcMs = Date.UTC(
    year,
    month - 1,
    day,
    params.hour,
    params.minute ?? 0,
    params.second ?? 0,
  );
  let utcDate = new Date(desiredUtcMs);
  const tz = params.tz ?? ATTENDANCE_TIMEZONE;

  for (let i = 0; i < 3; i += 1) {
    const actual = getDateTimePartsInZone(utcDate, tz);
    const actualUtcMs = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second,
    );
    const diff = actualUtcMs - desiredUtcMs;
    if (diff === 0) return utcDate;
    utcDate = new Date(utcDate.getTime() - diff);
  }

  return utcDate;
}

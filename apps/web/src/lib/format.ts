type TranslateFn = (key: string) => string;

let activeLocale = "en";
let translate: TranslateFn = (key) => key;

export function configureFormatters({
  locale,
  translate: nextTranslate,
}: {
  locale: string;
  translate: TranslateFn;
}) {
  activeLocale = locale;
  translate = nextTranslate;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return translate("Pending");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return translate("Invalid date");

  return new Intl.DateTimeFormat(activeLocale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return translate("Open");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return translate("Invalid date");

  return new Intl.DateTimeFormat(activeLocale, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(date);
}

export function formatMonthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat(activeLocale, {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export function formatHours(value: number | null | undefined) {
  if (value === null || value === undefined) return "0h";
  const quarterHours = Math.round(value * 4) / 4;
  return `${new Intl.NumberFormat(activeLocale, {
    maximumFractionDigits: 2,
  }).format(quarterHours)}h`;
}

export function formatMoney(
  value: number | null | undefined,
  options?: { precise?: boolean },
) {
  if (value === null || value === undefined) return translate("Not set");

  return new Intl.NumberFormat(activeLocale, {
    currency: "RON",
    maximumFractionDigits: options?.precise ? 2 : 0,
    style: "currency",
  }).format(value);
}

export function formatFileSize(value: number | null | undefined) {
  if (value === null || value === undefined) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const maximumFractionDigits = unitIndex === 0 ? 0 : 1;
  return `${size.toLocaleString(activeLocale, { maximumFractionDigits })} ${units[unitIndex]}`;
}

export function getCurrentPeriod() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getMonthBounds(period: string) {
  const [yearValue, monthValue] = parsePeriod(period);
  const from = `${yearValue}-${String(monthValue).padStart(2, "0")}-01`;
  const lastDay = new Date(yearValue, monthValue, 0).getDate();
  const to = `${yearValue}-${String(monthValue).padStart(2, "0")}-${String(
    lastDay,
  ).padStart(2, "0")}`;

  return { from, to };
}

export function parsePeriod(period: string): [number, number] {
  const [yearRaw, monthRaw] = period.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);

  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    const today = new Date();
    return [today.getFullYear(), today.getMonth() + 1];
  }

  return [year, month];
}

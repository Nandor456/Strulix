const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

function normalizeApiBaseUrl(configuredApiBaseUrl: string | undefined) {
  const trimmedValue = configuredApiBaseUrl?.trim();
  if (!trimmedValue) return "/api";

  const normalizedValue = trimmedValue.replace(/\/+$/, "");
  if (!ABSOLUTE_URL_PATTERN.test(normalizedValue)) {
    return normalizedValue || "/api";
  }

  const url = new URL(normalizedValue);
  if (!url.pathname || url.pathname === "/") {
    url.pathname = "/api";
  }

  return url.toString().replace(/\/+$/, "");
}

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const API_BASE_URL = normalizeApiBaseUrl(configuredApiBaseUrl);

export const API_ORIGIN = ABSOLUTE_URL_PATTERN.test(API_BASE_URL)
  ? new URL(API_BASE_URL).origin
  : undefined;

export function resolveApiUrl(path: string) {
  if (!path) return path;
  if (ABSOLUTE_URL_PATTERN.test(path)) return path;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return API_ORIGIN ? `${API_ORIGIN}${normalizedPath}` : normalizedPath;
}

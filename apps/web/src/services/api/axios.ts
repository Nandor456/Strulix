import axios, {
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { API_BASE_URL } from "./config";

export const UNAUTHORIZED_EVENT_NAME = "app:unauthorized";

type AuthRetryConfig = InternalAxiosRequestConfig & {
  _authRetry?: boolean;
  _skipAuthRefresh?: boolean;
};

type AuthRefreshConfig = AxiosRequestConfig & {
  _skipAuthRefresh?: boolean;
};

const AUTH_REFRESH_SKIPPED_PATHS = new Set([
  "/auth/forgot-password",
  "/auth/login",
  "/auth/register",
  "/auth/reset-password",
  "/auth/refresh",
  "/auth/logout",
]);

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let refreshPromise: Promise<void> | null = null;

function isAuthRefreshSkipped(config: AuthRetryConfig | undefined) {
  if (!config) return true;
  if (config._skipAuthRefresh) return true;

  const url = config.url ?? "";
  const pathname =
    typeof window === "undefined"
      ? url
      : new URL(url, window.location.origin).pathname;

  return Array.from(AUTH_REFRESH_SKIPPED_PATHS).some((path) =>
    pathname.endsWith(path),
  );
}

function redirectToLogin() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT_NAME));

  const isPublicPage =
    window.location.pathname === "/" ||
    window.location.pathname === "/login" ||
    window.location.pathname === "/register";
  if (!isPublicPage) {
    window.location.replace("/login");
  }
}

function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = api
      .post<{ ok: true }>("/auth/refresh", undefined, {
        _skipAuthRefresh: true,
      } as AuthRefreshConfig)
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as AuthRetryConfig | undefined;

    if (error.response?.status === 401 && typeof window !== "undefined") {
      if (config && !config._authRetry && !isAuthRefreshSkipped(config)) {
        config._authRetry = true;
        try {
          await refreshSession();
          return api(config);
        } catch {
          redirectToLogin();
        }
      } else {
        redirectToLogin();
      }
    }

    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

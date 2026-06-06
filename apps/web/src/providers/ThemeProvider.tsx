import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ThemeContext,
  type ThemeContextValue,
  type ThemeMode,
} from "@/context/theme-context";

const STORAGE_KEY = "buildpulse-theme";
const DARK_MODE_QUERY = "(prefers-color-scheme: dark)";

function getStoredThemeMode(): ThemeMode | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedMode = window.localStorage.getItem(STORAGE_KEY);
  return storedMode === "dark" || storedMode === "light" ? storedMode : null;
}

function getSystemThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  return window.matchMedia(DARK_MODE_QUERY).matches ? "dark" : "light";
}

function getInitialThemeMode(): ThemeMode {
  return getStoredThemeMode() ?? getSystemThemeMode();
}

function syncDocumentTheme(mode: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  root.style.colorScheme = mode;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => getInitialThemeMode());

  useEffect(() => {
    syncDocumentTheme(mode);
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((currentMode) =>
      currentMode === "dark" ? "light" : "dark"
    );
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      setMode,
      toggleMode,
    }),
    [mode, setMode, toggleMode]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

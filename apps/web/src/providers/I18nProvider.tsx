import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { I18nContext, type I18nContextValue } from "@/context/i18n-context";
import {
  type AppLanguage,
  getInitialLanguage,
  LANGUAGE_STORAGE_KEY,
  syncDocumentLanguage,
  translateMessage,
} from "@/lib/i18n";
import { configureFormatters } from "@/lib/format";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() =>
    getInitialLanguage(),
  );

  const t = useCallback<I18nContextValue["t"]>(
    (key, params) => translateMessage(language, key, params),
    [language],
  );

  configureFormatters({ locale: language, translate: t });

  useEffect(() => {
    syncDocumentLanguage(language);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language, t]);

  const setLanguage = useCallback((nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
  }, []);

  const roleLabel = useCallback<I18nContextValue["roleLabel"]>(
    (role) => t(role.toUpperCase()),
    [t],
  );

  const invitationStatusLabel = useCallback<
    I18nContextValue["invitationStatusLabel"]
  >((status) => t(status.toUpperCase()), [t]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t,
      roleLabel,
      invitationStatusLabel,
    }),
    [invitationStatusLabel, language, roleLabel, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

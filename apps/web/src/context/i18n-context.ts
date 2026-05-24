import { createContext } from "react";

import type { AppLanguage, TranslationParams } from "@/lib/i18n";

export type I18nContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: string, params?: TranslationParams) => string;
  roleLabel: (role: string) => string;
  invitationStatusLabel: (status: string) => string;
};

export const I18nContext = createContext<I18nContextValue | undefined>(
  undefined,
);

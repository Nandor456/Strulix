import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";

import buildPulseLogo from "@/assets/buildpulselogo.png";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { useI18n } from "@/hooks/useI18n";
import { getPublicRegistrationHref } from "@/lib/registration";


export function PublicHeader() {
  const { t } = useI18n();
  const registrationHref = getPublicRegistrationHref();

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 border-b border-emerald-200/80 bg-emerald-50/95 text-slate-950 backdrop-blur supports-[backdrop-filter]:bg-emerald-50/85 dark:border-emerald-900/70 dark:bg-[#06110d]/95 dark:text-white dark:supports-[backdrop-filter]:bg-[#06110d]/85">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <img
              src={buildPulseLogo}
              alt={t("Strulix logo")}
              className="h-9 w-9 shrink-0 rounded-md"
            />
            <span className="truncate text-base font-semibold">{t("Strulix")}</span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher showLabel={false} buttonClassName="h-9 w-9" />
            <ThemeToggleButton />
            <Button
              asChild
              variant="outline"
              size="lg"
              className="hidden border-red-300 bg-transparent text-red-700 hover:bg-red-50 hover:text-red-800 sm:inline-flex dark:border-red-400/50 dark:text-red-100 dark:hover:bg-red-500/15 dark:hover:text-white"
            >
              <Link to={registrationHref}>{t("Register")}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="hidden border-emerald-300 bg-transparent text-emerald-800 hover:bg-emerald-100 hover:text-emerald-950 sm:inline-flex dark:border-emerald-400/50 dark:text-emerald-100 dark:hover:bg-emerald-500/15 dark:hover:text-white"
            >
              <Link to="/login">
                <LogIn className="h-4 w-4" />
                {t("Login")}
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <div aria-hidden="true" className="h-16" />
    </>
  );
}

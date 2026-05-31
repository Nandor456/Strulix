import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";

import buildPulseLogo from "@/assets/buildpulselogo.png";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { useI18n } from "@/hooks/useI18n";


export function PublicHeader() {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <img
            src={buildPulseLogo}
            alt={t("BuildPulse logo")}
            className="h-9 w-9 shrink-0 rounded-md"
          />
          <span className="truncate text-base font-semibold">{t("BuildPulse")}</span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher showLabel={false} buttonClassName="h-9 w-9" />
          <ThemeToggleButton />
          <Button asChild variant="outline" size="lg" className="hidden sm:inline-flex">
            <Link to="/register">{t("Register")}</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="hidden sm:inline-flex">
            <Link to="/login">
              <LogIn className="h-4 w-4" />
              {t("Login")}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

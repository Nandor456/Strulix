import { Check, Languages } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/useI18n";
import { APP_LANGUAGE_LABELS, APP_LANGUAGES } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  align = "end",
  buttonClassName,
  showLabel = true,
}: {
  align?: "start" | "center" | "end";
  buttonClassName?: string;
  showLabel?: boolean;
}) {
  const { language, setLanguage, t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-2", !showLabel && "w-9 px-0", buttonClassName)}
          aria-label={t("Change language")}
        >
          <Languages className="h-4 w-4" />
          {showLabel ? (
            <span>{APP_LANGUAGE_LABELS[language]}</span>
          ) : (
            <span className="sr-only">{t("Change language")}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-40 rounded-lg">
        <DropdownMenuLabel>{t("Change language")}</DropdownMenuLabel>
        {APP_LANGUAGES.map((value) => (
          <DropdownMenuItem key={value} onSelect={() => setLanguage(value)}>
            <span className="flex w-full items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center">
                {language === value ? <Check className="h-4 w-4" /> : null}
              </span>
              <span>{APP_LANGUAGE_LABELS[value]}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

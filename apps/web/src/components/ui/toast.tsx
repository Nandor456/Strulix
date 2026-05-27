import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Toast as ToastPrimitive } from "radix-ui";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/useI18n";

type ToastVariant = "default" | "success" | "error";

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastItem = ToastInput & {
  id: string;
};

type ToastContextValue = {
  toast: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function iconForVariant(variant: ToastVariant) {
  if (variant === "success") return <CheckCircle2 className="h-4 w-4" />;
  if (variant === "error") return <CircleAlert className="h-4 w-4" />;
  return <Info className="h-4 w-4" />;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const { t } = useI18n();

  const dismiss = useCallback((id: string) => {
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback((input: ToastInput) => {
    const id = crypto.randomUUID();
    setToasts((items) => [
      ...items.slice(-3),
      {
        id,
        variant: "default",
        ...input,
      },
    ]);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {toasts.map((item) => {
          const variant = item.variant ?? "default";
          return (
            <ToastPrimitive.Root
              key={item.id}
              open
              duration={4200}
              onOpenChange={(open) => {
                if (!open) dismiss(item.id);
              }}
              className={cn(
                "grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg ring-1 ring-foreground/10",
                "data-[state=open]:animate-in data-[state=open]:slide-in-from-right-4 data-[state=open]:fade-in-0",
                "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-4 data-[state=closed]:fade-out-0",
                variant === "success" &&
                "border-emerald-500/25 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100",
                variant === "error" &&
                "border-destructive/25 bg-destructive/10 text-destructive dark:bg-destructive/15",
              )}
            >
              <div className="mt-0.5">{iconForVariant(variant)}</div>
              <div className="min-w-0">
                <ToastPrimitive.Title className="text-sm font-medium">
                  {item.title}
                </ToastPrimitive.Title>
                {item.description && (
                  <ToastPrimitive.Description className="mt-1 text-xs opacity-80">
                    {item.description}
                  </ToastPrimitive.Description>
                )}
              </div>
              <ToastPrimitive.Close asChild>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="-mr-1 -mt-1"
                  aria-label={t("Close notification")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          );
        })}
        <ToastPrimitive.Viewport className="fixed right-3 top-3 z-50 flex w-[calc(100vw-1.5rem)] max-w-sm flex-col gap-2 outline-none sm:right-4 sm:top-4" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

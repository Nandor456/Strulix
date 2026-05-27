import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePresence } from "@/hooks/usePresence";
import type { ChatListItem } from "@/types/messaging";
import { useI18n } from "@/hooks/useI18n";

interface ChatHeaderProps {
  chat: ChatListItem;
  onBack?: () => void;
}

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export function ChatHeader({ chat, onBack }: ChatHeaderProps) {
  const isOnline = usePresence(chat.otherUserId);
  const { t } = useI18n();
  const statusText = chat.otherUserId
    ? isOnline
      ? t("Online")
      : t("Offline")
    : t("{count} members", { count: chat.participants.length });

  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/70 bg-background/90 px-4 py-4 backdrop-blur-md md:px-5">
      {onBack && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-xl md:hidden"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      )}

      <div className="relative shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
          {getInitials(chat.name)}
        </div>
        {chat.otherUserId && (
          <span
            className={cn(
              "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-background",
              isOnline ? "bg-green-500" : "bg-muted-foreground/40"
            )}
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold tracking-tight md:text-[15px]">{chat.name}</p>
        <p className="text-xs text-muted-foreground">{statusText}</p>
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";
import type { ChatListItem } from "@/types/messaging";
import { usePresence } from "@/hooks/usePresence";
import { useI18n } from "@/hooks/useI18n";

interface ConversationListItemProps {
  chat: ChatListItem;
  isActive: boolean;
  onClick: () => void;
}

function formatRelativeTime(
  iso: string,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return t("now");
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ConversationListItem({ chat, isActive, onClick }: ConversationListItemProps) {
  const isOnline = usePresence(chat.otherUserId);
  const { t } = useI18n();
  const lastMsgPreview = chat.lastMessage
    ? chat.lastMessage.attachmentName
      ? `📎 ${chat.lastMessage.attachmentName}`
      : chat.lastMessage.body
    : t("No messages yet");

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all",
        "hover:bg-background/70 hover:shadow-sm",
        isActive && "bg-background text-foreground shadow-sm ring-1 ring-border/80"
      )}
    >
      <div className="relative shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
          {getInitials(chat.name)}
        </div>
        {chat.otherUserId && (
          <span
            className={cn(
              "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-muted",
              isOnline ? "bg-green-500" : "bg-muted-foreground/40"
            )}
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-1">
          <span className={cn("truncate text-sm font-medium", chat.unreadCount > 0 && "font-semibold")}>
            {chat.name}
          </span>
          {chat.lastMessageAt && (
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {formatRelativeTime(chat.lastMessageAt, t)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-1">
          <span
            className={cn(
              "truncate text-xs text-muted-foreground",
              chat.unreadCount > 0 && "text-foreground/75"
            )}
          >
            {lastMsgPreview}
          </span>
          {chat.unreadCount > 0 && (
            <span className="flex h-4 min-w-[16px] shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
              {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConversationListItem } from "./ConversationListItem";
import { NewChatDialog } from "./NewChatDialog";
import { useChats } from "@/hooks/useChats";
import { useMessagingSocket } from "@/hooks/useMessagingSocket";
import type { ChatListItem } from "@/types/messaging";
import { useI18n } from "@/hooks/useI18n";

interface ConversationSidebarProps {
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

export function ConversationSidebar({ activeChatId, onSelectChat }: ConversationSidebarProps) {
  const [search, setSearch] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const { data: chats = [], isLoading } = useChats();
  const { joinChat } = useMessagingSocket();
  const { t } = useI18n();

  const filtered = chats.filter((c: ChatListItem) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleSelect(chatId: string) {
    joinChat(chatId);
    onSelectChat(chatId);
  }

  function handleChatCreated(chatId: string) {
    joinChat(chatId);
    onSelectChat(chatId);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border/60 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
              {t("Messaging")}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-base font-semibold tracking-tight">{t("Conversations")}</span>
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl"
                onClick={() => setNewChatOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("New conversation")}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("Search conversations…")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 rounded-xl border-border/70 bg-background/80 pl-8 text-sm shadow-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl px-3 py-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))
          : filtered.map((chat: ChatListItem) => (
            <ConversationListItem
              key={chat.id}
              chat={chat}
              isActive={chat.id === activeChatId}
              onClick={() => handleSelect(chat.id)}
            />
          ))}

        {!isLoading && filtered.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-border/70 bg-background/55 px-4 py-6 text-center text-sm text-muted-foreground">
            {search
              ? t("No conversations match your search.")
              : t("No conversations yet.")}
          </div>
        )}
      </div>

      <NewChatDialog
        open={newChatOpen}
        onOpenChange={setNewChatOpen}
        onChatCreated={handleChatCreated}
      />
    </div>
  );
}

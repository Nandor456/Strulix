import { useState } from "react";
import { ConversationSidebar } from "@/components/messaging/ConversationSidebar";
import { MessageThread } from "@/components/messaging/MessageThread";
import { EmptyConversationState } from "@/components/messaging/EmptyConversationState";
import { useChats, useMarkRead } from "@/hooks/useChats";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function MessagingPage() {
  const { user } = useAuth();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const { data: chats = [] } = useChats();
  const markRead = useMarkRead();

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

  // On mobile: show thread panel if a chat is selected
  const [mobileView, setMobileView] = useState<"sidebar" | "thread">("sidebar");

  function handleSelectChat(chatId: string) {
    setActiveChatId(chatId);
    setMobileView("thread");
    markRead.mutate(chatId);
  }

  function handleBack() {
    setMobileView("sidebar");
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden p-4 md:p-6">
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/80 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.4)] backdrop-blur-sm dark:shadow-[0_24px_60px_-40px_rgba(0,0,0,0.85)]">
        <div
          className={cn(
            "min-h-0 w-full flex-shrink-0 bg-muted/35 md:w-[320px] md:border-r md:border-border/70 xl:w-[340px]",
            mobileView === "thread" ? "hidden md:flex md:flex-col" : "flex flex-col"
          )}
        >
          <ConversationSidebar
            activeChatId={activeChatId}
            onSelectChat={handleSelectChat}
          />
        </div>

        <div
          className={cn(
            "min-h-0 min-w-0 flex-1 bg-background/95",
            mobileView === "sidebar" ? "hidden md:flex md:flex-col" : "flex flex-col"
          )}
        >
          {activeChat && user ? (
            <MessageThread
              key={activeChat.id}
              chat={activeChat}
              currentUserId={user.id}
              onBack={handleBack}
            />
          ) : (
            <div className="hidden md:flex md:flex-1 md:flex-col">
              <EmptyConversationState />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

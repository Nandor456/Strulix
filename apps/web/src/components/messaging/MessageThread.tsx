import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { MessageComposer } from "./MessageComposer";
import { ChatHeader } from "./ChatHeader";
import { useMessagingSocket } from "@/hooks/useMessagingSocket";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useUploadAttachment } from "@/hooks/useChats";
import type { ChatListItem, Message } from "@/types/messaging";

interface MessageThreadProps {
  chat: ChatListItem;
  currentUserId: string;
  onBack?: () => void;
}

export function MessageThread({ chat, currentUserId, onBack }: MessageThreadProps) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useChatMessages(chat.id);
  const { sendMessage, sendTyping, markRead, joinChat, onTyping } =
    useMessagingSocket();
  const uploadAttachment = useUploadAttachment(chat.id);

  const [typingUsers, setTypingUsers] = useState<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isNearBottom = useRef(true);
  const lastMessageIdRef = useRef<string | null>(null);
  const pendingPrependAdjustmentRef = useRef<{
    scrollHeight: number;
    scrollTop: number;
  } | null>(null);

  const messages = useMemo(() => data?.pages.flatMap((p) => p.messages) ?? [], [data]);

  // Join the chat room on mount
  useEffect(() => {
    joinChat(chat.id);
    markRead(chat.id);
  }, [chat.id, joinChat, markRead]);

  // Typing listener
  useEffect(() => {
    return onTyping(({ chatId, userId, isTyping }) => {
      if (chatId !== chat.id || userId === currentUserId) return;
      setTypingUsers((prev) => {
        const next = new Map(prev);
        if (isTyping) {
          if (next.has(userId)) clearTimeout(next.get(userId)!);
          const timer = setTimeout(() => {
            setTypingUsers((p) => {
              const n = new Map(p);
              n.delete(userId);
              return n;
            });
          }, 3000);
          next.set(userId, timer);
        } else {
          if (next.has(userId)) clearTimeout(next.get(userId)!);
          next.delete(userId);
        }
        return next;
      });
    });
  }, [chat.id, currentUserId, onTyping]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const latestMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;
    const previousLatestMessageId = lastMessageIdRef.current;
    const pendingPrependAdjustment = pendingPrependAdjustmentRef.current;

    if (
      pendingPrependAdjustment &&
      latestMessageId === previousLatestMessageId &&
      messages.length > 0
    ) {
      const delta = el.scrollHeight - pendingPrependAdjustment.scrollHeight;
      el.scrollTop = pendingPrependAdjustment.scrollTop + delta;
      pendingPrependAdjustmentRef.current = null;
    } else if (latestMessageId && latestMessageId !== previousLatestMessageId) {
      pendingPrependAdjustmentRef.current = null;
      if (previousLatestMessageId === null) {
        isNearBottom.current = true;
        el.scrollTop = el.scrollHeight;
      } else if (isNearBottom.current) {
        isNearBottom.current = true;
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }

    lastMessageIdRef.current = latestMessageId;
  }, [messages]);

  // Track if near bottom for auto-scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const threshold = 120;
    isNearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;

    // Infinite scroll (load older messages on scroll to top)
    if (el.scrollTop < 80 && hasNextPage && !isFetchingNextPage) {
      pendingPrependAdjustmentRef.current = {
        scrollHeight: el.scrollHeight,
        scrollTop: el.scrollTop,
      };
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  function handleSend(opts: {
    body: string;
    replyToId?: string;
    attachmentUrl?: string;
    attachmentName?: string;
    attachmentType?: string;
    clientNonce: string;
  }) {
    sendMessage({ chatId: chat.id, ...opts });
    setReplyTo(null);
    markRead(chat.id);
    setTimeout(() => {
      isNearBottom.current = true;
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }

  async function handleUpload(file: File) {
    return uploadAttachment.mutateAsync(file);
  }

  const isTypingAnyone = typingUsers.size > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <ChatHeader chat={chat} onBack={onBack} />

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        {isLoading ? (
          <div className="flex flex-col gap-3 p-4 md:p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
              >
                <Skeleton className={`h-10 rounded-2xl ${i % 2 === 0 ? "w-48" : "w-36"}`} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2 px-3 py-4 md:px-5">
            {isFetchingNextPage && (
              <div className="flex justify-center py-2">
                <Skeleton className="h-4 w-24 rounded" />
              </div>
            )}

            {messages.map((msg, idx) => {
              const isSelf = msg.senderId === currentUserId;
              const prevMsg = messages[idx - 1];
              const showSender =
                !isSelf &&
                chat.type !== "DIRECT" &&
                prevMsg?.senderId !== msg.senderId;

              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isSelf={isSelf}
                  showSender={showSender}
                  onReply={setReplyTo}
                  isReplyTarget={replyTo?.id === msg.id}
                />
              );
            })}

            {isTypingAnyone && <TypingIndicator />}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <MessageComposer
        onSend={handleSend}
        onUploadFile={handleUpload}
        onTyping={(isTyping) => sendTyping(chat.id, isTyping)}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}

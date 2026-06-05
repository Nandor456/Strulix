import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { MessageComposer } from "./MessageComposer";
import { ChatHeader } from "./ChatHeader";
import { useMessagingSocket } from "@/hooks/useMessagingSocket";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useUploadAttachment } from "@/hooks/useChats";
import { useI18n } from "@/hooks/useI18n";
import type { ChatListItem, Message } from "@/types/messaging";

interface MessageThreadProps {
  chat: ChatListItem;
  currentUserId: string;
  onBack?: () => void;
}

export function MessageThread({ chat, currentUserId, onBack }: MessageThreadProps) {
  const { data, isLoading, fetchPreviousPage, hasPreviousPage, isFetchingPreviousPage } =
    useChatMessages(chat.id);
  const { sendMessage, sendTyping, markRead, joinChat, onTyping } =
    useMessagingSocket();
  const uploadAttachment = useUploadAttachment(chat.id);
  const { t } = useI18n();

  const [typingUsers, setTypingUsers] = useState<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isNearBottom = useRef(true);
  const hasInitialScrollRef = useRef(false);
  const initialScrollFrameRef = useRef<number | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const pendingPrependAdjustmentRef = useRef<{
    scrollHeight: number;
    scrollTop: number;
  } | null>(null);

  const messages = useMemo(() => data?.pages.flatMap((p) => p.messages) ?? [], [data]);
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 92,
    overscan: 8,
    getItemKey: (index) => messages[index]?.id ?? index,
  });
  const virtualItems = rowVirtualizer.getVirtualItems();

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    const el = scrollRef.current;
    if (!el || messages.length === 0) return;

    rowVirtualizer.scrollToIndex(messages.length - 1, { align: "end", behavior });
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, [messages.length, rowVirtualizer]);

  // Join the chat room on mount
  useEffect(() => {
    joinChat(chat.id);
    markRead(chat.id);
  }, [chat.id, joinChat, markRead]);

  useEffect(() => {
    hasInitialScrollRef.current = false;
    lastMessageIdRef.current = null;
    pendingPrependAdjustmentRef.current = null;
    isNearBottom.current = true;

    if (initialScrollFrameRef.current !== null) {
      window.cancelAnimationFrame(initialScrollFrameRef.current);
      initialScrollFrameRef.current = null;
    }
  }, [chat.id]);

  useEffect(() => {
    return () => {
      if (initialScrollFrameRef.current !== null) {
        window.cancelAnimationFrame(initialScrollFrameRef.current);
      }
    };
  }, []);

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

      if (previousLatestMessageId !== null && isNearBottom.current) {
        isNearBottom.current = true;
        scrollToBottom("smooth");
      }
    }

    lastMessageIdRef.current = latestMessageId;
  }, [messages, scrollToBottom]);

  useLayoutEffect(() => {
    if (isLoading || messages.length === 0 || hasInitialScrollRef.current) return;

    hasInitialScrollRef.current = true;
    isNearBottom.current = true;
    rowVirtualizer.measure();
    scrollToBottom("auto");

    initialScrollFrameRef.current = window.requestAnimationFrame(() => {
      rowVirtualizer.measure();
      scrollToBottom("auto");
      initialScrollFrameRef.current = null;
    });
  }, [isLoading, messages.length, rowVirtualizer, scrollToBottom]);

  // Track if near bottom for auto-scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const threshold = 120;
    isNearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;

    if (el.scrollTop < 120 && hasPreviousPage && !isFetchingPreviousPage) {
      pendingPrependAdjustmentRef.current = {
        scrollHeight: el.scrollHeight,
        scrollTop: el.scrollTop,
      };
      void fetchPreviousPage();
    }
  }, [hasPreviousPage, isFetchingPreviousPage, fetchPreviousPage]);

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
      scrollToBottom("smooth");
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
          <div className="relative px-3 py-4 md:px-5">
            {isFetchingPreviousPage && (
              <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center">
                <Skeleton className="h-4 w-24 rounded bg-background/90" />
              </div>
            )}

            <div
              className="relative w-full"
              style={{ height: messages.length > 0 ? `${rowVirtualizer.getTotalSize()}px` : undefined }}
            >
              {virtualItems.map((virtualItem) => {
                const msg = messages[virtualItem.index];
                if (!msg) return null;

                const isSelf = msg.senderId === currentUserId;
                const prevMsg = messages[virtualItem.index - 1];
                const showSender =
                  !isSelf &&
                  chat.type !== "DIRECT" &&
                  prevMsg?.senderId !== msg.senderId;

                return (
                  <div
                    key={virtualItem.key}
                    data-index={virtualItem.index}
                    ref={rowVirtualizer.measureElement}
                    className="absolute left-0 top-0 w-full py-1"
                    style={{ transform: `translateY(${virtualItem.start}px)` }}
                  >
                    <MessageBubble
                      message={msg}
                      isSelf={isSelf}
                      showSender={showSender}
                      onReply={setReplyTo}
                      isReplyTarget={replyTo?.id === msg.id}
                    />
                  </div>
                );
              })}
            </div>

            {messages.length === 0 && !isTypingAnyone && (
              <div className="flex min-h-32 items-center justify-center px-3 text-sm text-muted-foreground">
                {t("No messages yet")}
              </div>
            )}

            {isTypingAnyone && <TypingIndicator />}
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

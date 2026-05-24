import { useQueryClient } from "@tanstack/react-query";
import { useMessagingSocketContext } from "@/hooks/useMessagingSocketContext";
import { messagingApi } from "@/services/api/messagingApi";
import { QUERY_KEYS } from "@/services/queryClient";
import type { ChatListItem, Message, MessagesPage } from "@/types/messaging";

export function useMessagingSocket() {
  const { socket, isConnected } = useMessagingSocketContext();
  const qc = useQueryClient();

  function upsertMessage(message: Message) {
    qc.setQueryData<{ pages: MessagesPage[]; pageParams: unknown[] }>(
      QUERY_KEYS.messaging.messages(message.chatId),
      (old) => {
        if (!old) {
          return {
            pages: [{ messages: [message], hasMore: false }],
            pageParams: [undefined],
          };
        }

        const lastPage = old.pages[old.pages.length - 1];
        const existingIndex = lastPage.messages.findIndex(
          (item) =>
            item.id === message.id ||
            (item.clientNonce && message.clientNonce && item.clientNonce === message.clientNonce)
        );

        const updatedLastPage =
          existingIndex >= 0
            ? {
                ...lastPage,
                messages: lastPage.messages.map((item, index) =>
                  index === existingIndex ? { ...message, pending: false } : item
                ),
              }
            : {
                ...lastPage,
                messages: [...lastPage.messages, message],
              };

        return {
          ...old,
          pages: [...old.pages.slice(0, -1), updatedLastPage],
        };
      }
    );

    qc.setQueryData<ChatListItem[]>(QUERY_KEYS.messaging.chats, (old) =>
      old?.map((chat) =>
        chat.id === message.chatId
          ? {
              ...chat,
              lastMessage: {
                id: message.id,
                body: message.body,
                senderId: message.senderId,
                senderUsername: message.senderUsername,
                createdAt: message.createdAt,
                attachmentName: message.attachmentName,
              },
              lastMessageAt: message.createdAt,
              unreadCount: 0,
            }
          : chat
      )
    );
  }

  async function sendMessage(opts: {
    chatId: string;
    body: string;
    replyToId?: string;
    attachmentUrl?: string;
    attachmentName?: string;
    attachmentType?: string;
    clientNonce?: string;
  }) {
    if (socket?.connected) {
      socket.emit("message:send", opts);
      return;
    }

    const message = await messagingApi.sendMessage(opts.chatId, opts.body, opts);
    upsertMessage(message);
  }

  function sendTyping(chatId: string, isTyping: boolean) {
    socket?.emit("message:typing", { chatId, isTyping });
  }

  function markRead(chatId: string) {
    socket?.emit("chat:read", { chatId });
  }

  function joinChat(chatId: string) {
    socket?.emit("chat:join", { chatId });
  }

  function onTyping(
    handler: (data: { chatId: string; userId: string; isTyping: boolean }) => void
  ) {
    socket?.on("typing", handler);
    return () => {
      socket?.off("typing", handler);
    };
  }

  function onMessageRead(
    handler: (data: { chatId: string; userId: string; lastReadAt: string }) => void
  ) {
    socket?.on("message:read", handler);
    return () => {
      socket?.off("message:read", handler);
    };
  }

  return { isConnected, sendMessage, sendTyping, markRead, joinChat, onTyping, onMessageRead };
}

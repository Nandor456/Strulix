import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { messagingApi } from "@/services/api/messagingApi";
import { QUERY_KEYS } from "@/services/queryClient";
import type { Message, MessagesPage } from "@/types/messaging";

const MESSAGE_PAGE_SIZE = 30;

export function useChatMessages(chatId: string | null) {
  return useInfiniteQuery<MessagesPage>({
    queryKey: QUERY_KEYS.messaging.messages(chatId ?? ""),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      messagingApi.getMessages(
        chatId!,
        pageParam as string | undefined,
        MESSAGE_PAGE_SIZE
      ),
    getNextPageParam: () => undefined,
    getPreviousPageParam: (firstPage) => firstPage.nextCursor,
    enabled: !!chatId,
  });
}

export function useAppendMessage(chatId: string) {
  const qc = useQueryClient();

  return (message: Message) => {
    qc.setQueryData<{ pages: MessagesPage[]; pageParams: unknown[] }>(
      QUERY_KEYS.messaging.messages(chatId),
      (old) => {
        if (!old) {
          return {
            pages: [{ messages: [message], hasMore: false }],
            pageParams: [undefined],
          };
        }

        // Replace optimistic tmp message if nonces match, otherwise append
        const lastPage = old.pages[old.pages.length - 1];
        const existsIdx = lastPage.messages.findIndex(
          (m) =>
            m.clientNonce &&
            message.clientNonce &&
            m.clientNonce === message.clientNonce
        );

        const updatedLastPage =
          existsIdx >= 0
            ? {
                ...lastPage,
                messages: lastPage.messages.map((m, i) =>
                  i === existsIdx ? { ...message, pending: false } : m
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
  };
}

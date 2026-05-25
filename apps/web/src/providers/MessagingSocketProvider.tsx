import { useEffect, useMemo, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/services/queryClient";
import type { ChatListItem, Message } from "@/types/messaging";
import { MessagingContext } from "@/context/MessagingSocketContext";
import { useAuth } from "@/hooks/useAuth";
import { API_ORIGIN } from "@/services/api/config";
import { api } from "@/services/api/axios";

const EMPTY_ONLINE_USERS = new Set<string>();

export function MessagingSocketProvider({ children }: { children: ReactNode }) {
    const qc = useQueryClient();
    const { isAuthenticated, isLoading, user } = useAuth();
    const [socket] = useState<Socket>(() =>
        io(API_ORIGIN, {
            autoConnect: false,
            withCredentials: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1500,
        })
    );
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isLoading) return;

        if (!isAuthenticated) {
            socket.disconnect();
            return;
        }

        const handleConnect = () => {
            setIsConnected(true);
            setOnlineUsers(new Set());
        };
        const handleDisconnect = () => {
            setIsConnected(false);
            setOnlineUsers(new Set());
        };
        let isRefreshingSocketAuth = false;
        const handleConnectError = (error: Error) => {
            if (isRefreshingSocketAuth || error.message !== "Unauthorized") return;

            isRefreshingSocketAuth = true;
            void api
                .post("/auth/refresh")
                .then(() => {
                    if (socket.disconnected) socket.connect();
                })
                .catch(() => undefined)
                .finally(() => {
                    isRefreshingSocketAuth = false;
                });
        };

        const handlePresenceOnline = ({ userId }: { userId: string }) => {
            setOnlineUsers((prev) => {
                const next = new Set(prev);
                next.add(userId);
                return next;
            });
        };

        const handlePresenceOffline = ({ userId }: { userId: string }) => {
            setOnlineUsers((prev) => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
        };

        const handleNewMessage = (message: Message) => {
            qc.setQueryData<{ pages: { messages: Message[]; hasMore: boolean; nextCursor?: string }[]; pageParams: unknown[] }>(
                QUERY_KEYS.messaging.messages(message.chatId),
                (old) => {
                    if (!old) return old;
                    const lastPage = old.pages[old.pages.length - 1];
                    const existsIdx = lastPage.messages.findIndex(
                        (m) =>
                            m.clientNonce &&
                            message.clientNonce &&
                            m.clientNonce === message.clientNonce
                    );
                    const updatedLast =
                        existsIdx >= 0
                            ? {
                                ...lastPage,
                                messages: lastPage.messages.map((m, i) =>
                                    i === existsIdx ? { ...message, pending: false } : m
                                ),
                            }
                            : { ...lastPage, messages: [...lastPage.messages, message] };
                    return { ...old, pages: [...old.pages.slice(0, -1), updatedLast] };
                }
            );

            qc.setQueryData<ChatListItem[]>(QUERY_KEYS.messaging.chats, (old) =>
                old?.map((c) =>
                    c.id === message.chatId
                        ? {
                            ...c,
                            lastMessage: {
                                id: message.id,
                                body: message.body,
                                senderId: message.senderId,
                                senderUsername: message.senderUsername,
                                createdAt: message.createdAt,
                                attachmentName: message.attachmentName,
                            },
                            lastMessageAt: message.createdAt,
                        }
                        : c
                )
            );
        };

        const handleChatBumped = ({ chatId, lastMessageAt }: { chatId: string; lastMessageAt: string }) => {
            qc.setQueryData<ChatListItem[]>(QUERY_KEYS.messaging.chats, (old) => {
                if (!old) return old;
                return old
                    .map((c) =>
                        c.id === chatId
                            ? { ...c, lastMessageAt, unreadCount: c.unreadCount + 1 }
                            : c
                    )
                    .sort((a, b) => {
                        if (!a.lastMessageAt) return 1;
                        if (!b.lastMessageAt) return -1;
                        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
                    });
            });
        };

        const handleChatChanged = () => {
            void qc.invalidateQueries({ queryKey: QUERY_KEYS.messaging.chats });
        };

        const handleAttendanceChanged = ({
            workPointId,
            workerId,
        }: {
            workPointId: string;
            workerId?: string;
            attendanceId?: string;
            changedAt: string;
        }) => {
            void qc.invalidateQueries({ queryKey: QUERY_KEYS.attendance.byWorkPoint(workPointId) });
            void qc.invalidateQueries({ queryKey: QUERY_KEYS.workPoints.detail(workPointId) });
            void qc.invalidateQueries({ queryKey: QUERY_KEYS.workPoints.all });

            if (!workerId || workerId === user?.id) {
                void qc.invalidateQueries({ queryKey: ["attendance", "me"] });
            }
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("connect_error", handleConnectError);
        socket.on("presence:online", handlePresenceOnline);
        socket.on("presence:offline", handlePresenceOffline);
        socket.on("message:new", handleNewMessage);
        socket.on("chat:bumped", handleChatBumped);
        socket.on("chat:changed", handleChatChanged);
        socket.on("attendance:changed", handleAttendanceChanged);
        socket.connect();

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("connect_error", handleConnectError);
            socket.off("presence:online", handlePresenceOnline);
            socket.off("presence:offline", handlePresenceOffline);
            socket.off("message:new", handleNewMessage);
            socket.off("chat:bumped", handleChatBumped);
            socket.off("chat:changed", handleChatChanged);
            socket.off("attendance:changed", handleAttendanceChanged);
        };
    }, [isAuthenticated, isLoading, qc, socket, user?.id]);

    const value = useMemo(
        () => ({
            socket,
            isConnected: isAuthenticated && isConnected,
            onlineUsers: isAuthenticated ? onlineUsers : EMPTY_ONLINE_USERS,
        }),
        [isAuthenticated, isConnected, onlineUsers, socket]
    );

    return (
        <MessagingContext.Provider
            value={value}
        >
            {children}
        </MessagingContext.Provider>
    );
}

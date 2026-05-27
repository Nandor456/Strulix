import { useState } from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useMessagingUsers, useCreateDirectChat } from "@/hooks/useChats";
import type { ChatUser } from "@/types/messaging";
import { useI18n } from "@/hooks/useI18n";

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChatCreated: (chatId: string) => void;
}

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export function NewChatDialog({ open, onOpenChange, onChatCreated }: NewChatDialogProps) {
  const [search, setSearch] = useState("");
  const { data: users = [], isLoading } = useMessagingUsers();
  const createChat = useCreateDirectChat();
  const { t, roleLabel } = useI18n();

  const filtered = users.filter(
    (u: ChatUser) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSelect(user: ChatUser) {
    const result = await createChat.mutateAsync(user.id);
    onChatCreated(result.chatId);
    onOpenChange(false);
    setSearch("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle className="text-base">{t("New conversation")}</DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("Search users...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto pb-2">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))
            : filtered.map((user: ChatUser) => (
              <button
                key={user.id}
                onClick={() => handleSelect(user)}
                disabled={createChat.isPending}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-accent"
                )}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  {getInitials(user.username)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user.username}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <span className="ml-auto shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                  {roleLabel(user.role)}
                </span>
              </button>
            ))}

          {!isLoading && filtered.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              {t("No users found")}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

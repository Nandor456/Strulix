import {
  useRef,
  useState,
  useEffect,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { Send, Smile, Paperclip, X } from "lucide-react";
import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useThemeMode } from "@/theme/useThemeMode";
import type { Message } from "@/types/messaging";
import { useI18n } from "@/hooks/useI18n";

interface MessageComposerProps {
  onSend: (opts: {
    body: string;
    replyToId?: string;
    attachmentUrl?: string;
    attachmentName?: string;
    attachmentType?: string;
    clientNonce: string;
  }) => void;
  onUploadFile: (file: File) => Promise<{ attachmentUrl: string; attachmentName: string; attachmentType: string }>;
  onTyping: (isTyping: boolean) => void;
  replyTo: Message | null;
  onCancelReply: () => void;
  disabled?: boolean;
}

export function MessageComposer({
  onSend,
  onUploadFile,
  onTyping,
  replyTo,
  onCancelReply,
  disabled,
}: MessageComposerProps) {
  const [body, setBody] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  const { t } = useI18n();

  const canSend = body.trim().length > 0 && !disabled && !isUploading;

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`; // max ~6 rows
  }, [body]);

  useEffect(() => {
    return () => {
      if (typingTimer.current) {
        clearTimeout(typingTimer.current);
      }
    };
  }, []);

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setBody(e.target.value);
    onTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => onTyping(false), 2500);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    if (!canSend) return;
    onSend({
      body: body.trim(),
      replyToId: replyTo?.id,
      clientNonce: `${Date.now()}-${Math.random()}`,
    });
    setBody("");
    onTyping(false);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    textareaRef.current?.focus();
  }

  function handleEmoji(data: EmojiClickData) {
    setBody((prev) => prev + data.emoji);
    setEmojiOpen(false);
    textareaRef.current?.focus();
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const attachment = await onUploadFile(file);
      onSend({
        body: "",
        replyToId: replyTo?.id,
        clientNonce: `${Date.now()}-${Math.random()}`,
        ...attachment,
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="border-t border-border/70 bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 dark:border-border/50 dark:bg-card/90">
      {/* Reply preview */}
      {replyTo && (
        <div className="mb-2 flex items-center gap-2 rounded-2xl border border-border/70 border-l-4 border-l-teal-500/80 bg-muted/70 px-3 py-2 shadow-sm dark:border-border/50 dark:border-l-teal-400/80 dark:bg-muted/45">
          <div className="min-w-0 flex-1">
            <span className="block text-xs font-medium text-foreground">
              {replyTo.senderUsername}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {replyTo.body || `📎 ${t("Attachment")}`}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={onCancelReply}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Left actions */}
        <div className="flex shrink-0 items-center gap-1 pb-1">
          <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-muted/80 hover:text-foreground dark:hover:bg-muted/60"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto overflow-hidden rounded-2xl border border-border/70 bg-popover p-0 shadow-xl dark:border-border/50"
              side="top"
              align="start"
            >
              <EmojiPicker
                onEmojiClick={handleEmoji}
                theme={isDark ? Theme.DARK : Theme.LIGHT}
                height={360}
                width={320}
                searchDisabled={false}
                skinTonesDisabled
                lazyLoadEmojis
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-muted/80 hover:text-foreground dark:hover:bg-muted/60"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Paperclip className={cn("h-4 w-4", isUploading && "animate-pulse")} />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Textarea */}
        <Textarea
          ref={textareaRef}
          value={body}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={t("Write a message… (Enter to send, Shift+Enter for newline)")}
          rows={1}
          disabled={disabled}
          className="min-h-[44px] resize-none overflow-hidden rounded-2xl border border-border/70 bg-background/85 px-3 py-2.5 text-sm leading-snug shadow-sm placeholder:text-muted-foreground/80 focus-visible:ring-2 dark:border-border/50 dark:bg-background/60"
          style={{ height: "36px" }}
        />

        {/* Send */}
        <Button
          size="icon"
          className={cn(
            "h-10 w-10 shrink-0 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-500 text-white shadow-[0_12px_28px_-14px_rgba(13,148,136,0.9)] transition hover:scale-[1.02] hover:from-teal-500 hover:to-cyan-400 dark:from-teal-500 dark:to-cyan-400 dark:shadow-[0_14px_32px_-14px_rgba(34,211,238,0.6)]",
            !canSend && "cursor-not-allowed opacity-40 hover:scale-100"
          )}
          disabled={!canSend}
          onClick={submit}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

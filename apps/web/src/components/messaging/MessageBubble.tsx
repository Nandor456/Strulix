import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/messaging";
import { resolveApiUrl } from "@/services/api/config";

interface MessageBubbleProps {
  message: Message;
  isSelf: boolean;
  showSender: boolean;
  onReply?: (message: Message) => void;
  isReplyTarget?: boolean;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const LONG_PRESS_MS = 450;
const LONG_PRESS_MOVE_PX = 10;

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element &&
    Boolean(target.closest("a, button, input, textarea, select, summary, [role='button']"));
}

export function MessageBubble({
  message,
  isSelf,
  showSender,
  onReply,
  isReplyTarget = false,
}: MessageBubbleProps) {
  const isImage =
    message.attachmentType?.startsWith("image/") ||
    (message.attachmentUrl &&
      /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(message.attachmentUrl));
  const attachmentUrl = message.attachmentUrl
    ? resolveApiUrl(message.attachmentUrl)
    : null;
  const [isPressing, setIsPressing] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const longPressTriggeredRef = useRef(false);
  const isActiveReply = isPressing || isReplyTarget;

  function clearLongPress() {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    pointerStartRef.current = null;
  }

  useEffect(() => {
    return () => {
      clearLongPress();
    };
  }, []);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!onReply) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (isInteractiveTarget(event.target)) return;

    setIsPressing(true);
    longPressTriggeredRef.current = false;
    clearLongPress();
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      onReply(message);
      clearLongPress();
    }, LONG_PRESS_MS);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = pointerStartRef.current;
    if (!start) return;

    const movedX = Math.abs(event.clientX - start.x);
    const movedY = Math.abs(event.clientY - start.y);

    if (movedX > LONG_PRESS_MOVE_PX || movedY > LONG_PRESS_MOVE_PX) {
      clearLongPress();
      setIsPressing(false);
    }
  }

  function handlePointerEnd() {
    clearLongPress();
    setIsPressing(false);
  }

  function handleContextMenu(event: MouseEvent<HTMLDivElement>) {
    if (!longPressTriggeredRef.current) return;
    event.preventDefault();
    longPressTriggeredRef.current = false;
  }

  return (
    <div className={cn("flex flex-col gap-0.5 px-3", isSelf ? "items-end" : "items-start")}>
      {showSender && !isSelf && (
        <span className="px-1 text-[11px] font-medium text-muted-foreground">
          {message.senderUsername}
        </span>
      )}

      <div className={cn("group relative flex max-w-[68%] flex-col gap-1", isSelf && "items-end")}>
        {/* Reply quote */}
        {message.replyTo && (
          <div
            className={cn(
              "rounded-lg border-l-2 border-primary bg-muted px-2.5 py-1.5 text-xs text-muted-foreground",
              isSelf && "self-end"
            )}
          >
            <span className="block font-medium text-foreground">
              {message.replyTo.senderUsername}
            </span>
            <span className="line-clamp-2">{message.replyTo.body || "📎 Attachment"}</span>
          </div>
        )}

        <div className="group/message relative">
          {/* Bubble */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerLeave={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onContextMenu={handleContextMenu}
            className={cn(
              "relative transition-transform duration-150",
              isActiveReply && "scale-[1.03]",
              message.pending && "opacity-60"
            )}
          >
            <div
              className={cn(
                "relative rounded-2xl px-3.5 py-2 leading-snug",
                isSelf
                  ? "rounded-tr-sm bg-gradient-to-br from-primary to-teal-500 text-primary-foreground"
                  : "rounded-tl-sm border border-border bg-card text-foreground",
                isActiveReply && "message-bubble-shake"
              )}
            >
              {/* Attachment */}
              {attachmentUrl && (
                <div className="mb-1">
                  {isImage ? (
                    <a href={attachmentUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={attachmentUrl}
                        alt={message.attachmentName ?? "attachment"}
                        className="max-h-64 max-w-full rounded-lg object-contain"
                      />
                    </a>
                  ) : (
                    <a
                      href={attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex items-center gap-2 rounded-lg p-2 transition-colors",
                        isSelf
                          ? "bg-white/20 hover:bg-white/30"
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="min-w-0 truncate text-xs font-medium">
                        {message.attachmentName ?? "File"}
                      </span>
                      <Download className="ml-auto h-3.5 w-3.5 shrink-0" />
                    </a>
                  )}
                </div>
              )}

              {/* Body */}
              {message.body && (
                <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
              )}
            </div>
          </div>

          {/* Timestamp — beside the bubble, only visible on hover */}
          <span
            className={cn(
              "pointer-events-none absolute top-1/2 -translate-y-1/2 whitespace-nowrap px-1 text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover/message:opacity-100",
              isSelf ? "right-full mr-1.5" : "left-full ml-1.5"
            )}
          >
            {formatTime(message.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

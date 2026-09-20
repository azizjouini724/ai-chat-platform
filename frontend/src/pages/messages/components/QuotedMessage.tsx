import { Image as ImageIcon, FileText, CornerDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/models";

interface QuotedMessageProps {
  replyTo: Message;
  isOwn: boolean;
  onClick: () => void;
}

export function QuotedMessage({ replyTo, isOwn, onClick }: QuotedMessageProps) {
  return (
    <div className="flex w-full flex-col">
      <button
        onClick={onClick}
        className={cn(
          "flex w-full flex-col items-start rounded-lg border-l-4 px-2.5 py-1.5 text-left transition-colors",
          isOwn
            ? "border-white/70 bg-black/15 hover:bg-black/25"
            : "border-chatini-dusty bg-chatini-soft-sky hover:bg-chatini-sky/70"
        )}
      >
        <span className={cn("text-xs font-bold", isOwn ? "text-white" : "text-chatini-deep-sky")}>
          {replyTo.sender?.username ?? "Message"}
        </span>
        <span className={cn("truncate text-xs", isOwn ? "text-white/85" : "text-chatini-deep-sky/80")}>
          {replyTo.isDeleted ? (
            "Message supprime"
          ) : replyTo.imageUrl ? (
            <span className="flex items-center gap-1">
              <ImageIcon className="h-3 w-3" /> Image
            </span>
          ) : replyTo.documentUrl ? (
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" /> Document
            </span>
          ) : (
            replyTo.content
          )}
        </span>
      </button>
      <CornerDownRight
        className={cn("ml-1 h-3 w-3 -mt-0.5", isOwn ? "text-primary-foreground/50" : "text-chatini-dusty")}
      />
    </div>
  );
}
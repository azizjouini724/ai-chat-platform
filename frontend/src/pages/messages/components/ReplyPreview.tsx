import { X, Reply, Image as ImageIcon, FileText } from "lucide-react";
import type { Message } from "@/types/models";

interface ReplyPreviewProps {
  message: Message;
  onCancel: () => void;
}

export function ReplyPreview({ message, onCancel }: ReplyPreviewProps) {
  return (
    <div className="animate-reaction-bar flex items-center gap-2 rounded-xl border-l-4 border-primary bg-muted px-3 py-2">
      <Reply className="h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-primary">
          {message.sender?.username ?? "Message"}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {message.imageUrl ? (
            <span className="flex items-center gap-1">
              <ImageIcon className="h-3 w-3" /> Image
            </span>
          ) : message.documentUrl ? (
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" /> Document
            </span>
          ) : (
            message.content
          )}
        </p>
      </div>
      <button onClick={onCancel} className="shrink-0 text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
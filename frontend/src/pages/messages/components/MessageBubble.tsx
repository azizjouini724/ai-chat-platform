import { useState } from "react";
import { Check, CheckCheck, MoreHorizontal, FileText, Pencil, Trash2, X, Download, Reply, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { UserProfileDialog } from "@/components/shared/UserProfileDialog";
import { ReactionPicker } from "./ReactionPicker";
import { MessageReactions } from "./MessageReactions";
import { QuotedMessage } from "./QuotedMessage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadFile, getFilenameFromUrl } from "@/lib/download-file";
import { messagesApi } from "@/api/messages.api";
import { extractErrorMessage } from "@/lib/error-message";
import { useAuthStore } from "@/store/auth.store";
import type { Message } from "@/types/models";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isReadByOther?: boolean;
  isGroup?: boolean;
  onEdit: (messageId: string, newContent: string) => void;
  onDeleteForAll: (messageId: string) => void;
  onDeleteForMe: (messageId: string) => void;
  onReply: (message: Message) => void;
  onJumpToMessage: (messageId: string) => void;
}

function renderContentWithMentions(content: string, isOwn: boolean) {
  const parts = content.split(/(@\w+)/g);
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <span
        key={i}
        className={cn(
          "font-semibold underline underline-offset-2",
          isOwn ? "text-white" : "text-chatini-deep-sky"
        )}
      >
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function MessageBubble({
  message,
  isOwn,
  isReadByOther,
  isGroup,
  onEdit,
  onDeleteForAll,
  onDeleteForMe,
  onReply,
  onJumpToMessage,
}: MessageBubbleProps) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content ?? "");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const time = new Date(message.createdAt).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const isPending = message.id.startsWith("optimistic-");
  const showSenderInfo = isGroup && !isOwn;

  if (message.type === "SYSTEM") {
    return (
      <div className="flex justify-center">
        <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
          {message.content}
        </span>
      </div>
    );
  }

  if (message.isDeleted) {
    return (
      <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
        <div className="rounded-2xl bg-muted/50 px-4 py-2.5 text-sm italic text-muted-foreground">
          Message supprime
        </div>
      </div>
    );
  }

  function submitEdit() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== message.content) {
      onEdit(message.id, trimmed);
    }
    setIsEditing(false);
  }

  async function handleReaction(key: string) {
    setIsMenuOpen(false);
    const myReaction = message.reactions?.find((r) => r.userId === currentUserId);
    try {
      if (myReaction?.emoji === key) {
        await messagesApi.removeReaction(message.id);
      } else {
        await messagesApi.setReaction(message.id, key);
      }
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible d'envoyer la reaction"));
    }
  }

  async function handleCopy() {
    if (!message.content) return;
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success("Texte copie");
    } catch {
      toast.error("Impossible de copier le texte");
    }
    setIsMenuOpen(false);
  }

  return (
    <div id={`message-${message.id}`} className={cn("group flex items-end gap-1.5", isOwn ? "justify-end" : "justify-start")}>
      {showSenderInfo && (
        <UserAvatar
          src={message.sender?.avatarUrl}
          name={message.sender?.username}
          size="sm"
          className="mb-4 h-9 w-9"
          onClick={() => setIsProfileOpen(true)}
        />
      )}

      {!isPending && !isEditing && (
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 shrink-0 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isOwn ? "end" : "start"} side="top" sideOffset={6} className="w-auto">
            <ReactionPicker
              onSelect={handleReaction}
              currentKey={message.reactions?.find((r) => r.userId === currentUserId)?.emoji}
            />
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { setIsMenuOpen(false); onReply(message); }}>
              <Reply className="mr-2 h-3.5 w-3.5" />
              Repondre
            </DropdownMenuItem>
            {message.content && (
              <DropdownMenuItem onClick={handleCopy}>
                <Copy className="mr-2 h-3.5 w-3.5" />
                Copier le texte
              </DropdownMenuItem>
            )}
            {isOwn && (
              <>
                {message.content && (
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Modifier
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onDeleteForMe(message.id)}>
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Supprimer pour moi
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDeleteForAll(message.id)} className="text-destructive">
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Supprimer pour tous
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <div className={cn("flex max-w-[70%] flex-col gap-1", isOwn ? "items-end" : "items-start")}>
        {showSenderInfo && (
          <span className="px-1 text-[11px] font-medium text-muted-foreground">
            {message.sender?.username ?? "Utilisateur"}
          </span>
        )}

        {message.replyTo && (
          <div className="w-full">
            <QuotedMessage
              replyTo={message.replyTo}
              isOwn={isOwn}
              onClick={() => message.replyTo && onJumpToMessage(message.replyTo.id)}
            />
          </div>
        )}

        {message.imageUrl && (
          <div className="group/image relative cursor-pointer overflow-hidden rounded-2xl">
            <img
              src={message.imageUrl}
              alt="Image envoyee"
              className="max-h-64 w-full object-cover transition-transform duration-200 group-hover/image:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-200 group-hover/image:bg-black/25" />
            <button
              onClick={() => downloadFile(message.imageUrl!, getFilenameFromUrl(message.imageUrl!))}
              className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity duration-200 group-hover/image:opacity-100"
              title="Telecharger"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {message.documentUrl && (
          <button
            onClick={() => downloadFile(message.documentUrl!, getFilenameFromUrl(message.documentUrl!))}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-2xl px-4 py-2.5 text-sm transition-colors duration-200",
              isOwn
                ? "bg-primary text-primary-foreground hover:bg-primary/85"
                : "bg-muted text-foreground hover:bg-muted/70"
            )}
          >
            <FileText className="h-4 w-4 shrink-0" />
            Document joint
            <Download className="ml-auto h-3.5 w-3.5 shrink-0 opacity-70" />
          </button>
        )}

        {isEditing ? (
          <div className="flex w-full items-center gap-1.5">
            <Input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitEdit();
                if (e.key === "Escape") setIsEditing(false);
              }}
              className="h-8 rounded-full text-sm"
            />
            <Button size="icon" className="h-7 w-7 shrink-0 rounded-full" onClick={submitEdit}>
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0 rounded-full"
              onClick={() => setIsEditing(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          message.content && (
            <div
              className={cn(
                "rounded-2xl px-4 py-2.5 text-sm",
                isOwn
                  ? "rounded-br-md bg-primary text-primary-foreground"
                  : "rounded-bl-md bg-muted text-foreground"
              )}
            >

            {renderContentWithMentions(message.content, isOwn)}            
          </div>
          )
        )}

        {message.reactions && message.reactions.length > 0 && (
          <MessageReactions
            reactions={message.reactions}
            currentUserId={currentUserId}
            onToggle={handleReaction}
          />
        )}

        <span className="flex items-center gap-1 px-1 text-[10px] text-muted-foreground">
          {time}
          {message.isEdited && " . modifie"}
          {isOwn && !isPending && (
            <CheckCheck
              className={cn(
                "h-3.5 w-3.5 transition-colors duration-500",
                isReadByOther ? "text-chatini-rose" : "text-muted-foreground"
              )}
              strokeWidth={2.5}
            />
          )}
        </span>
      </div>

      {showSenderInfo && (
        <UserProfileDialog
          user={message.sender ?? null}
          open={isProfileOpen}
          onOpenChange={setIsProfileOpen}
        />
      )}
    </div>
  );
}

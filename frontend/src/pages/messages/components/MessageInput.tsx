import { useState, useRef, type KeyboardEvent, type ChangeEvent, type ClipboardEvent } from "react";
import { Send, Paperclip, X, FileText, Loader2, AtSign } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { getSocket } from "@/sockets/socket";
import { messagesApi } from "@/api/messages.api";
import { extractErrorMessage } from "@/lib/error-message";
import { ReplyPreview } from "./ReplyPreview";
import type { Message, User } from "@/types/models";

interface MessageInputProps {
  conversationId: string;
  onSend: (payload: { content?: string; imageUrl?: string; documentUrl?: string; replyToId?: string }) => void;
  disabled?: boolean;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  members?: User[];
  isGroup?: boolean;
}

interface MentionState {
  query: string;
  start: number;
}

function detectMention(text: string, cursor: number): MentionState | null {
  const uptoCursor = text.slice(0, cursor);
  const match = uptoCursor.match(/(?:^|\s)@(\w*)$/);
  if (!match) return null;
  const query = match[1];
  return { query, start: cursor - query.length - 1 };
}

export function MessageInput({
  conversationId,
  onSend,
  disabled,
  replyingTo,
  onCancelReply,
  members = [],
  isGroup = false,
}: MessageInputProps) {
  const [value, setValue] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [mention, setMention] = useState<MentionState | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isTypingRef = useRef(false);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function emitStartTyping() {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      getSocket()?.emit("startTyping", { conversationId });
    }
    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
    stopTimeoutRef.current = setTimeout(emitStopTyping, 2000);
  }

  function emitStopTyping() {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      getSocket()?.emit("stopTyping", { conversationId });
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    const cursor = e.target.selectionStart ?? v.length;
    setValue(v);
    if (v.trim()) emitStartTyping();
    else emitStopTyping();

    if (isGroup) {
      setMention(detectMention(v, cursor));
    }
  }

  const filteredMembers = mention
    ? members
        .filter((m) => m.username.toLowerCase().startsWith(mention.query.toLowerCase()))
        .slice(0, 5)
    : [];

  function selectMention(username: string) {
    if (!mention) return;
    const before = value.slice(0, mention.start);
    const after = value.slice(mention.start + 1 + mention.query.length);
    const newValue = `${before}@${username} ${after}`;
    setValue(newValue);
    setMention(null);
    requestAnimationFrame(() => {
      const pos = before.length + username.length + 2;
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(pos, pos);
    });
  }

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPendingFile(file);
    e.target.value = "";
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          setPendingFile(file);
          e.preventDefault();
        }
        break;
      }
    }
  }

  async function handleSend() {
    const trimmed = value.trim();
    if (!trimmed && !pendingFile) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 350);
      return;
    }

    emitStopTyping();
    setMention(null);
    const replyToId = replyingTo?.id;

    if (pendingFile) {
      setIsUploading(true);
      try {
        const isImage = pendingFile.type.startsWith("image/");
        const { data } = isImage
          ? await messagesApi.uploadImage(pendingFile)
          : await messagesApi.uploadDocument(pendingFile);

        onSend(isImage ? { imageUrl: data.url, replyToId } : { documentUrl: data.url, replyToId });
        if (trimmed) {
          onSend({ content: trimmed });
        }

        setPendingFile(null);
        setValue("");
        onCancelReply?.();
      } catch (error) {
        toast.error(extractErrorMessage(error, "Echec de l'envoi du fichier"));
      } finally {
        setIsUploading(false);
      }
      return;
    }

    onSend({ content: trimmed, replyToId });
    setValue("");
    onCancelReply?.();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (mention && filteredMembers.length > 0 && (e.key === "Enter" || e.key === "Tab")) {
      e.preventDefault();
      selectMention(filteredMembers[0].username);
      return;
    }
    if (e.key === "Escape" && mention) {
      setMention(null);
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape" && replyingTo) {
      onCancelReply?.();
    }
  }

  const isBusy = disabled || isUploading;

  return (
    <div className="relative border-t border-border p-4">
      {mention && filteredMembers.length > 0 && (
        <div className="animate-reaction-bar absolute bottom-full left-4 z-10 mb-1 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          {filteredMembers.map((m) => (
            <button
              key={m.id}
              onClick={() => selectMention(m.username)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted"
            >
              <UserAvatar src={m.avatarUrl} name={m.username} size="sm" className="h-6 w-6" />
              <span className="text-sm font-medium text-foreground">{m.username}</span>
            </button>
          ))}
        </div>
      )}

      {replyingTo && onCancelReply && (
        <div className="mb-2">
          <ReplyPreview message={replyingTo} onCancel={onCancelReply} />
        </div>
      )}

      {pendingFile && (
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
          {pendingFile.type.startsWith("image/") ? (
            <img
              src={URL.createObjectURL(pendingFile)}
              alt="Apercu"
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <FileText className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="flex-1 truncate text-xs text-muted-foreground">{pendingFile.name}</span>
          <button onClick={() => setPendingFile(null)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt,.zip"
        />
        <Button
          size="icon"
          variant="ghost"
          className="shrink-0 rounded-full"
          onClick={() => fileInputRef.current?.click()}
          disabled={isBusy}
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {isGroup && (
          <Button
            size="icon"
            variant="ghost"
            className="shrink-0 rounded-full"
            onClick={() => {
              const pos = inputRef.current?.selectionStart ?? value.length;
              const before = value.slice(0, pos);
              const after = value.slice(pos);
              const needsSpace = before.length > 0 && !before.endsWith(" ");
              const newValue = `${before}${needsSpace ? " " : ""}@${after}`;
              setValue(newValue);
              requestAnimationFrame(() => {
                const newPos = before.length + (needsSpace ? 1 : 0) + 1;
                inputRef.current?.focus();
                inputRef.current?.setSelectionRange(newPos, newPos);
                setMention({ query: "", start: newPos - 1 });
              });
            }}
            disabled={isBusy}
            title="Mentionner quelqu'un"
          >
            <AtSign className="h-4 w-4" />
          </Button>
        )}

        <Input
          ref={inputRef}
          placeholder="Type a message..."
          className={cn("rounded-full bg-muted", isShaking && "animate-shake")}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={isBusy}
        />

        <Button
          size="icon"
          className="shrink-0 rounded-full"
          onClick={handleSend}
          disabled={isBusy}
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

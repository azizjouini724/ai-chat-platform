import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConversationHeader } from "./ConversationHeader";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { ConversationSearch } from "./ConversationSearch";
import { messagesApi } from "@/api/messages.api";
import { conversationsApi } from "@/api/conversations.api";
import { extractErrorMessage } from "@/lib/error-message";
import { useAuthStore } from "@/store/auth.store";
import { useConversationsStore } from "@/store/conversations.store";
import { getSocket } from "@/sockets/socket";
import type { Conversation, Message } from "@/types/models";
import { formatDateSeparator, isSameDay } from "@/lib/date-separator";

interface ChatWindowProps {
  conversation: Conversation;
  onGroupLeft: () => void;
}

export function ChatWindow({ conversation, onGroupLeft }: ChatWindowProps) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const updateConversationInfo = useConversationsStore((s) => s.updateConversationInfo);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [otherReadAt, setOtherReadAt] = useState<Date | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isFirstLoadRef = useRef(true);

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await messagesApi.getByConversation(conversation.id);
      setMessages(data.map((m) => ({ ...m, clientKey: m.id })));
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible de charger les messages"));
    } finally {
      setIsLoading(false);
    }
  }, [conversation.id]);

  useEffect(() => {
    loadMessages();
    conversationsApi.markAsRead(conversation.id).catch(() => {});
  }, [loadMessages, conversation.id]);

  useEffect(() => {
    isFirstLoadRef.current = true;
    setReplyingTo(null);
    setIsSearchOpen(false);
  }, [conversation.id]);

  useEffect(() => {
    getSocket()?.emit("joinConversation", { conversationId: conversation.id });
  }, [conversation.id]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function handleNewMessage(message: Message) {
      if (message.conversationId !== conversation.id) return;
      if (message.senderId === currentUserId && message.type !== "SYSTEM") return;
      setMessages((prev) =>
        prev.some((m) => m.id === message.id) ? prev : [...prev, { ...message, clientKey: message.id }]
      );
      conversationsApi.markAsRead(conversation.id).catch(() => {});
    }

    function handleConversationRead(data: { conversationId: string; userId: string }) {
      if (data.conversationId === conversation.id && data.userId !== currentUserId) {
        setOtherReadAt(new Date());
      }
    }

    function handleMessageEdited(updated: Message) {
      if (updated.conversationId !== conversation.id) return;
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    }

    function handleMessageDeleted(data: { messageId: string; conversationId: string; deletedForAll: boolean }) {
      if (data.conversationId !== conversation.id) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId
            ? { ...m, isDeleted: true, content: null, imageUrl: null, documentUrl: null }
            : m
        )
      );
    }

    function handleGroupInfoUpdated(data: { conversationId: string; newName?: string; newAvatarUrl?: string }) {
      if (data.conversationId !== conversation.id) return;
      updateConversationInfo(conversation.id, {
        ...(data.newName && { name: data.newName }),
        ...(data.newAvatarUrl && { avatarUrl: data.newAvatarUrl }),
      });
    }

    function handleReactionUpdated(data: { messageId: string; conversationId: string; userId: string; emoji: string | null }) {
      if (data.conversationId !== conversation.id) return;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== data.messageId) return m;
          const existingReactions = m.reactions ?? [];
          const withoutUser = existingReactions.filter((r) => r.userId !== data.userId);
          const nextReactions = data.emoji
            ? [...withoutUser, { messageId: data.messageId, userId: data.userId, emoji: data.emoji }]
            : withoutUser;
          return { ...m, reactions: nextReactions };
        })
      );
    }

    socket.on("newMessage", handleNewMessage);
    socket.on("conversationRead", handleConversationRead);
    socket.on("messageEdited", handleMessageEdited);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("groupInfoUpdated", handleGroupInfoUpdated);
    socket.on("messageReactionUpdated", handleReactionUpdated);
    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("conversationRead", handleConversationRead);
      socket.off("messageEdited", handleMessageEdited);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("groupInfoUpdated", handleGroupInfoUpdated);
      socket.off("messageReactionUpdated", handleReactionUpdated);
    };
  }, [conversation.id, currentUserId, updateConversationInfo]);

  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const isOwnMessage = lastMessage.senderId === currentUserId;

    const behavior = isFirstLoadRef.current || isOwnMessage ? "auto" : "smooth";

    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior });
    });

    isFirstLoadRef.current = false;
  }, [messages, currentUserId]);

  function handleJumpToMessage(messageId: string) {
    setIsSearchOpen(false);
    const el = document.getElementById(`message-${messageId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("animate-highlight-flash", "rounded-2xl");
    setTimeout(() => {
      el.classList.remove("animate-highlight-flash", "rounded-2xl");
    }, 1300);
  }

  async function handleSend(payload: { content?: string; imageUrl?: string; documentUrl?: string; replyToId?: string }) {
    setIsSending(true);
    const tempId = `optimistic-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      clientKey: tempId,
      conversationId: conversation.id,
      senderId: currentUserId ?? "",
      content: payload.content ?? null,
      imageUrl: payload.imageUrl ?? null,
      documentUrl: payload.documentUrl ?? null,
      replyToId: payload.replyToId ?? null,
      replyTo: payload.replyToId ? messages.find((m) => m.id === payload.replyToId) ?? null : null,
      isEdited: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const { data } = await messagesApi.send(conversation.id, payload);
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMessage.id ? { ...data, clientKey: tempId } : m))
      );
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
      toast.error(extractErrorMessage(error, "Impossible d'envoyer le message"));
    } finally {
      setIsSending(false);
    }
  }

  async function handleEdit(messageId: string, newContent: string) {
    try {
      const { data } = await messagesApi.edit(messageId, newContent);
      setMessages((prev) => prev.map((m) => (m.id === messageId ? data : m)));
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible de modifier le message"));
    }
  }

  async function handleDeleteForAll(messageId: string) {
    try {
      await messagesApi.deleteForAll(messageId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isDeleted: true, content: null, imageUrl: null, documentUrl: null } : m
        )
      );
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible de supprimer le message"));
    }
  }

  async function handleDeleteForMe(messageId: string) {
    try {
      await messagesApi.deleteForMe(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.success("Message masque pour toi");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible de masquer le message"));
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <ConversationHeader
        conversation={conversation}
        onGroupLeft={onGroupLeft}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 flex-1 flex-col">
          <ScrollArea className="min-h-0 flex-1 px-5 py-4">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
                {messages.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">Aucun message</p>
                )}
                {messages.map((m, index) => {
                  const previous = messages[index - 1];
                  const showDateSeparator =
                    !previous || !isSameDay(new Date(previous.createdAt), new Date(m.createdAt));

                  return (
                    <div key={m.clientKey ?? m.id} className="animate-message-in">
                      {showDateSeparator && (
                        <div className="my-4 flex justify-center">
                          <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
                            {formatDateSeparator(m.createdAt)}
                          </span>
                        </div>
                      )}
                      <MessageBubble
                        message={m}
                        isOwn={m.senderId === currentUserId}
                        isGroup={conversation.type === "GROUP"}
                        isReadByOther={otherReadAt ? otherReadAt >= new Date(m.createdAt) : false}
                        onEdit={handleEdit}
                        onDeleteForAll={handleDeleteForAll}
                        onDeleteForMe={handleDeleteForMe}
                        onReply={setReplyingTo}
                        onJumpToMessage={handleJumpToMessage}
                      />
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            )}
          </ScrollArea>

          <MessageInput
            conversationId={conversation.id}
            onSend={handleSend}
            disabled={isSending}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            members={conversation.members
              .map((m) => m.user)
              .filter((u): u is NonNullable<typeof u> => !!u && u.id !== currentUserId)}
            isGroup={conversation.type === "GROUP"}
          />
        </div>

        {isSearchOpen && (
          <ConversationSearch
            conversationId={conversation.id}
            onClose={() => setIsSearchOpen(false)}
            onJumpToMessage={handleJumpToMessage}
          />
        )}
      </div>
    </div>
  );
}

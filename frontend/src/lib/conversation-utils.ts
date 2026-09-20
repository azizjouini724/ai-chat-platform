import type { Conversation, User } from "@/types/models";
import { usePresenceStore } from "@/store/presence.store";

interface ConversationDisplayInfo {
  name: string;
  avatarUrl: string | null;
  isOnline: boolean | undefined;
  otherUserId: string | undefined;
  otherUserLastSeenAt: string | null | undefined;
}

export function getConversationDisplayInfo(
  conversation: Conversation,
  currentUserId?: string
): ConversationDisplayInfo {
  if (conversation.type === "GROUP") {
    return {
      name: conversation.name ?? "Groupe sans nom",
      avatarUrl: conversation.avatarUrl ?? null,
      isOnline: undefined,
      otherUserId: undefined,
      otherUserLastSeenAt: undefined,
    };
  }

  const otherMember = conversation.members.find((m) => m.userId !== currentUserId);
  const otherUser: User | undefined = otherMember?.user;
  const isOnline = otherUser ? usePresenceStore.getState().onlineUserIds.has(otherUser.id) : undefined;

  return {
    name: otherUser?.username ?? "Utilisateur",
    avatarUrl: otherUser?.avatarUrl ?? null,
    isOnline,
    otherUserId: otherUser?.id,
    otherUserLastSeenAt: otherUser?.lastSeenAt,
  };
}

export function getLastMessagePreview(conversation: Conversation): string {
  const last = conversation.messages?.[0];
  if (!last) return "Aucun message";
  if (last.imageUrl) return "Image";
  if (last.documentUrl) return "Document";
  return last.content ?? "";
}
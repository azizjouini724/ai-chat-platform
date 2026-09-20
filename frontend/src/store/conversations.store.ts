import { create } from "zustand";
import type { Conversation, ConversationMember, Message } from "@/types/models";

interface ConversationsState {
  conversations: Conversation[];
  setConversations: (list: Conversation[]) => void;
  upsertIncomingMessage: (message: Message, currentUserId?: string, activeConversationId?: string | null) => void;
  addMember: (conversationId: string, member: ConversationMember) => void;
  removeMember: (conversationId: string, userId: string) => void;
  updateMemberRole: (conversationId: string, userId: string, role: "ADMIN" | "MEMBER") => void;
  updateConversationInfo: (conversationId: string, patch: { name?: string; avatarUrl?: string }) => void;
  removeConversation: (conversationId: string) => void;
}

export const useConversationsStore = create<ConversationsState>((set) => ({
  conversations: [],

  setConversations: (list) => set({ conversations: list }),

  upsertIncomingMessage: (message, currentUserId, activeConversationId) =>
    set((state) => {
      const isActive = message.conversationId === activeConversationId;
      const isOwn = message.senderId === currentUserId;

      const next = state.conversations.map((c) => {
        if (c.id !== message.conversationId) return c;
        return {
          ...c,
          messages: [message],
          unreadCount: isActive || isOwn ? c.unreadCount ?? 0 : (c.unreadCount ?? 0) + 1,
          updatedAt: message.createdAt,
        };
      });

      next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return { conversations: next };
    }),

  addMember: (conversationId, member) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, members: [...c.members, member] } : c
      ),
    })),

  removeMember: (conversationId, userId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, members: c.members.filter((m) => m.userId !== userId) }
          : c
      ),
    })),

  updateMemberRole: (conversationId, userId, role) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, members: c.members.map((m) => (m.userId === userId ? { ...m, role } : m)) }
          : c
      ),
    })),

  updateConversationInfo: (conversationId, patch) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, ...patch } : c
      ),
    })),
    removeConversation: (conversationId) =>
  set((state) => ({
    conversations: state.conversations.filter((c) => c.id !== conversationId),
  })),
}));
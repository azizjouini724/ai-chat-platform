import { create } from "zustand";

interface PresenceState {
  onlineUserIds: Set<string>;
  typingByConversation: Record<string, Set<string>>; // conversationId -> Set<userId en train d'écrire>
  setOnlineUsers: (ids: string[]) => void;
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;
  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
  reset: () => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  onlineUserIds: new Set(),
  typingByConversation: {},

  setOnlineUsers: (ids) => set({ onlineUserIds: new Set(ids) }),

  setUserOnline: (userId) =>
    set((state) => ({ onlineUserIds: new Set(state.onlineUserIds).add(userId) })),

  setUserOffline: (userId) =>
    set((state) => {
      const next = new Set(state.onlineUserIds);
      next.delete(userId);
      return { onlineUserIds: next };
    }),

  setTyping: (conversationId, userId, isTyping) =>
    set((state) => {
      const current = new Set(state.typingByConversation[conversationId] ?? []);
      if (isTyping) current.add(userId);
      else current.delete(userId);
      return { typingByConversation: { ...state.typingByConversation, [conversationId]: current } };
    }),

  reset: () => set({ onlineUserIds: new Set(), typingByConversation: {} }),
}));
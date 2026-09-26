import { create } from "zustand";

interface ProfileNavigationState {
  openProfileUserId: string | null;
  openProfile: (userId: string) => void;
  closeProfile: () => void;
}

export const useProfileNavigationStore = create<ProfileNavigationState>((set) => ({
  openProfileUserId: null,
  openProfile: (userId) => set({ openProfileUserId: userId }),
  closeProfile: () => set({ openProfileUserId: null }),
}));
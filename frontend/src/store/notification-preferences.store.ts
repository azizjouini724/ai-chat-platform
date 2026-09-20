import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NotificationPreferencesState {
  soundEnabled: boolean;
  toggleSound: () => void;
}

export const useNotificationPreferencesStore = create<NotificationPreferencesState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
    }),
    { name: "chatini-notification-prefs" }
  )
);
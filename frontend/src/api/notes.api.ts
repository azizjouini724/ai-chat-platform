import { api } from "@/lib/axios";
import type { Note } from "@/types/models";

export const notesApi = {
  create: (data: { content: string; emoji?: string; imageUrl?: string }) =>
    api.post<Note>("/notes", data),
  getFriendsNotes: () => api.get<Note[]>("/notes/friends"),
  deleteMine: () => api.delete("/notes/me"),
  getMyHistory: () => api.get<Note[]>("/notes/history"),
};
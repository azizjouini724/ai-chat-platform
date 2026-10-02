import { api } from "@/lib/axios";
import type { User } from "@/types/models";

export const usersApi = {
  getMe: () => api.get<User>("/users/me"),
  updateMe: (data: { username?: string; bio?: string; status?: string }) => api.patch<User>("/users/me", data),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<User>("/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteMe: () => api.delete("/users/me"),
  search: (query: string) => api.get<User[]>(`/users/search?q=${encodeURIComponent(query)}`),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.patch("/users/me/password", data),
};
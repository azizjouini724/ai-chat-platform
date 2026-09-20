import { api } from "@/lib/axios";
import type { Message } from "@/types/models";

export const messagesApi = {
  send: (conversationId: string, data: { content?: string; imageUrl?: string; documentUrl?: string; replyToId?: string }) =>
  api.post<Message>(`/messages/${conversationId}`, data),

  getByConversation: (conversationId: string, cursor?: string, limit = 30) =>
    api.get<Message[]>(`/messages/${conversationId}`, { params: { cursor, limit } }),

  // Ces deux endpoints ne font QUE l'upload vers Cloudinary et renvoient l'URL.
  // Il faut ensuite appeler `send()` avec cette URL pour créer le message.
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<{ url: string }>("/messages/upload/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  uploadDocument: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<{ url: string }>("/messages/upload/document", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  setReaction: (messageId: string, emoji: string) =>
  api.post(`/messages/message/${messageId}/reaction`, { emoji }),
removeReaction: (messageId: string) =>
  api.delete(`/messages/message/${messageId}/reaction`),

  edit: (messageId: string, content: string) =>
    api.patch<Message>(`/messages/message/${messageId}`, { content }),
  deleteForAll: (messageId: string) => api.delete(`/messages/message/${messageId}/all`),
  deleteForMe: (messageId: string) => api.delete(`/messages/message/${messageId}/me`),
  search: (conversationId: string, query: string) =>
  api.get<Message[]>(`/messages/${conversationId}/search`, { params: { q: query } }),
};
import { api } from "@/lib/axios";
import type { Message } from "@/types/models";

export const messagesApi = {
  send: (conversationId: string, content: string) =>
    api.post<Message>(`/messages/${conversationId}`, { content }),
  getByConversation: (conversationId: string) =>
    api.get<Message[]>(`/messages/${conversationId}`),
  uploadImage: (file: File, conversationId: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("conversationId", conversationId);
    return api.post<Message>("/messages/upload/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  uploadDocument: (file: File, conversationId: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("conversationId", conversationId);
    return api.post<Message>("/messages/upload/document", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  edit: (messageId: string, content: string) =>
    api.patch<Message>(`/messages/message/${messageId}`, { content }),
  deleteForAll: (messageId: string) => api.delete(`/messages/message/${messageId}/all`),
  deleteForMe: (messageId: string) => api.delete(`/messages/message/${messageId}/me`),
};
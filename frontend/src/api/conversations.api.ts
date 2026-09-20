import { api } from "@/lib/axios";
import type { Conversation, GroupJoinRequest } from "@/types/models";

export const conversationsApi = {
  createPrivate: (userId: string) => api.post<Conversation>(`/conversations/private/${userId}`),
  createGroup: (data: { name: string; memberIds: string[] }) =>
    api.post<Conversation>("/conversations/group", data),
  getAll: () => api.get<Conversation[]>("/conversations"),
  getById: (id: string) => api.get<Conversation>(`/conversations/${id}`),
  addMember: (id: string, userId: string) => api.post(`/conversations/${id}/members/${userId}`),
  proposeMember: (id: string, userId: string) => api.post(`/conversations/${id}/propose/${userId}`),
  acceptJoinRequest: (id: string, requestId: string) =>
    api.post(`/conversations/${id}/join-requests/${requestId}/accept`),
  declineJoinRequest: (id: string, requestId: string) =>
    api.post(`/conversations/${id}/join-requests/${requestId}/decline`),
  getJoinRequests: (id: string) => api.get<GroupJoinRequest[]>(`/conversations/${id}/join-requests`),
  markAsRead: (id: string) => api.post(`/conversations/${id}/read`),
  leave: (id: string) => api.delete(`/conversations/${id}/leave`),
  removeMember: (id: string, userId: string) => api.delete(`/conversations/${id}/members/${userId}`),
  promoteMember: (id: string, userId: string) => api.post(`/conversations/${id}/promote/${userId}`),
  update: (id: string, data: { name?: string; avatarUrl?: string }) =>
  api.patch<Conversation>(`/conversations/${id}`, data),
  hide: (id: string) => api.delete(`/conversations/${id}/hide`),
};
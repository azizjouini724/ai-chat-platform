import { api } from "@/lib/axios";
import type { Friendship, User } from "@/types/models";

export const friendsApi = {
  sendRequest: (userId: string) => api.post(`/friends/request/${userId}`),
  acceptRequest: (requestId: string) => api.post(`/friends/accept/${requestId}`),
  declineRequest: (requestId: string) => api.post(`/friends/decline/${requestId}`),
  // Le backend renvoie directement la liste des User (déjà "aplatie"), pas des Friendship
  getFriends: () => api.get<User[]>("/friends"),
  getPendingReceived: () => api.get<Friendship[]>("/friends/pending/received"),
  getPendingSent: () => api.get<Friendship[]>("/friends/pending/sent"),
  removeFriend: (friendshipId: string) => api.delete(`/friends/${friendshipId}`),
  blockUser: (userId: string) => api.post(`/friends/block/${userId}`),
  unblockUser: (userId: string) => api.delete(`/friends/block/${userId}`),
  getBlocked: () => api.get<User[]>("/friends/blocked"),
  getMutualFriends: (userId: string) => api.get<User[]>(`/friends/mutual/${userId}`),
};
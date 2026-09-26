import { api } from "@/lib/axios";
import type { Post, PostComment } from "@/types/models";

export const postsApi = {
  create: (data: { content?: string; imageUrl?: string }) =>
    api.post<Post>("/posts", data),
  getUserPosts: (userId: string) => api.get<Post[]>(`/posts/user/${userId}`),
  delete: (postId: string) => api.delete(`/posts/${postId}`),
  toggleLike: (postId: string) => api.post<{ liked: boolean }>(`/posts/${postId}/like`),
  addComment: (postId: string, content: string) =>
    api.post<PostComment>(`/posts/${postId}/comments`, { content }),
  getComments: (postId: string) => api.get<PostComment[]>(`/posts/${postId}/comments`),
};
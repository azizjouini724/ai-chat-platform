import { api } from "@/lib/axios";
import type { AuthResponse } from "@/types/models";

export const authApi = {
  register: (data: { email: string; username: string; password: string }) =>
    api.post<AuthResponse>("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>("/auth/login", data),

  logout: () => api.post("/auth/logout"),

  verifyEmail: (token: string) => api.get(`/auth/verify-email?token=${token}`),

  forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),

  resetPassword: (data: { token: string; password: string }) =>
    api.post("/auth/reset-password", data),
};
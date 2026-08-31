import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth.store";

let socket: Socket | null = null;

export function connectSocket(): Socket {
  const token = useAuthStore.getState().accessToken;

  if (socket?.connected) return socket;

  socket = io(import.meta.env.VITE_API_URL, {
    auth: { token },
    autoConnect: true,
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}
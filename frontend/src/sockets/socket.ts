import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth.store";

let socket: Socket | null = null;

export function connectSocket(): Socket {
  if (socket?.connected) return socket;

  socket = io(import.meta.env.VITE_API_URL, {
    // `auth` en fonction (pas en objet figé) : socket.io l'appelle à CHAQUE tentative
    // de connexion/reconnexion, donc le token le plus récent du store est toujours utilisé.
    auth: (cb) => {
      cb({ token: useAuthStore.getState().accessToken });
    },
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

// Force une reconnexion immédiate avec le token actuel du store.
// À appeler juste après un refresh de token réussi.
export function reconnectSocketWithFreshToken() {
  if (socket) {
    socket.disconnect();
    socket.connect();
  }
}
import { useEffect } from "react";
import { toast } from "sonner";
import { connectSocket, disconnectSocket } from "@/sockets/socket";
import { useAuthStore } from "@/store/auth.store";
import { usePresenceStore } from "@/store/presence.store";
import { useConversationsStore } from "@/store/conversations.store";
import { useNotificationPreferencesStore } from "@/store/notification-preferences.store";
import { playNotificationSound } from "@/lib/notification-sound";
import type { Message } from "@/types/models";

export function useSocketConnection(activeConversationId: string | null) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const setOnlineUsers = usePresenceStore((s) => s.setOnlineUsers);
  const setUserOnline = usePresenceStore((s) => s.setUserOnline);
  const setUserOffline = usePresenceStore((s) => s.setUserOffline);
  const setTyping = usePresenceStore((s) => s.setTyping);
  const upsertIncomingMessage = useConversationsStore((s) => s.upsertIncomingMessage);
  const addMember = useConversationsStore((s) => s.addMember);
  const removeMember = useConversationsStore((s) => s.removeMember);
  const soundEnabled = useNotificationPreferencesStore((s) => s.soundEnabled);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = connectSocket();

    const onOnlineFriendsList = (data: { onlineFriendIds: string[] }) =>
      setOnlineUsers(data.onlineFriendIds);
    const onUserOnline = (data: { userId: string }) => setUserOnline(data.userId);
    const onUserOffline = (data: { userId: string }) => setUserOffline(data.userId);

    const onNewMessage = (message: Message) => {
      upsertIncomingMessage(message, currentUserId, activeConversationId);

      const isOwn = message.senderId === currentUserId;
      const isCurrentlyOpen = message.conversationId === activeConversationId;
      if (!isOwn && soundEnabled && (!document.hasFocus() || !isCurrentlyOpen)) {
        playNotificationSound();
      }
    };

    const onUserTyping = (data: { conversationId: string; userId: string }) =>
      setTyping(data.conversationId, data.userId, true);
    const onUserStoppedTyping = (data: { conversationId: string; userId: string }) =>
      setTyping(data.conversationId, data.userId, false);

    const onMemberJoined = (data: { conversationId: string; user: any }) => {
      addMember(data.conversationId, {
        id: `${data.conversationId}-${data.user.id}`,
        conversationId: data.conversationId,
        userId: data.user.id,
        role: "MEMBER",
        user: data.user,
        joinedAt: new Date().toISOString(),
      });
    };
    const onMemberLeft = (data: { conversationId: string; userId: string }) => {
      removeMember(data.conversationId, data.userId);
    };

    const onMentioned = (data: { conversationId: string; messageId: string; mentionedBy: string; content: string }) => {
      toast.info("Tu as ete mentionne", { description: data.content });
      if (soundEnabled) playNotificationSound();
    };

    socket.on("onlineFriendsList", onOnlineFriendsList);
    socket.on("userOnline", onUserOnline);
    socket.on("userOffline", onUserOffline);
    socket.on("newMessage", onNewMessage);
    socket.on("userTyping", onUserTyping);
    socket.on("userStoppedTyping", onUserStoppedTyping);
    socket.on("memberJoined", onMemberJoined);
    socket.on("memberLeft", onMemberLeft);
    socket.on("mentioned", onMentioned);

    return () => {
      socket.off("onlineFriendsList", onOnlineFriendsList);
      socket.off("userOnline", onUserOnline);
      socket.off("userOffline", onUserOffline);
      socket.off("newMessage", onNewMessage);
      socket.off("userTyping", onUserTyping);
      socket.off("userStoppedTyping", onUserStoppedTyping);
      socket.off("memberJoined", onMemberJoined);
      socket.off("memberLeft", onMemberLeft);
      socket.off("mentioned", onMentioned);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, currentUserId, activeConversationId, soundEnabled]);

  useEffect(() => {
    if (!isAuthenticated) disconnectSocket();
  }, [isAuthenticated]);
}

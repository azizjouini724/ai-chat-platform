import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FriendCard } from "./components/FriendCard";
import { DiscoverCard } from "./components/DiscoverCard";
import { DiscoverDialog } from "./components/DiscoverDialog";
import { FriendRequestCard } from "./components/FriendRequestCard";
import { friendsApi } from "@/api/friends.api";
import { conversationsApi } from "@/api/conversations.api";
import type { Friendship, User } from "@/types/models";
import { connectSocket } from "@/sockets/socket";
interface ContactsPageProps {
  onOpenChat: (conversationId: string) => void;
}

export function ContactsPage({ onOpenChat }: ContactsPageProps) {
  const [friends, setFriends] = useState<User[]>([]);
  const [received, setReceived] = useState<Friendship[]>([]);
  const [sent, setSent] = useState<Friendship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDiscoverOpen, setIsDiscoverOpen] = useState(false);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [friendsRes, receivedRes, sentRes] = await Promise.all([
        friendsApi.getFriends(),
        friendsApi.getPendingReceived(),
        friendsApi.getPendingSent(),
      ]);
      setFriends(friendsRes.data);
      setReceived(receivedRes.data);
      setSent(sentRes.data);
    } catch {
      toast.error("Impossible de charger tes contacts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);


// Écoute les événements temps réel liés aux demandes d'ami
useEffect(() => {
  const socket = connectSocket();

  function handleFriendEvent() {
    loadAll();
  }

  socket.on("newFriendRequest", handleFriendEvent);
  socket.on("friendRequestSent", handleFriendEvent);
  socket.on("friendRequestAccepted", handleFriendEvent);
  socket.on("friendRequestDeclined", handleFriendEvent);

  return () => {
    socket.off("newFriendRequest", handleFriendEvent);
    socket.off("friendRequestSent", handleFriendEvent);
    socket.off("friendRequestAccepted", handleFriendEvent);
    socket.off("friendRequestDeclined", handleFriendEvent);
  };
}, [loadAll]);

  async function handleChat(userId: string) {
    try {
      const { data } = await conversationsApi.createPrivate(userId);
      onOpenChat(data.id);
    } catch {
      toast.error("Impossible d'ouvrir la conversation");
    }
  }

  async function handleBlock(userId: string) {
    try {
      await friendsApi.blockUser(userId);
      toast.success("Utilisateur bloqué");
      loadAll();
    } catch {
      toast.error("Une erreur est survenue");
    }
  }

  async function handleAccept(requestId: string) {
    try {
      await friendsApi.acceptRequest(requestId);
      toast.success("Nouvel ami ajouté", { icon: <Sparkles className="h-4 w-4" /> });
      loadAll();
    } catch {
      toast.error("Une erreur est survenue");
    }
  }

  async function handleDecline(requestId: string) {
    try {
      await friendsApi.declineRequest(requestId);
      loadAll();
    } catch {
      toast.error("Une erreur est survenue");
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
    const connectedIds = new Set<string>([
    ...friends.map((u) => u.id),
    ...sent.map((f) => f.receiverId),
    ...received.map((f) => f.senderId),
  ]);

  return (
    <div className="p-6">
      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="mb-6 rounded-full bg-muted p-1">
          <TabsTrigger value="friends" className="rounded-full">
            Mes amis
            <Badge variant="secondary" className="ml-1.5">{friends.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="requests" className="rounded-full">
            Demandes
            {received.length > 0 && <Badge className="ml-1.5">{received.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {friends.map((user) => (
              <FriendCard key={user.id} user={user} onChat={handleChat} onBlock={handleBlock} />
            ))}
            <DiscoverCard onClick={() => setIsDiscoverOpen(true)} />
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
              Reçues ({received.length})
            </h3>
            <div className="space-y-2">
              {received.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucune demande en attente</p>
              )}
              {received.map((f) => (
                <FriendRequestCard
                  key={f.id}
                  friendship={f}
                  variant="incoming"
                  onAccept={() => handleAccept(f.id)}
                  onDecline={() => handleDecline(f.id)}
                />
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
              Envoyées ({sent.length})
            </h3>
            <div className="space-y-2">
              {sent.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucune demande envoyée</p>
              )}
              {sent.map((f) => (
                <FriendRequestCard key={f.id} friendship={f} variant="sent" />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

        <DiscoverDialog open={isDiscoverOpen} onOpenChange={setIsDiscoverOpen} connectedIds={connectedIds} />    
        </div>
  );
}
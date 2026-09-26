import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, UserPlus, UserMinus, MessageSquare, ShieldOff, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { PostCard } from "./components/PostCard";
import { usersApi } from "@/api/users.api";
import { friendsApi } from "@/api/friends.api";
import { conversationsApi } from "@/api/conversations.api";
import { postsApi } from "@/api/posts.api";
import { extractErrorMessage } from "@/lib/error-message";
import { usePresenceStore } from "@/store/presence.store";
import { useAuthStore } from "@/store/auth.store";
import { useProfileNavigationStore } from "@/store/profile-navigation.store";
import type { Friendship, Post, PostComment, User } from "@/types/models";

type RelationStatus = "loading" | "none" | "friends" | "pendingSent" | "pendingReceived" | "blocked";

interface OtherUserProfilePageProps {
  userId: string;
  onBack: () => void;
  onOpenChat: (conversationId: string) => void;
}

export function OtherUserProfilePage({ userId, onBack, onOpenChat }: OtherUserProfilePageProps) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const onlineUserIds = usePresenceStore((s) => s.onlineUserIds);
  const openProfile = useProfileNavigationStore((s) => s.openProfile);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<RelationStatus>("loading");
  const [pendingFriendship, setPendingFriendship] = useState<Friendship | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [mutualFriends, setMutualFriends] = useState<User[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatus("loading");
      try {
        const [userRes, friendsRes, sentRes, receivedRes, blockedRes] = await Promise.all([
          usersApi.getById(userId),
          friendsApi.getFriends(),
          friendsApi.getPendingSent(),
          friendsApi.getPendingReceived(),
          friendsApi.getBlocked(),
        ]);
        if (cancelled) return;

        setUser(userRes.data);

        if (blockedRes.data.some((u) => u.id === userId)) {
          setStatus("blocked");
        } else if (friendsRes.data.some((u) => u.id === userId)) {
          setStatus("friends");
        } else if (sentRes.data.some((f) => f.receiverId === userId)) {
          setStatus("pendingSent");
        } else {
          const received = receivedRes.data.find((f) => f.senderId === userId);
          if (received) {
            setPendingFriendship(received);
            setStatus("pendingReceived");
          } else {
            setStatus("none");
          }
        }
      } catch (error) {
        toast.error(extractErrorMessage(error, "Impossible de charger ce profil"));
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    setIsLoadingPosts(true);
    postsApi
      .getUserPosts(userId)
      .then((res) => setPosts(res.data))
      .catch(() => toast.error("Impossible de charger les publications"))
      .finally(() => setIsLoadingPosts(false));
  }, [userId]);

  useEffect(() => {
    if (!currentUserId || userId === currentUserId) {
      setMutualFriends([]);
      return;
    }
    friendsApi
      .getMutualFriends(userId)
      .then((res) => setMutualFriends(res.data))
      .catch(() => setMutualFriends([]));
  }, [userId, currentUserId]);

  async function handleAddFriend() {
    setIsActing(true);
    try {
      await friendsApi.sendRequest(userId);
      setStatus("pendingSent");
      toast.success("Demande envoyee");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible d'envoyer la demande"));
    } finally {
      setIsActing(false);
    }
  }

  async function handleAccept() {
    if (!pendingFriendship) return;
    setIsActing(true);
    try {
      await friendsApi.acceptRequest(pendingFriendship.id);
      setStatus("friends");
      toast.success("Nouvel ami ajoute");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible d'accepter la demande"));
    } finally {
      setIsActing(false);
    }
  }

  async function handleDecline() {
    if (!pendingFriendship) return;
    setIsActing(true);
    try {
      await friendsApi.declineRequest(pendingFriendship.id);
      setStatus("none");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible de refuser la demande"));
    } finally {
      setIsActing(false);
    }
  }

  async function handleBlock() {
    setIsActing(true);
    try {
      await friendsApi.blockUser(userId);
      setStatus("blocked");
      toast.success("Utilisateur bloque");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible de bloquer cet utilisateur"));
    } finally {
      setIsActing(false);
    }
  }

  async function handleUnblock() {
    setIsActing(true);
    try {
      await friendsApi.unblockUser(userId);
      setStatus("none");
      toast.success("Utilisateur debloque");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible de debloquer cet utilisateur"));
    } finally {
      setIsActing(false);
    }
  }

  async function handleMessage() {
    setIsActing(true);
    try {
      const { data } = await conversationsApi.createPrivate(userId);
      onOpenChat(data.id);
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible d'ouvrir la conversation"));
    } finally {
      setIsActing(false);
    }
  }

  function handlePostDeleted(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  function handleLikeToggled(postId: string, liked: boolean) {
    if (!currentUserId) return;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const likes = liked
          ? [...p.likes, { id: `temp-${Date.now()}`, postId, userId: currentUserId }]
          : p.likes.filter((l) => l.userId !== currentUserId);
        return { ...p, likes };
      })
    );
  }

  function handleCommentAdded(postId: string, comment: PostComment, newCount: number) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, comments: [comment], _count: { comments: newCount } }
          : p
      )
    );
  }

  function handleOpenMutualFriend(friendId: string) {
    openProfile(friendId);
  }

  if (status === "loading" || !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isOnline = onlineUserIds.has(user.id);
  const isBlocked = status === "blocked";

  return (
    <div className="animate-view-fade mx-auto h-full max-w-2xl overflow-y-auto p-6">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </button>

      <div className="flex flex-col items-center">
        <UserAvatar src={user.avatarUrl} name={user.username} isOnline={isOnline} size="lg" className="h-32 w-32" />
        <h2 className="mt-4 font-heading text-xl font-bold text-foreground">{user.username}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{isOnline ? "En ligne" : "Hors ligne"}</p>
        {user.status && (
          <p className="mt-1.5 text-sm text-primary">{user.status}</p>
        )}

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {status === "none" && (
            <Button onClick={handleAddFriend} disabled={isActing} className="rounded-full">
              <UserPlus className="mr-1.5 h-4 w-4" />
              Ajouter en ami
            </Button>
          )}
          {status === "pendingSent" && (
            <Button variant="secondary" disabled className="rounded-full">
              Demande envoyee
            </Button>
          )}
          {status === "pendingReceived" && (
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={handleAccept} disabled={isActing} className="rounded-full">
                <Check className="mr-1.5 h-4 w-4" />
                Accepter
              </Button>
              <Button onClick={handleDecline} disabled={isActing} variant="outline" className="rounded-full">
                <X className="mr-1.5 h-4 w-4" />
                Refuser
              </Button>
            </div>
          )}
          {status === "friends" && (
            <Button onClick={handleMessage} disabled={isActing} className="rounded-full">
              <MessageSquare className="mr-1.5 h-4 w-4" />
              Envoyer un message
            </Button>
          )}
          {isBlocked ? (
            <Button onClick={handleUnblock} disabled={isActing} variant="outline" className="rounded-full">
              <ShieldOff className="mr-1.5 h-4 w-4" />
              Debloquer
            </Button>
          ) : (
            status !== "pendingReceived" && (
              <Button onClick={handleBlock} disabled={isActing} variant="outline" className="rounded-full text-destructive hover:text-destructive">
                <UserMinus className="mr-1.5 h-4 w-4" />
                Bloquer
              </Button>
            )
          )}
        </div>
      </div>

      {isBlocked ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Tu as bloque cet utilisateur. Debloque-le pour voir son profil complet.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 rounded-2xl border border-border bg-card p-5">
            <p className="text-sm font-semibold text-foreground">A propos</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {user.bio || "Aucune bio pour le moment."}
            </p>
          </div>

          {mutualFriends.length > 0 && (
            <div className="mt-4 rounded-xl bg-muted/60 px-4 py-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {mutualFriends.length} ami{mutualFriends.length > 1 ? "s" : ""} en commun
              </p>
              <div className="flex flex-wrap gap-3">
                                {mutualFriends.map((friend) => (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => handleOpenMutualFriend(friend.id)}
                    className="group flex w-16 flex-col items-center gap-1 rounded-lg p-1.5 text-center transition-colors hover:bg-muted"
                  >
                    <UserAvatar
                      src={friend.avatarUrl}
                      name={friend.username}
                      size="sm"
                      className="transition-transform group-hover:scale-105"
                    />
                    <span className="w-full truncate text-[11px] text-muted-foreground transition-colors group-hover:text-foreground">
                      {friend.username}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 space-y-4">
            {isLoadingPosts ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                <p className="text-sm text-muted-foreground">Aucune publication pour le moment</p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDeleted={handlePostDeleted}
                  onLikeToggled={handleLikeToggled}
                  onCommentAdded={handleCommentAdded}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
import { useEffect, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { ArrowLeft, Camera, Loader2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { CreatePostForm } from "./components/CreatePostForm";
import { PostCard } from "./components/PostCard";
import { usersApi } from "@/api/users.api";
import { postsApi } from "@/api/posts.api";
import { extractErrorMessage } from "@/lib/error-message";
import { useAuthStore } from "@/store/auth.store";
import type { Post, PostComment } from "@/types/models";

interface MyProfilePageProps {
  onBack: () => void;
  onOpenNotesHistory: () => void;
}

export function MyProfilePage({ onBack, onOpenNotesHistory }: MyProfilePageProps) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameValue, setUsernameValue] = useState(user?.username ?? "");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState(user?.bio ?? "");
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [statusValue, setStatusValue] = useState(user?.status ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  useEffect(() => {
    if (!user) return;
    postsApi
      .getUserPosts(user.id)
      .then((res) => setPosts(res.data))
      .catch(() => toast.error("Impossible de charger les publications"))
      .finally(() => setIsLoadingPosts(false));
  }, [user?.id]);

  if (!user) return null;

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const { data } = await usersApi.uploadAvatar(file);
      setUser(data);
      toast.success("Photo de profil mise a jour");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Echec de l'envoi de l'image"));
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = "";
    }
  }

  async function handleSaveUsername() {
    const trimmed = usernameValue.trim();
    if (!trimmed || trimmed === user?.username) {
      setIsEditingUsername(false);
      return;
    }
    setIsSaving(true);
    try {
      const { data } = await usersApi.updateMe({ username: trimmed });
      setUser(data);
      setIsEditingUsername(false);
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible de modifier le nom d'utilisateur"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveBio() {
    const trimmed = bioValue.trim();
    setIsSaving(true);
    try {
      const { data } = await usersApi.updateMe({ bio: trimmed });
      setUser(data);
      setIsEditingBio(false);
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible de modifier la bio"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveStatus() {
    const trimmed = statusValue.trim();
    setIsSaving(true);
    try {
      const { data } = await usersApi.updateMe({ status: trimmed });
      setUser(data);
      setIsEditingStatus(false);
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible de modifier le statut"));
    } finally {
      setIsSaving(false);
    }
  }

  function handlePostCreated(post: Post) {
    setPosts((prev) => [post, ...prev]);
  }

  function handlePostDeleted(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  function handleLikeToggled(postId: string, liked: boolean) {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        let likes = p.likes;
        if (liked) {
          if (!user) return p; // can't add like without user
          likes = [...p.likes, { id: `temp-${Date.now()}`, postId, userId: user.id }];
        } else {
          // if user is null, nothing to remove
          likes = user ? p.likes.filter((l) => l.userId !== user.id) : p.likes;
        }
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
        <div className="relative">
          <UserAvatar src={user.avatarUrl} name={user.username} size="lg" className="h-32 w-32" />
          <label className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
        </div>

        <div className="mt-4 w-full max-w-sm">
          {isEditingUsername ? (
            <div className="flex items-center gap-2">
              <Input
                autoFocus
                value={usernameValue}
                onChange={(e) => setUsernameValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveUsername()}
                className="text-center"
              />
              <Button size="icon" className="shrink-0 rounded-full" onClick={handleSaveUsername} disabled={isSaving}>
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="shrink-0 rounded-full"
                onClick={() => { setIsEditingUsername(false); setUsernameValue(user.username); }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingUsername(true)}
              className="mx-auto flex items-center gap-1.5 font-heading text-xl font-bold text-foreground"
            >
              {user.username}
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          <p className="mt-1 text-center text-sm text-muted-foreground">{user.email}</p>

          {isEditingStatus ? (
            <div className="mt-2 flex items-center gap-2">
              <Input
                autoFocus
                placeholder="Ton statut du moment..."
                maxLength={50}
                value={statusValue}
                onChange={(e) => setStatusValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveStatus()}
                className="text-center text-sm"
              />
              <Button size="icon" className="shrink-0 rounded-full" onClick={handleSaveStatus} disabled={isSaving}>
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="shrink-0 rounded-full"
                onClick={() => { setIsEditingStatus(false); setStatusValue(user.status ?? ""); }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingStatus(true)}
              className="mx-auto mt-2 flex items-center justify-center gap-1.5 text-sm text-primary hover:underline"
            >
              {user.status || "Ajouter un statut..."}
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
       <button
        onClick={onOpenNotesHistory}
        className="mx-auto mt-4 block text-sm text-primary hover:underline"
      >
        Voir mes notes
      </button>

      <div className="mt-8 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">A propos</p>
          {!isEditingBio && (
            <button onClick={() => setIsEditingBio(true)} className="text-muted-foreground hover:text-foreground">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {isEditingBio ? (
          <div className="mt-2 space-y-2">
            <Input
              autoFocus
              value={bioValue}
              onChange={(e) => setBioValue(e.target.value)}
              placeholder="Parle un peu de toi..."
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => { setIsEditingBio(false); setBioValue(user.bio ?? ""); }}>
                Annuler
              </Button>
              <Button size="sm" onClick={handleSaveBio} disabled={isSaving}>
                Enregistrer
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            {user.bio || "Aucune bio pour le moment."}
          </p>
        )}
      </div>

      <div className="mt-6 space-y-4">
        <CreatePostForm onCreated={handlePostCreated} />

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
    </div>
  );
}
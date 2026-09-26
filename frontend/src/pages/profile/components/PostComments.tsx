import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { postsApi } from "@/api/posts.api";
import { extractErrorMessage } from "@/lib/error-message";
import { useAuthStore } from "@/store/auth.store";
import type { Post, PostComment } from "@/types/models";

interface PostCommentsProps {
  post: Post;
  onCommentAdded: (postId: string, comment: PostComment, newCount: number) => void;
}

export function PostComments({ post, onCommentAdded }: PostCommentsProps) {
  const currentUser = useAuthStore((s) => s.user);
  const [showAll, setShowAll] = useState(false);
  const [allComments, setAllComments] = useState<PostComment[] | null>(null);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [value, setValue] = useState("");
  const [isSending, setIsSending] = useState(false);

  const commentCount = post._count?.comments ?? post.comments.length;
  const lastComment = post.comments[0];

  async function handleShowAll() {
    if (showAll) {
      setShowAll(false);
      return;
    }
    setShowAll(true);
    if (allComments) return;
    setIsLoadingAll(true);
    try {
      const { data } = await postsApi.getComments(post.id);
      setAllComments(data);
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible de charger les commentaires"));
    } finally {
      setIsLoadingAll(false);
    }
  }

  async function handleSend() {
    const trimmed = value.trim();
    if (!trimmed) return;
    setIsSending(true);
    try {
      const { data } = await postsApi.addComment(post.id, trimmed);
      onCommentAdded(post.id, data, commentCount + 1);
      setAllComments((prev) => (prev ? [data, ...prev] : [data]));
      setValue("");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible d'ajouter le commentaire"));
    } finally {
      setIsSending(false);
    }
  }

  const commentsToShow = showAll ? allComments ?? [] : lastComment ? [lastComment] : [];

  return (
    <div className="mt-2 space-y-2 border-t border-border pt-2">
      {commentCount > 0 && !showAll && (
        <button
          onClick={handleShowAll}
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Voir {commentCount > 1 ? `les ${commentCount} commentaires` : "le commentaire"}
        </button>
      )}

      {showAll && commentCount > 1 && (
        <button
          onClick={handleShowAll}
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Masquer les commentaires
        </button>
      )}

      {isLoadingAll && (
        <div className="flex justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="space-y-2">
        {commentsToShow.map((c) => (
          <div key={c.id} className="flex items-start gap-2">
            <UserAvatar src={c.author?.avatarUrl} name={c.author?.username} size="sm" className="h-6 w-6" />
            <div className="rounded-2xl bg-muted px-3 py-1.5 text-xs">
              <span className="font-semibold text-foreground">{c.author?.username}</span>{" "}
              <span className="text-foreground">{c.content}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <UserAvatar src={currentUser?.avatarUrl} name={currentUser?.username} size="sm" className="h-6 w-6" />
        <Input
          placeholder="Ecrire un commentaire..."
          className="h-8 rounded-full bg-muted text-xs"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={isSending}
        />
        <button
          onClick={handleSend}
          disabled={isSending || !value.trim()}
          className="shrink-0 text-primary disabled:opacity-40"
        >
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
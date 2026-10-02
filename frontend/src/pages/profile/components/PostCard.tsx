import { useState } from "react";
import { toast } from "sonner";
import { Heart, MoreHorizontal, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PostComments } from "./PostComments";
import { postsApi } from "@/api/posts.api";
import { extractErrorMessage } from "@/lib/error-message";
import { useAuthStore } from "@/store/auth.store";
import type { Post, PostComment } from "@/types/models";

interface PostCardProps {
  post: Post;
  onDeleted: (postId: string) => void;
  onLikeToggled: (postId: string, liked: boolean) => void;
  onCommentAdded: (postId: string, comment: PostComment, newCount: number) => void;
}

export function PostCard({ post, onDeleted, onLikeToggled, onCommentAdded }: PostCardProps) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [isLiking, setIsLiking] = useState(false);
  const [justLiked, setJustLiked] = useState(false);

  const isOwn = post.authorId === currentUserId;
  const hasLiked = post.likes.some((l) => l.userId === currentUserId);

  const time = new Date(post.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  async function handleLike() {
    if (isLiking) return;
    setIsLiking(true);
    onLikeToggled(post.id, !hasLiked);
    if (!hasLiked) {
      setJustLiked(true);
      setTimeout(() => setJustLiked(false), 300);
    }
    try {
      await postsApi.toggleLike(post.id);
    } catch (error) {
      onLikeToggled(post.id, hasLiked);
      toast.error(extractErrorMessage(error, "Impossible de reagir a cette publication"));
    } finally {
      setIsLiking(false);
    }
  }

  async function handleDelete() {
    try {
      await postsApi.delete(post.id);
      onDeleted(post.id);
      toast.success("Publication supprimee");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible de supprimer la publication"));
    }
  }

  return (
    <div className="animate-message-in rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <UserAvatar src={post.author?.avatarUrl} name={post.author?.username} size="sm" />
          <div>
            <p className="text-sm font-semibold text-foreground">{post.author?.username}</p>
            <p className="text-[11px] text-muted-foreground">{time}</p>
          </div>
        </div>

        {isOwn && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {post.content && <p className="mt-3 text-sm text-foreground">{post.content}</p>}

        {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt="Publication"
          className="mx-auto mt-3 max-h-96 rounded-xl object-contain"
        />
      )}

      <div className="mt-3 flex items-center gap-4">
        <button onClick={handleLike} className="flex items-center gap-1.5 text-sm">
          <Heart
            className={cn(
              "h-5 w-5 transition-colors",
              justLiked && "animate-like-pop",
              hasLiked ? "fill-chatini-rose text-chatini-rose" : "text-muted-foreground"
            )}
          />
          <span className={cn("text-xs font-medium", hasLiked ? "text-chatini-rose" : "text-muted-foreground")}>
            {post.likes.length > 0 ? post.likes.length : "J'adore"}
          </span>
        </button>
      </div>

      <PostComments post={post} onCommentAdded={onCommentAdded} />
    </div>
  );
}
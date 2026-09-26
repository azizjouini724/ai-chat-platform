import { useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { Image as ImageIcon, X, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { messagesApi } from "@/api/messages.api";
import { postsApi } from "@/api/posts.api";
import { extractErrorMessage } from "@/lib/error-message";
import { useAuthStore } from "@/store/auth.store";
import type { Post } from "@/types/models";

interface CreatePostFormProps {
  onCreated: (post: Post) => void;
}

export function CreatePostForm({ onCreated }: CreatePostFormProps) {
  const user = useAuthStore((s) => s.user);
  const [content, setContent] = useState("");
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  function handleImageSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPendingImage(file);
    e.target.value = "";
  }

  async function handlePost() {
    const trimmed = content.trim();
    if (!trimmed && !pendingImage) return;

    setIsPosting(true);
    try {
      let imageUrl: string | undefined;
      if (pendingImage) {
        const { data } = await messagesApi.uploadImage(pendingImage);
        imageUrl = data.url;
      }
      const { data: post } = await postsApi.create({ content: trimmed || undefined, imageUrl });
      onCreated(post);
      setContent("");
      setPendingImage(null);
      toast.success("Publication ajoutee");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible de publier"));
    } finally {
      setIsPosting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-2.5">
        <UserAvatar src={user?.avatarUrl} name={user?.username} size="sm" />
        <div className="flex-1">
          <Input
            placeholder="Quoi de neuf ?"
            className="rounded-full bg-muted"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePost()}
          />

          {pendingImage && (
            <div className="relative mt-2 inline-block">
              <img
                src={URL.createObjectURL(pendingImage)}
                alt="Apercu"
                className="max-h-40 rounded-xl object-cover"
              />
              <button
                onClick={() => setPendingImage(null)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="mt-2 flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
              <ImageIcon className="h-4 w-4" />
              Photo
              <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            </label>

            <Button
              size="sm"
              className="rounded-full"
              onClick={handlePost}
              disabled={isPosting || (!content.trim() && !pendingImage)}
            >
              {isPosting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
              Publier
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
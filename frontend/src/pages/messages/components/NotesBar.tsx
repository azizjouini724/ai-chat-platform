import { useState, useEffect, type ChangeEvent } from "react";
import { toast } from "sonner";
import {
  Plus,
  Smile,
  Laugh,
  Heart,
  Coffee,
  Moon,
  Frown,
  Angry,
  PartyPopper,
  Meh,
  Flame,
  ImagePlus,
  X,
  Loader2,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { notesApi } from "@/api/notes.api";
import { messagesApi } from "@/api/messages.api";
import { extractErrorMessage } from "@/lib/error-message";
import { useAuthStore } from "@/store/auth.store";
import type { Note } from "@/types/models";

const ICON_OPTIONS: { key: string; Icon: LucideIcon; color: string }[] = [
  { key: "smile", Icon: Smile, color: "text-yellow-500" },
  { key: "laugh", Icon: Laugh, color: "text-yellow-500" },
  { key: "heart", Icon: Heart, color: "text-red-500" },
  { key: "coffee", Icon: Coffee, color: "text-amber-700" },
  { key: "moon", Icon: Moon, color: "text-indigo-400" },
  { key: "frown", Icon: Frown, color: "text-blue-400" },
  { key: "angry", Icon: Angry, color: "text-orange-600" },
  { key: "party", Icon: PartyPopper, color: "text-chatini-rose" },
  { key: "meh", Icon: Meh, color: "text-muted-foreground" },
  { key: "flame", Icon: Flame, color: "text-orange-500" },
];

const ICON_MAP: Record<string, { Icon: LucideIcon; color: string }> = Object.fromEntries(
  ICON_OPTIONS.map(({ key, Icon, color }) => [key, { Icon, color }])
);

function NoteIcon({ name, className }: { name?: string | null; className?: string }) {
  if (!name) return null;
  const entry = ICON_MAP[name];
  if (!entry) return null;
  const { Icon, color } = entry;
  return <Icon className={`${color} ${className ?? ""}`} />;
}

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

export function NotesBar() {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const currentUser = useAuthStore((s) => s.user);

  const [notes, setNotes] = useState<Note[]>([]);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [content, setContent] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  function loadNotes() {
    notesApi
      .getFriendsNotes()
      .then((res) => setNotes(res.data))
      .catch(() => {});
  }

  const myNote = notes.find((n) => n.authorId === currentUserId);
  const otherNotes = notes.filter((n) => n.authorId !== currentUserId);

  async function handleImagePick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const { data } = await messagesApi.uploadImage(file);
      setImageUrl(data.url);
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible d'envoyer l'image"));
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  }

  async function handleSend() {
    const trimmed = content.trim();
    if (!trimmed) return;
    setIsSending(true);
    try {
      await notesApi.create({
        content: trimmed,
        emoji: selectedIcon ?? undefined,
        imageUrl: imageUrl ?? undefined,
      });
      toast.success("Note publiée");
      setContent("");
      setSelectedIcon(null);
      setImageUrl(null);
      setIsComposeOpen(false);
      loadNotes();
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible de publier la note"));
    } finally {
      setIsSending(false);
    }
  }

  async function handleDeleteNote() {
    setIsDeleting(true);
    try {
      await notesApi.deleteMine();
      setViewingNote(null);
      loadNotes();
      toast.success("Note supprimée");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible de supprimer la note"));
    } finally {
      setIsDeleting(false);
    }
  }

  function NoteBubble({ note }: { note: Note }) {
    return (
      <div className="relative mb-1 max-w-[76px] rounded-2xl rounded-bl-sm border border-border bg-card px-2 py-1 shadow-sm">
        <div className="flex items-center gap-1">
          {note.emoji && <NoteIcon name={note.emoji} className="h-3 w-3 shrink-0" />}
          <p className="truncate text-[10px] leading-tight text-foreground">
            {truncate(note.content, 14)}
          </p>
        </div>
      </div>
    );
  }

  const isViewingOwnNote = viewingNote?.authorId === currentUserId;

  return (
    <div className="border-b border-border">
      <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Notes
      </p>

      <div className="flex gap-3 overflow-x-auto px-4 py-3">
        {/* Ma bulle : soit "ajouter", soit ma note active */}
        <button
          type="button"
          onClick={() => (myNote ? setViewingNote(myNote) : setIsComposeOpen(true))}
          className="flex w-16 shrink-0 flex-col items-center text-center"
        >
          {myNote && <NoteBubble note={myNote} />}
          <div className="relative">
            <UserAvatar
              src={currentUser?.avatarUrl}
              name={currentUser?.username}
              size="md"
              className={myNote ? "ring-2 ring-primary" : ""}
            />
            {!myNote && (
              <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Plus className="h-3 w-3" />
              </div>
            )}
          </div>
          <span className="mt-1 w-full truncate text-[11px] text-muted-foreground">
            {myNote ? "Ma note" : "Ajouter"}
          </span>
        </button>

        {otherNotes.map((note) => (
          <button
            key={note.id}
            type="button"
            onClick={() => setViewingNote(note)}
            className="flex w-16 shrink-0 flex-col items-center text-center"
          >
            <NoteBubble note={note} />
            <UserAvatar
              src={note.author.avatarUrl}
              name={note.author.username}
              size="md"
              className="ring-2 ring-primary"
            />
            <span className="mt-1 w-full truncate text-[11px] text-muted-foreground">
              {note.author.username}
            </span>
          </button>
        ))}
      </div>

      {/* Composer une note */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nouvelle note</DialogTitle>
          </DialogHeader>

          <Input
            autoFocus
            placeholder="Quoi de neuf ?"
            maxLength={60}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {imageUrl ? (
            <div className="relative mt-2">
              <img src={imageUrl} alt="" className="mx-auto max-h-52 rounded-xl object-contain" />
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <label className="mt-2 flex w-fit cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted">
              {isUploadingImage ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ImagePlus className="h-3.5 w-3.5" />
              )}
              Ajouter une photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImagePick}
                disabled={isUploadingImage}
              />
            </label>
          )}

          <div className="mt-2 flex flex-wrap gap-1.5">
            {ICON_OPTIONS.map(({ key, Icon, color }) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedIcon((prev) => (prev === key ? null : key))}
                className={`rounded-full p-2 transition-colors ${color} ${
                  selectedIcon === key ? "bg-primary/20" : "hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            Visible par tes amis pendant 24h
          </p>

          <DialogFooter className="mt-2">
            <Button
              className="w-full rounded-full"
              onClick={handleSend}
              disabled={isSending || isUploadingImage || !content.trim()}
            >
              {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Publier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Voir la note complète (avec photo si présente) */}
      <Dialog open={!!viewingNote} onOpenChange={(open) => !open && setViewingNote(null)}>
        <DialogContent className="max-w-xs">
          {viewingNote && (
            <div className="flex flex-col items-center text-center">
              <UserAvatar
                src={viewingNote.author.avatarUrl}
                name={viewingNote.author.username}
                size="lg"
              />
              <p className="mt-2 font-medium text-foreground">{viewingNote.author.username}</p>

              {viewingNote.imageUrl && (
                <img
                  src={viewingNote.imageUrl}
                  alt=""
                  className="mx-auto mt-3 max-h-72 rounded-xl object-contain"
                />
              )}

              <div className="mt-3 flex items-center justify-center gap-1.5">
                {viewingNote.emoji && (
                  <NoteIcon name={viewingNote.emoji} className="h-5 w-5" />
                )}
                <p className="text-lg text-foreground">{viewingNote.content}</p>
              </div>

              {isViewingOwnNote && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full rounded-full text-destructive hover:text-destructive"
                  onClick={handleDeleteNote}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Supprimer ma note
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
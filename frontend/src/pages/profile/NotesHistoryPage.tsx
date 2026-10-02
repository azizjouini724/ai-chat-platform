import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { notesApi } from "@/api/notes.api";
import type { Note } from "@/types/models";

interface NotesHistoryPageProps {
  onBack: () => void;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotesHistoryPage({ onBack }: NotesHistoryPageProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    notesApi
      .getMyHistory()
      .then((res) => setNotes(res.data))
      .catch(() => toast.error("Impossible de charger l'historique des notes"))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="animate-view-fade mx-auto h-full max-w-2xl overflow-y-auto p-6">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au profil
      </button>

      <h2 className="font-heading text-xl font-bold text-foreground">Mes notes</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Historique de toutes tes notes, même expirées.
      </p>

      {isLoading ? (
        <div className="mt-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : notes.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">Tu n'as encore publié aucune note</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {notes.map((note) => {
            const isExpired = new Date(note.expiresAt).getTime() <= Date.now();
            return (
              <div key={note.id} className="rounded-2xl border border-border bg-card p-4">
                {note.imageUrl && (
                  <img
                    src={note.imageUrl}
                    alt=""
                    className="mx-auto max-h-48 rounded-xl object-contain"
                  />
                )}
                <p className="mt-2 text-sm text-foreground">{note.content}</p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{formatDate(note.createdAt)}</span>
                  <span className={isExpired ? "" : "font-medium text-primary"}>
                    {isExpired ? "Expirée" : "Active"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
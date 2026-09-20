import { useState } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { messagesApi } from "@/api/messages.api";
import { extractErrorMessage } from "@/lib/error-message";
import { toast } from "sonner";
import type { Message } from "@/types/models";

interface ConversationSearchProps {
  conversationId: string;
  onClose: () => void;
  onJumpToMessage: (messageId: string) => void;
}

export function ConversationSearch({ conversationId, onClose, onJumpToMessage }: ConversationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  let debounceRef: ReturnType<typeof setTimeout>;

  function handleChange(value: string) {
    setQuery(value);
    clearTimeout(debounceRef);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await messagesApi.search(conversationId, value.trim());
        setResults(data);
      } catch (error) {
        toast.error(extractErrorMessage(error, "Erreur lors de la recherche"));
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="animate-view-fade flex h-full w-80 shrink-0 flex-col border-l border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Rechercher dans la conversation..."
            className="rounded-full bg-muted pl-9"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
          />
        </div>
        <button onClick={onClose} className="shrink-0 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        {isSearching && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isSearching && query.trim().length >= 2 && results.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Aucun resultat</p>
        )}

        <div className="space-y-1 p-2">
          {results.map((m) => (
            <button
              key={m.id}
              onClick={() => onJumpToMessage(m.id)}
              className="flex w-full flex-col items-start rounded-xl p-3 text-left hover:bg-muted"
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">
                  {m.sender?.username ?? "Utilisateur"}
                </span>
                <span className="shrink-0 text-[10px] text-muted-foreground">{formatDate(m.createdAt)}</span>
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{m.content}</p>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
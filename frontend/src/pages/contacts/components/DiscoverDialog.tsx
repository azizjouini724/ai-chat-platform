import { useState } from "react";
import { Search, Loader2, UserPlus, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { usersApi } from "@/api/users.api";
import { friendsApi } from "@/api/friends.api";
import { useAuthStore } from "@/store/auth.store";
import type { User } from "@/types/models";

interface DiscoverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectedIds: Set<string>; // amis existants + demandes envoyées + demandes reçues
}

export function DiscoverDialog({ open, onOpenChange, connectedIds }: DiscoverDialogProps) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [justSentIds, setJustSentIds] = useState<Set<string>>(new Set());

  async function handleSearch(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const { data } = await usersApi.search(value.trim());
      setResults(data.filter((u) => u.id !== currentUserId));
    } catch {
      toast.error("Erreur lors de la recherche");
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSendRequest(userId: string) {
    try {
      await friendsApi.sendRequest(userId);
      setJustSentIds((prev) => new Set(prev).add(userId));
      toast.success("Demande envoyée");
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Impossible d'envoyer la demande");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Trouver un Spark</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Rechercher par nom d'utilisateur..."
            className="rounded-full pl-9"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <ScrollArea className="h-72">
          {isSearching && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isSearching && query.trim().length >= 2 && results.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Aucun utilisateur trouvé</p>
          )}

          <div className="space-y-2">
            {results.map((user) => {
              const isConnected = connectedIds.has(user.id) || justSentIds.has(user.id);
              return (
                <div key={user.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/50">
                  <UserAvatar src={user.avatarUrl} name={user.username} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{user.username}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={isConnected ? "secondary" : "default"}
                    className="rounded-full shrink-0"
                    disabled={isConnected}
                    onClick={() => handleSendRequest(user.id)}
                  >
                    {isConnected ? <Check className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
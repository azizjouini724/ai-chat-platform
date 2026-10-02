import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, UserPlus, Check, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { friendsApi } from "@/api/friends.api";
import { conversationsApi } from "@/api/conversations.api";
import { extractErrorMessage } from "@/lib/error-message";
import { useConversationsStore } from "@/store/conversations.store";
import type { User } from "@/types/models";

interface AddGroupMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  existingMemberIds: string[];
  isAdmin: boolean;
}

export function AddGroupMemberDialog({
  open,
  onOpenChange,
  conversationId,
  existingMemberIds,
  isAdmin,
}: AddGroupMemberDialogProps) {
  const [friends, setFriends] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [proposedIds, setProposedIds] = useState<Set<string>>(new Set());
  const addMember = useConversationsStore((s) => s.addMember);

    useEffect(() => {
    if (!open) return;
    // Repart à zéro à chaque ouverture : une proposition refusée entre-temps
    // ne doit pas rester bloquée indéfiniment sur "en attente"
    setAddedIds(new Set());
    setProposedIds(new Set());
    setIsLoading(true);
    friendsApi
      .getFriends()
      .then((res) => setFriends(res.data))
      .catch(() => toast.error("Impossible de charger tes amis"))
      .finally(() => setIsLoading(false));
  }, [open]);

  async function handleAdd(user: User) {
    setAddingIds((prev) => new Set(prev).add(user.id));
    try {
      if (isAdmin) {
        await conversationsApi.addMember(conversationId, user.id);
        addMember(conversationId, {
          id: `${conversationId}-${user.id}`,
          conversationId,
          userId: user.id,
          role: "MEMBER",
          user,
          joinedAt: new Date().toISOString(),
        });
        setAddedIds((prev) => new Set(prev).add(user.id));
        toast.success(`${user.username} ajouté au groupe`);
      } else {
        await conversationsApi.proposeMember(conversationId, user.id);
        setProposedIds((prev) => new Set(prev).add(user.id));
        toast.success(`Proposition envoyée pour ${user.username}`);
      }
    } catch (error) {
      toast.error(
        extractErrorMessage(
          error,
          isAdmin ? "Impossible d'ajouter ce membre" : "Impossible de proposer ce membre"
        )
      );
    } finally {
      setAddingIds((prev) => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
    }
  }

  const availableFriends = friends.filter((f) => !existingMemberIds.includes(f.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            {isAdmin ? "Ajouter des membres" : "Proposer des membres"}
          </DialogTitle>
        </DialogHeader>

        {!isAdmin && (
          <p className="-mt-2 text-xs text-muted-foreground">
            Un admin devra valider ta proposition avant que la personne rejoigne le groupe.
          </p>
        )}

        <ScrollArea className="h-72">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-1">
              {availableFriends.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Tous tes amis sont déjà dans ce groupe
                </p>
              )}
              {availableFriends.map((user) => {
                const isAdding = addingIds.has(user.id);
                const isAdded = addedIds.has(user.id);
                const isProposed = proposedIds.has(user.id);
                const isDisabled = isAdding || isAdded || isProposed;
                return (
                  <div key={user.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/50">
                    <UserAvatar src={user.avatarUrl} name={user.username} size="sm" />
                    <span className="flex-1 truncate text-sm font-medium text-foreground">
                      {user.username}
                    </span>
                    <Button
                      size="sm"
                      variant={isDisabled ? "secondary" : "default"}
                      className="rounded-full"
                      disabled={isDisabled}
                      onClick={() => handleAdd(user)}
                    >
                      {isAdding ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isAdded ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : isProposed ? (
                        <Clock className="h-3.5 w-3.5" />
                      ) : (
                        <UserPlus className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { conversationsApi } from "@/api/conversations.api";
import { extractErrorMessage } from "@/lib/error-message";
import type { User } from "@/types/models";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friends: User[];
  onCreated: (conversationId: string) => void;
}

export function CreateGroupDialog({ open, onOpenChange, friends, onCreated }: CreateGroupDialogProps) {
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);

  function toggleMember(userId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function reset() {
    setName("");
    setSelectedIds(new Set());
  }

  async function handleCreate() {
    if (name.trim().length < 2) {
      toast.error("Le nom du groupe doit faire au moins 2 caractères");
      return;
    }
    if (selectedIds.size < 2) {
      toast.error("Choisis au moins 2 amis pour créer un groupe");
      return;
    }

    setIsCreating(true);
    try {
      const { data } = await conversationsApi.createGroup({
        name: name.trim(),
        memberIds: [...selectedIds],
      });
      toast.success("Groupe créé");
      onCreated(data.id);
      onOpenChange(false);
      reset();
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible de créer le groupe"));
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Nouveau groupe
          </DialogTitle>
        </DialogHeader>

        <Input
          placeholder="Nom du groupe"
          className="rounded-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <p className="text-xs text-muted-foreground">
          Sélectionne au moins 2 amis ({selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""})
        </p>

        <ScrollArea className="h-64">
          <div className="space-y-1">
            {friends.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Tu n'as pas encore d'amis à ajouter
              </p>
            )}
            {friends.map((friend) => (
              <label
                key={friend.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl p-2 hover:bg-muted/50"
              >
                <Checkbox
                  checked={selectedIds.has(friend.id)}
                  onCheckedChange={() => toggleMember(friend.id)}
                />
                <UserAvatar src={friend.avatarUrl} name={friend.username} size="sm" />
                <span className="text-sm font-medium text-foreground">{friend.username}</span>
              </label>
            ))}
          </div>
        </ScrollArea>

        <Button className="w-full rounded-full" onClick={handleCreate} disabled={isCreating}>
          {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Créer le groupe
        </Button>
      </DialogContent>
    </Dialog>
  );
}
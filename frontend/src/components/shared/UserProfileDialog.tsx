import { Dialog, DialogContent } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/shared/UserAvatar";
import type { User } from "@/types/models";

interface UserProfileDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileDialog({ user, open, onOpenChange }: UserProfileDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <div className="flex flex-col items-center pt-2 text-center">
          <UserAvatar src={user.avatarUrl} name={user.username} isOnline={user.isOnline} size="lg" />
          <h2 className="mt-3 font-heading text-lg font-semibold text-foreground">
            {user.username}
          </h2>
          {user.bio && <p className="mt-1 text-sm text-muted-foreground">{user.bio}</p>}
          <div className="mt-4 w-full rounded-xl bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
            Les amis en commun ne sont pas encore disponibles.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
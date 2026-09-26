import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useProfileNavigationStore } from "@/store/profile-navigation.store";
import { useAuthStore } from "@/store/auth.store";
import { friendsApi } from "@/api/friends.api";
import type { User } from "@/types/models";

interface UserProfileDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_AVATARS = 5;

export function UserProfileDialog({ user, open, onOpenChange }: UserProfileDialogProps) {
  const openProfile = useProfileNavigationStore((s) => s.openProfile);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [mutualFriends, setMutualFriends] = useState<User[]>([]);
  const [isLoadingMutual, setIsLoadingMutual] = useState(false);

  useEffect(() => {
    if (!open || !user || user.id === currentUserId) {
      setMutualFriends([]);
      return;
    }
    setIsLoadingMutual(true);
    friendsApi
      .getMutualFriends(user.id)
      .then(({ data }) => setMutualFriends(data))
      .catch(() => setMutualFriends([]))
      .finally(() => setIsLoadingMutual(false));
  }, [open, user, currentUserId]);

  if (!user) return null;

  function handleViewFullProfile() {
    onOpenChange(false);
    openProfile(user!.id);
  }

  const visibleMutuals = mutualFriends.slice(0, MAX_AVATARS);
  const remainingCount = mutualFriends.length - visibleMutuals.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <div className="flex flex-col items-center pt-2 text-center">
          <UserAvatar src={user.avatarUrl} name={user.username} isOnline={user.isOnline} size="lg" className="h-28 w-28" />
          <h2 className="mt-3 font-heading text-lg font-semibold text-foreground">
            {user.username}
          </h2>
          {user.bio && <p className="mt-1 text-sm text-muted-foreground">{user.bio}</p>}

          <div className="mt-4 flex w-full items-center justify-center rounded-xl bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
            {isLoadingMutual ? (
              "Chargement..."
            ) : mutualFriends.length === 0 ? (
              "Aucun ami en commun"
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {visibleMutuals.map((friend) => (
                    <UserAvatar
                      key={friend.id}
                      src={friend.avatarUrl}
                      name={friend.username}
                      size="sm"
                      className="h-6 w-6 border-2 border-background"
                    />
                  ))}
                  {remainingCount > 0 && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium text-foreground">
                      +{remainingCount}
                    </div>
                  )}
                </div>
                <span>
                  {mutualFriends.length} ami{mutualFriends.length > 1 ? "s" : ""} en commun
                </span>
              </div>
            )}
          </div>

          <Button
            variant="secondary"
            className="mt-4 w-full rounded-full"
            onClick={handleViewFullProfile}
          >
            Voir profil
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
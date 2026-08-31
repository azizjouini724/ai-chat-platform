import { useState } from "react";
import { Check, X } from "lucide-react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { UserProfileDialog } from "@/components/shared/UserProfileDialog";
import { Button } from "@/components/ui/button";
import type { Friendship } from "@/types/models";

interface FriendRequestCardProps {
  friendship: Friendship;
  variant: "incoming" | "sent";
  onAccept?: () => void;
  onDecline?: () => void;
}

export function FriendRequestCard({ friendship, variant, onAccept, onDecline }: FriendRequestCardProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const user = variant === "incoming" ? friendship.sender : friendship.receiver;

  return (
    <>
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <UserAvatar
          src={user?.avatarUrl}
          name={user?.username}
          size="md"
          onClick={() => setProfileOpen(true)}
        />
        <div className="flex-1 min-w-0">
          <p className="truncate font-medium text-foreground">{user?.username}</p>
          <p className="text-xs text-muted-foreground">
            {variant === "sent" ? "Demande envoyée" : "Souhaite rejoindre ton ciel"}
          </p>
        </div>

        {variant === "incoming" ? (
          <div className="flex gap-2 shrink-0">
            <Button size="icon" className="h-8 w-8 rounded-full" onClick={onAccept}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={onDecline}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
            En attente
          </span>
        )}
      </div>

      <UserProfileDialog user={user ?? null} open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
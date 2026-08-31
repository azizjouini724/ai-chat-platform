import { useState } from "react";
import { MoreHorizontal, MessageSquare } from "lucide-react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { UserProfileDialog } from "@/components/shared/UserProfileDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "@/types/models";

interface FriendCardProps {
  user: User;
  onChat: (userId: string) => void;
  onBlock: (userId: string) => void;
}

export function FriendCard({ user, onChat, onBlock }: FriendCardProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-5 text-center shadow-sm transition-shadow hover:shadow-md">
        <UserAvatar
          src={user.avatarUrl}
          name={user.username}
          isOnline={user.isOnline}
          size="lg"
          onClick={() => setProfileOpen(true)}
        />
        <p className="mt-3 font-heading font-semibold text-foreground">{user.username}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
          {user.bio || (user.isOnline ? "En ligne" : "Hors ligne")}
        </p>

        <div className="mt-4 flex w-full items-center gap-2">
          <Button size="sm" className="flex-1 rounded-full" onClick={() => onChat(user.id)}>
            <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
            Chat
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onBlock(user.id)} className="text-destructive">
                Bloquer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <UserProfileDialog user={user} open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
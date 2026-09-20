import { useState } from "react";
import { MoreVertical } from "lucide-react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { UserProfileDialog } from "@/components/shared/UserProfileDialog";
import { GroupInfoDialog } from "./GroupInfoDialog";
import { Button } from "@/components/ui/button";
import { formatLastSeen } from "@/lib/relative-time";
import { getConversationDisplayInfo } from "@/lib/conversation-utils";
import { useAuthStore } from "@/store/auth.store";
import { usePresenceStore } from "@/store/presence.store";
import type { Conversation } from "@/types/models";
import { Search } from "lucide-react";
interface ConversationHeaderProps {
  conversation: Conversation;
  onGroupLeft: () => void;
  onOpenSearch: () => void;
}

export function ConversationHeader({ conversation, onGroupLeft, onOpenSearch }: ConversationHeaderProps) {


  const currentUserId = useAuthStore((s) => s.user?.id);
  const onlineUserIds = usePresenceStore((s) => s.onlineUserIds);
  const typingByConversation = usePresenceStore((s) => s.typingByConversation);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);

  const { name, avatarUrl, otherUserId, otherUserLastSeenAt } = getConversationDisplayInfo(conversation, currentUserId);
  const isOnline = otherUserId ? onlineUserIds.has(otherUserId) : undefined;
  const typingUserIds = typingByConversation[conversation.id];
  const isOtherTyping = otherUserId ? typingUserIds?.has(otherUserId) : false;

  const otherMember = conversation.members.find((m) => m.userId !== currentUserId);
  const otherUser = otherMember?.user;
  const isGroup = conversation.type === "GROUP";

  return (
    <div className="flex items-center justify-between border-b border-border px-5 py-3">
      <div className="flex items-center gap-3">
        <UserAvatar
          src={avatarUrl}
          name={name}
          isOnline={!isGroup ? isOnline : undefined}
          size="sm"
          className="cursor-pointer"
          onClick={() => (isGroup ? setIsGroupInfoOpen(true) : setIsProfileOpen(true))}
        />
        <div>
          <p className="font-heading text-sm font-semibold text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">
            {isGroup ? (
              `${conversation.members.length} membres`
            ) : isOtherTyping ? (
              <span className="flex items-center gap-1 text-primary">
                est en train d'écrire
                <span className="flex gap-0.5">
                  <span className="animate-typing-dot h-1 w-1 rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
                  <span className="animate-typing-dot h-1 w-1 rounded-full bg-primary" style={{ animationDelay: "150ms" }} />
                  <span className="animate-typing-dot h-1 w-1 rounded-full bg-primary" style={{ animationDelay: "300ms" }} />
                </span>
              </span>
            ) :  isOnline === undefined ? (
              "\u00A0"  
            ) : isOnline ? (
              "En ligne"
            ) : (
              formatLastSeen(otherUserLastSeenAt)
            )}
          </p>
        </div>
      </div>

      <Button size="icon" variant="ghost" className="rounded-full" onClick={onOpenSearch}>
        <Search className="h-4 w-4" />
      </Button>

      {!isGroup && (
        <UserProfileDialog user={otherUser ?? null} open={isProfileOpen} onOpenChange={setIsProfileOpen} />
      )}

      {isGroup && (
        <GroupInfoDialog
          conversation={conversation}
          open={isGroupInfoOpen}
          onOpenChange={setIsGroupInfoOpen}
          onLeft={onGroupLeft}
        />
      )}
    </div>
  );
}
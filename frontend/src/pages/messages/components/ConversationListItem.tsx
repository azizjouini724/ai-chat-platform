import { UserAvatar } from "@/components/shared/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getConversationDisplayInfo, getLastMessagePreview } from "@/lib/conversation-utils";
import { useAuthStore } from "@/store/auth.store";
import { usePresenceStore } from "@/store/presence.store";
import type { Conversation } from "@/types/models";

interface ConversationListItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationListItem({ conversation, isActive, onClick }: ConversationListItemProps) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const onlineUserIds = usePresenceStore((s) => s.onlineUserIds);
  const { name, avatarUrl, otherUserId } = getConversationDisplayInfo(conversation, currentUserId);
  const isOnline = otherUserId ? onlineUserIds.has(otherUserId) : undefined;
  const preview = getLastMessagePreview(conversation);
  const hasUnread = (conversation.unreadCount ?? 0) > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all duration-200 hover:scale-[1.01]",
        isActive ? "bg-primary/10" : "hover:bg-muted/60"
      )}
    >
      <UserAvatar src={avatarUrl} name={name} isOnline={isOnline} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{name}</p>
        <p className={cn("truncate text-xs", hasUnread ? "font-semibold text-foreground" : "text-muted-foreground")}>
          {preview}
        </p>
      </div>
      {hasUnread && (
        <Badge className="h-5 min-w-5 shrink-0 justify-center rounded-full px-1.5">
          {conversation.unreadCount}
        </Badge>
      )}
    </button>
  );
}
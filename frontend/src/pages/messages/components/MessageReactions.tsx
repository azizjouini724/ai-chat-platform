import { cn } from "@/lib/utils";
import { getReactionOption } from "@/lib/reactions";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { MessageReaction } from "@/types/models";

interface MessageReactionsProps {
  reactions: MessageReaction[];
  currentUserId?: string;
  onToggle: (key: string) => void;
}

export function MessageReactions({ reactions, currentUserId, onToggle }: MessageReactionsProps) {
  if (reactions.length === 0) return null;

  const grouped = reactions.reduce<Record<string, MessageReaction[]>>((acc, r) => {
    acc[r.emoji] = acc[r.emoji] ? [...acc[r.emoji], r] : [r];
    return acc;
  }, {});

  return (
    <div className="flex flex-wrap gap-1">
      {Object.entries(grouped).map(([key, list]) => {
        const option = getReactionOption(key);
        if (!option) return null;
        const Icon = option.icon;
        const hasMine = list.some((r) => r.userId === currentUserId);
        const names = list.map((r) => r.user?.username).filter(Boolean).join(", ");

        return (
          <Tooltip key={key}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onToggle(key)}
                className={cn(
                  "animate-reaction-pop flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs transition-colors",
                  hasMine
                    ? "border-primary/40 bg-primary/10"
                    : "border-border bg-muted/60 hover:bg-muted"
                )}
              >
                <Icon className={cn("h-4 w-4", option.colorClass)} />
                <span className="font-medium text-foreground">{list.length}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {option.label} — {names}
              </p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
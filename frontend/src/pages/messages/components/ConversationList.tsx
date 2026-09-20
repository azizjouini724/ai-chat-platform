import { useMemo, useState } from "react";
import { Search, UsersRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConversationListItem } from "./ConversationListItem";
import { getConversationDisplayInfo } from "@/lib/conversation-utils";
import { useAuthStore } from "@/store/auth.store";
import type { Conversation } from "@/types/models";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateGroup: () => void;
}

export function ConversationList({ conversations, selectedId, onSelect, onCreateGroup }: ConversationListProps) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      if (filter === "unread" && !((c.unreadCount ?? 0) > 0)) return false;
      if (search.trim()) {
        const { name } = getConversationDisplayInfo(c, currentUserId);
        return name.toLowerCase().includes(search.trim().toLowerCase());
      }
      return true;
    });
  }, [conversations, search, filter, currentUserId]);

  return (
    <div className="flex h-full min-h-0 w-80 shrink-0 flex-col border-r border-border">
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search the sky..."
              className="rounded-full bg-muted pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button size="icon" variant="secondary" className="shrink-0 rounded-full" onClick={onCreateGroup} title="Nouveau groupe">
            <UsersRound className="h-4 w-4" />
          </Button>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
          <TabsList className="w-full rounded-full bg-muted p-1">
            <TabsTrigger value="all" className="flex-1 rounded-full">Tous</TabsTrigger>
            <TabsTrigger value="unread" className="flex-1 rounded-full">Non lus</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-3 pb-3">
        <div className="space-y-1">
          {filtered.length === 0 && (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
              Aucune conversation
            </p>
          )}
          {filtered.map((c) => (
            <ConversationListItem
              key={c.id}
              conversation={c}
              isActive={c.id === selectedId}
              onClick={() => onSelect(c.id)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
import { useEffect, useCallback, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ConversationList } from "./components/ConversationList";
import { EmptyConversation } from "./components/EmptyConversation";
import { ChatWindow } from "./components/ChatWindow";
import { CreateGroupDialog } from "./components/CreateGroupDialog";
import { conversationsApi } from "@/api/conversations.api";
import { friendsApi } from "@/api/friends.api";
import { extractErrorMessage } from "@/lib/error-message";
import { useConversationsStore } from "@/store/conversations.store";
import type { User } from "@/types/models";
import { ConversationListSkeleton } from "./components/ConversationListSkeleton";


interface MessagesPageProps {
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

export function MessagesPage({ selectedConversationId, onSelectConversation }: MessagesPageProps) {
  const conversations = useConversationsStore((s) => s.conversations);
  const setConversations = useConversationsStore((s) => s.setConversations);
  const [isLoading, setIsLoading] = useState(true);
  const [friends, setFriends] = useState<User[]>([]);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const removeConversation = useConversationsStore((s) => s.removeConversation);

function handleGroupLeft() {
  if (selectedConversationId) {
    removeConversation(selectedConversationId);
  }
  onSelectConversation(""); // désélectionne, revient à l'état vide
}

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await conversationsApi.getAll();
      setConversations(data);
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible de charger tes conversations"));
    } finally {
      setIsLoading(false);
    }
  }, [setConversations]);

  useEffect(() => {
    loadConversations();
    friendsApi.getFriends().then((res) => setFriends(res.data)).catch(() => {});
  }, [loadConversations]);

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId) ?? null;

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0">
        <div className="flex h-full w-80 shrink-0 flex-col border-r border-border py-4">
          <ConversationListSkeleton />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0">
      <ConversationList
        conversations={conversations}
        selectedId={selectedConversationId}
        onSelect={onSelectConversation}
        onCreateGroup={() => setIsCreateGroupOpen(true)}
      />

      {selectedConversation ? (
        <ChatWindow conversation={selectedConversation} onGroupLeft={handleGroupLeft} />
      ) : (
        <EmptyConversation />
      )}

      <CreateGroupDialog
        open={isCreateGroupOpen}
        onOpenChange={setIsCreateGroupOpen}
        friends={friends}
        onCreated={(conversationId) => {
          loadConversations();
          onSelectConversation(conversationId);
        }}
      />
    </div>
  );
}
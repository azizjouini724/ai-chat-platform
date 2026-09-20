import { useState, useEffect } from "react";
import { AppLayout } from "@/layouts/AppLayout";
import { AuthFlow } from "@/pages/auth/AuthFlow";
import { ContactsPage } from "@/pages/contacts/ContactsPage";
import { MessagesPage } from "@/pages/messages/MessagesPage";
import { useAuthStore } from "@/store/auth.store";
import { useSocketConnection } from "@/hooks/useSocketConnection";
import type { ActiveView } from "@/components/layout/Sidebar";
import { unlockAudio } from "@/lib/notification-sound";

function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [activeView, setActiveView] = useState<ActiveView>("messages");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  useSocketConnection(activeView === "messages" ? selectedConversationId : null);

  useEffect(() => {
    const unlock = () => {
      unlockAudio();
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("click", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  if (!isAuthenticated) {
    return <AuthFlow />;
  }

  function handleOpenChat(conversationId: string) {
    setSelectedConversationId(conversationId);
    setActiveView("messages");
  }

  return (
    <AppLayout activeView={activeView} onChangeView={setActiveView}>
      <div key={activeView} className="animate-view-fade h-full">
        {activeView === "messages" && (
          <MessagesPage
            selectedConversationId={selectedConversationId}
            onSelectConversation={setSelectedConversationId}
          />
        )}
        {activeView === "contacts" && <ContactsPage onOpenChat={handleOpenChat} />}
        {activeView === "settings" && (
          <div className="p-6 text-muted-foreground">Page Settings (prochain module)</div>
        )}
      </div>
    </AppLayout>
  );
}

export default App;
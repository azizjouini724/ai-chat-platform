import { useState, useEffect } from "react";
import { AppLayout } from "@/layouts/AppLayout";
import { AuthFlow } from "@/pages/auth/AuthFlow";
import { ContactsPage } from "@/pages/contacts/ContactsPage";
import { MessagesPage } from "@/pages/messages/MessagesPage";
import { MyProfilePage } from "@/pages/profile/MyProfilePage";
import { OtherUserProfilePage } from "@/pages/profile/OtherUserProfilePage";
import { useAuthStore } from "@/store/auth.store";
import { useSocketConnection } from "@/hooks/useSocketConnection";
import { useProfileNavigationStore } from "@/store/profile-navigation.store";
import type { ActiveView } from "@/components/layout/Sidebar";
import { unlockAudio } from "@/lib/notification-sound";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { NotesHistoryPage } from "@/pages/profile/NotesHistoryPage";

function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [activeView, setActiveView] = useState<ActiveView>("messages");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const openProfileUserId = useProfileNavigationStore((s) => s.openProfileUserId);
  const closeProfile = useProfileNavigationStore((s) => s.closeProfile);
  const openProfile = useProfileNavigationStore((s) => s.openProfile);
  const [isNotesHistoryOpen, setIsNotesHistoryOpen] = useState(false);

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
    closeProfile();
    setSelectedConversationId(conversationId);
    setActiveView("messages");
  }

  return (
    <AppLayout
          activeView={activeView}
          onChangeView={(view) => { closeProfile(); setActiveView(view); }}
          onProfileClick={() => currentUserId && openProfile(currentUserId)}
          isProfileActive={!!openProfileUserId && openProfileUserId === currentUserId}
        >
        {openProfileUserId ? (
        openProfileUserId === currentUserId ? (
          isNotesHistoryOpen ? (
            <NotesHistoryPage onBack={() => setIsNotesHistoryOpen(false)} />
          ) : (
            <MyProfilePage onBack={closeProfile} onOpenNotesHistory={() => setIsNotesHistoryOpen(true)} />
          )
        ) : (
          <OtherUserProfilePage userId={openProfileUserId} onBack={closeProfile} onOpenChat={handleOpenChat} />
        )
      ) : (
        <div key={activeView} className="animate-view-fade h-full">
          {activeView === "messages" && (
            <MessagesPage
              selectedConversationId={selectedConversationId}
              onSelectConversation={setSelectedConversationId}
            />
          )}
          {activeView === "contacts" && <ContactsPage onOpenChat={handleOpenChat} />}
          {activeView === "settings" && <SettingsPage />}
        </div>
      )}
    </AppLayout>
  );
}

export default App;
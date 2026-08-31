import { AppLayout } from "@/layouts/AppLayout";
import { AuthFlow } from "@/pages/auth/AuthFlow";
import { ContactsPage } from "@/pages/contacts/ContactsPage";
import { useAuthStore } from "@/store/auth.store";

function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <AuthFlow />;
  }

  return (
    <AppLayout>
      {(activeView) => {
        if (activeView === "contacts") {
          return (
            <ContactsPage
              onOpenChat={(conversationId) => {
                // TODO: basculer vers la vue Messages avec cette conversation ouverte (prochain module)
                console.log("Ouvrir conversation:", conversationId);
              }}
            />
          );
        }
        return (
          <div className="p-6 text-muted-foreground">
            Vue active : <span className="font-medium text-foreground">{activeView}</span>
            <p className="mt-2 text-sm">(La vraie page arrive au prochain module 🙂)</p>
          </div>
        );
      }}
    </AppLayout>
  );
}

export default App;
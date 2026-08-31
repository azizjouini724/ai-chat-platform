import { useState, type ReactNode } from "react";
import { Sidebar, type ActiveView } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useAuthStore } from "@/store/auth.store";

const viewTitles: Record<ActiveView, string> = {
  messages: "Messages",
  contacts: "Contacts",
  "ai-tools": "AI Magic Tools",
  settings: "Settings",
};

interface AppLayoutProps {
  children: (activeView: ActiveView) => ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [activeView, setActiveView] = useState<ActiveView>("messages");
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar active={activeView} onChange={setActiveView} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={viewTitles[activeView]} onLogout={logout} />
        <main className="flex-1 overflow-y-auto">{children(activeView)}</main>
      </div>
    </div>
  );
}
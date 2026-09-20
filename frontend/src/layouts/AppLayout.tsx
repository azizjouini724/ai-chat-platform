import type { ReactNode } from "react";
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
  activeView: ActiveView;
  onChangeView: (view: ActiveView) => void;
  children: ReactNode;
}

export function AppLayout({ activeView, onChangeView, children }: AppLayoutProps) {
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar active={activeView} onChange={onChangeView} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={viewTitles[activeView]} onLogout={logout} />
        <main className="flex-1 overflow-hidden min-h-0">{children}</main>
      </div>
    </div>
  );
}
import { MessageSquare, Users, Sparkles, Settings, Lock, Cloud } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

export type ActiveView = "messages" | "contacts" | "ai-tools" | "settings";

interface SidebarProps {
  active: ActiveView;
  onChange: (view: ActiveView) => void;
}

const navItems: { id: ActiveView; label: string; icon: typeof MessageSquare; locked?: boolean }[] = [
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "ai-tools", label: "AI Tools", icon: Sparkles, locked: true },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ active, onChange }: SidebarProps) {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar px-4 py-5">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2 px-2">
        <img src={logo} alt="Chatini" className="h-20 w-20" />
        <span className="font-heading text-xl font-bold text-sidebar-foreground">Chatini</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              disabled={item.locked}
              onClick={() => !item.locked && onChange(item.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                item.locked && "cursor-not-allowed opacity-50 hover:bg-transparent"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.locked && <Lock className="h-3.5 w-3.5 shrink-0" />}
            </button>
          );
        })}
      </nav>

      {/* Cloud Sync status */}
      <div className="mt-auto flex items-center gap-2 rounded-xl bg-accent px-3 py-2.5 text-xs font-medium text-accent-foreground">
        <Cloud className="h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="font-semibold">Cloud Sync</p>
          <p className="text-muted-foreground">Active</p>
        </div>
      </div>
    </aside>
  );
}
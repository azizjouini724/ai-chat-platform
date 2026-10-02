import { MessageSquare, Users, Sparkles, Settings, Lock, Cloud, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";
import { useTheme } from "next-themes";
import logoDark from "@/assets/logo_dark.png";

export type ActiveView = "messages" | "contacts" | "ai-tools" | "settings";

interface SidebarProps {
  active: ActiveView;
  onChange: (view: ActiveView) => void;
  onProfileClick: () => void;
  isProfileActive: boolean;
}

const navItems: { id: ActiveView; label: string; icon: typeof MessageSquare; locked?: boolean }[] = [
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "ai-tools", label: "AI Tools", icon: Sparkles, locked: true },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ active, onChange, onProfileClick, isProfileActive }: SidebarProps) {
  const { resolvedTheme } = useTheme();
  const activeLogo = resolvedTheme === "dark" ? logoDark : logo;

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar px-4 py-5">
      <div className="mb-8 flex items-center gap-2 px-2">
          <img src={activeLogo} alt="Chatini" className="h-11 w-11" />
        <span className="font-heading text-xl font-bold text-sidebar-foreground">Chatini</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        <button
          onClick={onProfileClick}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
            isProfileActive
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm scale-[1.02]"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:pl-4"
          )}
        >
          <UserRound className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">Profil</span>
        </button>

        {navItems.map((item) => {
          const isActive = !isProfileActive && active === item.id;
          return (
            <button
              key={item.id}
              disabled={item.locked}
              onClick={() => !item.locked && onChange(item.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm scale-[1.02]"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:pl-4",
                item.locked && "cursor-not-allowed opacity-50 hover:bg-transparent hover:pl-3"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.locked && <Lock className="h-3.5 w-3.5 shrink-0" />}
            </button>
          );
        })}
      </nav>

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
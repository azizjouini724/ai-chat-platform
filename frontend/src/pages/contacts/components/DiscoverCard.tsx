import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DiscoverCardProps {
  onClick: () => void;
}

export function DiscoverCard({ onClick }: DiscoverCardProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/40 p-5 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
        <UserPlus className="h-7 w-7 text-accent-foreground" />
      </div>
      <p className="mt-3 font-heading font-semibold text-foreground">Trouver un Spark</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Découvre de nouveaux amis</p>
      <Button size="sm" variant="secondary" className="mt-4 w-full rounded-full" onClick={onClick}>
        Explorer
      </Button>
    </div>
  );
}
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  isOnline?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

const sizeMap = {
  sm: "h-9 w-9",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

export function UserAvatar({ src, name, isOnline, size = "md", className, onClick }: UserAvatarProps) {
  return (
    <div
      className={cn("relative shrink-0", onClick && "cursor-pointer", className)}
      onClick={onClick}
    >
      <Avatar className={sizeMap[size]}>
        <AvatarImage src={src ?? undefined} alt={name} />
        <AvatarFallback className="bg-primary text-primary-foreground">
          {name?.slice(0, 2).toUpperCase() ?? "??"}
        </AvatarFallback>
      </Avatar>
      {isOnline !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card",
            isOnline ? "bg-emerald-400" : "bg-muted-foreground/40"
          )}
        />
      )}
    </div>
  );
}
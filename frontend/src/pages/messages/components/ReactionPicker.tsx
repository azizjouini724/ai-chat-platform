import { cn } from "@/lib/utils";
import { REACTION_OPTIONS } from "@/lib/reactions";

interface ReactionPickerProps {
  onSelect: (key: string) => void;
  currentKey?: string;
}

export function ReactionPicker({ onSelect, currentKey }: ReactionPickerProps) {
  return (
    <div className="flex items-center gap-1 px-2 py-1.5">
      {REACTION_OPTIONS.map(({ key, label, icon: Icon, colorClass }) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          title={label}
          className={cn(
            "rounded-full p-1.5 transition-transform duration-150 hover:scale-125 hover:bg-muted",
            currentKey === key && "bg-muted"
          )}
        >
          <Icon className={cn("h-6 w-6", colorClass)} />
        </button>
      ))}
    </div>
  );
}
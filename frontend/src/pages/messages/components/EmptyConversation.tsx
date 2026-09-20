import { MessageSquare } from "lucide-react";

export function EmptyConversation() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <MessageSquare className="h-7 w-7 text-muted-foreground" />
      </div>
      <div>
        <p className="font-heading font-semibold text-foreground">Sélectionne une conversation</p>
        <p className="mt-1 text-sm text-muted-foreground">Ou lance une discussion depuis Contacts</p>
      </div>
    </div>
  );
}
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, LogOut, ShieldCheck, UserMinus, UserPlus, Pencil, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/shared/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { conversationsApi } from "@/api/conversations.api";
import { messagesApi } from "@/api/messages.api";
import { extractErrorMessage } from "@/lib/error-message";
import { useAuthStore } from "@/store/auth.store";
import { useConversationsStore } from "@/store/conversations.store";
import { usePresenceStore } from "@/store/presence.store";
import { AddGroupMemberDialog } from "./AddGroupMemberDialog";
import type { Conversation } from "@/types/models";

interface GroupInfoDialogProps {
  conversation: Conversation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeft: () => void;
}

export function GroupInfoDialog({ conversation, open, onOpenChange, onLeft }: GroupInfoDialogProps) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const onlineUserIds = usePresenceStore((s) => s.onlineUserIds);
  const updateConversationInfo = useConversationsStore((s) => s.updateConversationInfo);
  const removeMember = useConversationsStore((s) => s.removeMember);
  const updateMemberRole = useConversationsStore((s) => s.updateMemberRole);

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(conversation.name ?? "");
  const [isSavingName, setIsSavingName] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const myMembership = conversation.members.find((m) => m.userId === currentUserId);
  const isAdmin = myMembership?.role === "ADMIN";

  async function handleSaveName() {
    const trimmed = nameValue.trim();
    if (trimmed.length < 2 || trimmed === conversation.name) {
      setIsEditingName(false);
      return;
    }
    setIsSavingName(true);
    try {
      await conversationsApi.update(conversation.id, { name: trimmed });
      updateConversationInfo(conversation.id, { name: trimmed });
      setIsEditingName(false);
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible de modifier le nom du groupe"));
    } finally {
      setIsSavingName(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const { data } = await messagesApi.uploadImage(file);
      await conversationsApi.update(conversation.id, { avatarUrl: data.url });
      updateConversationInfo(conversation.id, { avatarUrl: data.url });
      toast.success("Photo du groupe mise à jour");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Échec de l'envoi de l'image"));
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = "";
    }
  }

  async function handlePromote(userId: string) {
    try {
      await conversationsApi.promoteMember(conversation.id, userId);
      updateMemberRole(conversation.id, userId, "ADMIN");
      toast.success("Membre promu admin");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible de promouvoir ce membre"));
    }
  }

  async function handleRemoveMember(userId: string) {
    try {
      await conversationsApi.removeMember(conversation.id, userId);
      removeMember(conversation.id, userId);
      toast.success("Membre retiré du groupe");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible de retirer ce membre"));
    }
  }

  async function handleLeave() {
    setIsLeaving(true);
    try {
      await conversationsApi.leave(conversation.id);
      toast.success("Tu as quitté le groupe");
      onOpenChange(false);
      onLeft();
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible de quitter le groupe"));
    } finally {
      setIsLeaving(false);
    }
  }

  const memberIds = conversation.members.map((m) => m.userId);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Informations du groupe</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <UserAvatar
                src={conversation.avatarUrl}
                name={conversation.name ?? undefined}
                size="lg"
                className="h-24 w-24"
              />
              {isAdmin && (
                <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                  {isUploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Pencil className="h-3.5 w-3.5" />
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              )}
            </div>

            {isEditingName ? (
              <div className="flex w-full items-center gap-2">
                <Input
                  autoFocus
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  className="rounded-full text-center"
                />
                <Button size="icon" className="shrink-0 rounded-full" onClick={handleSaveName} disabled={isSavingName}>
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => isAdmin && setIsEditingName(true)}
                className="flex items-center gap-1.5 font-heading text-lg font-semibold text-foreground"
              >
                {conversation.name}
                {isAdmin && <Pencil className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
            )}

            <p className="text-xs text-muted-foreground">
              {conversation.members.length} membre{conversation.members.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Membres</p>
            {isAdmin && (
              <Button size="sm" variant="secondary" className="rounded-full" onClick={() => setIsAddMemberOpen(true)}>
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                Ajouter
              </Button>
            )}
          </div>

          <ScrollArea className="h-56">
            <div className="space-y-1">
              {conversation.members.map((member) => {
                const isMe = member.userId === currentUserId;
                const isOnline = onlineUserIds.has(member.userId);
                return (
                  <div key={member.userId} className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/50">
                    <UserAvatar
                      src={member.user?.avatarUrl}
                      name={member.user?.username}
                      isOnline={isOnline}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {member.user?.username} {isMe && "(toi)"}
                      </p>
                      {member.role === "ADMIN" && (
                        <span className="flex items-center gap-1 text-[11px] text-primary">
                          <ShieldCheck className="h-3 w-3" />
                          Admin
                        </span>
                      )}
                    </div>

                    {isAdmin && !isMe && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 rounded-full">
                            <UserMinus className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {member.role !== "ADMIN" && (
                            <DropdownMenuItem onClick={() => handlePromote(member.userId)}>
                              <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                              Promouvoir admin
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleRemoveMember(member.userId)}
                            className="text-destructive"
                          >
                            <UserMinus className="mr-2 h-3.5 w-3.5" />
                            Retirer du groupe
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <Button
            variant="outline"
            className="w-full rounded-full text-destructive hover:text-destructive"
            onClick={handleLeave}
            disabled={isLeaving}
          >
            {isLeaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
            Quitter le groupe
          </Button>
        </DialogContent>
      </Dialog>

      <AddGroupMemberDialog
        open={isAddMemberOpen}
        onOpenChange={setIsAddMemberOpen}
        conversationId={conversation.id}
        existingMemberIds={memberIds}
      />
    </>
  );
}
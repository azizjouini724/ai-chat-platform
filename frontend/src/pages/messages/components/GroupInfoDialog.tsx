import { useState, useEffect } from "react";
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
import type { Conversation, GroupJoinRequest } from "@/types/models";
import { UserCheck, X } from "lucide-react";
 

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
  const [joinRequests, setJoinRequests] = useState<GroupJoinRequest[]>([]);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
   useEffect(() => {
    if (!open || !isAdmin) return;
    conversationsApi
      .getJoinRequests(conversation.id)
      .then((res) => setJoinRequests(res.data))
      .catch(() => {});
  }, [open, isAdmin, conversation.id]);


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
  async function handleAcceptJoinRequest(requestId: string) {
    setProcessingRequestId(requestId);
    try {
      await conversationsApi.acceptJoinRequest(conversation.id, requestId);
      setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
      toast.success("Membre ajouté au groupe");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible d'accepter cette demande"));
    } finally {
      setProcessingRequestId(null);
    }
  }

  async function handleDeclineJoinRequest(requestId: string) {
    setProcessingRequestId(requestId);
    try {
      await conversationsApi.declineJoinRequest(conversation.id, requestId);
      setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
      toast.success("Demande refusée");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible de refuser cette demande"));
    } finally {
      setProcessingRequestId(null);
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
            <Button size="sm" variant="secondary" className="rounded-full" onClick={() => setIsAddMemberOpen(true)}>
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              Ajouter
            </Button>
          </div>
                    {isAdmin && joinRequests.length > 0 && (
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                Demandes en attente ({joinRequests.length})
              </p>
              <div className="space-y-2">
                {joinRequests.map((req) => (
                  <div key={req.id} className="flex items-center gap-2 rounded-lg bg-card p-2">
                    <UserAvatar src={req.user?.avatarUrl} name={req.user?.username} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {req.user?.username}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        proposé par {req.requestedBy?.username}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      className="h-7 w-7 shrink-0 rounded-full"
                      disabled={processingRequestId === req.id}
                      onClick={() => handleAcceptJoinRequest(req.id)}
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 shrink-0 rounded-full"
                      disabled={processingRequestId === req.id}
                      onClick={() => handleDeclineJoinRequest(req.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
        isAdmin={isAdmin}
      />
    </>
  );
}
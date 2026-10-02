import { useState, useEffect } from "react";
import { toast } from "sonner";
import { LogOut, Trash2, Moon, Loader2, KeyRound, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ModeToggle } from "@/components/mode-toggle";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { authApi } from "@/api/auth.api";
import { usersApi } from "@/api/users.api";
import { friendsApi } from "@/api/friends.api";
import { useAuthStore } from "@/store/auth.store";
import { disconnectSocket } from "@/sockets/socket";
import { extractErrorMessage } from "@/lib/error-message";
import type { User } from "@/types/models";

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
  const [isLoadingBlocked, setIsLoadingBlocked] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  useEffect(() => {
    friendsApi
      .getBlocked()
      .then((res) => setBlockedUsers(res.data))
      .catch(() => toast.error("Impossible de charger les utilisateurs bloqués"))
      .finally(() => setIsLoadingBlocked(false));
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      // Même si l'appel échoue (token déjà expiré, etc.), on déconnecte quand même localement
    } finally {
      disconnectSocket();
      logout();
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    try {
      await usersApi.deleteMe();
      disconnectSocket();
      logout();
      toast.success("Compte supprimé");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible de supprimer le compte"));
      setIsDeleting(false);
    }
  }

  async function handleChangePassword() {
    if (newPassword.length < 6) {
      toast.error("Le nouveau mot de passe doit contenir au moins 6 caractères");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les deux mots de passe ne correspondent pas");
      return;
    }
    setIsChangingPassword(true);
    try {
      await usersApi.changePassword({ currentPassword, newPassword });
      toast.success("Mot de passe modifié avec succès");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible de modifier le mot de passe"));
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleUnblock(userId: string) {
    setUnblockingId(userId);
    try {
      await friendsApi.unblockUser(userId);
      setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success("Utilisateur débloqué");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Impossible de débloquer cet utilisateur"));
    } finally {
      setUnblockingId(null);
    }
  }

  return (
    <div className="mx-auto h-full max-w-2xl overflow-y-auto p-6">
      <h1 className="font-heading text-xl font-bold text-foreground">Paramètres</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Connecté en tant que {user?.username}
      </p>

      {/* Apparence */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <p className="text-sm font-semibold text-foreground">Apparence</p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Moon className="h-4 w-4" />
            Thème clair / sombre
          </div>
          <ModeToggle />
        </div>
      </div>

      {/* Sécurité */}
      <div className="mt-4 rounded-2xl border border-border bg-card p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <KeyRound className="h-4 w-4" />
          Changer le mot de passe
        </p>

        <div className="mt-3 space-y-2">
          <PasswordInput
            placeholder="Mot de passe actuel"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <PasswordInput
            placeholder="Nouveau mot de passe"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <PasswordInput
            placeholder="Confirmer le nouveau mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button
            className="w-full rounded-full"
            onClick={handleChangePassword}
            disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
          >
            {isChangingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Mettre à jour le mot de passe
          </Button>
        </div>
      </div>

      {/* Utilisateurs bloqués */}
      <div className="mt-4 rounded-2xl border border-border bg-card p-5">
        <p className="text-sm font-semibold text-foreground">Utilisateurs bloqués</p>

        {isLoadingBlocked ? (
          <div className="mt-3 flex justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : blockedUsers.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Aucun utilisateur bloqué</p>
        ) : (
          <div className="mt-3 space-y-2">
            {blockedUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 rounded-xl bg-muted/50 p-2">
                <UserAvatar src={u.avatarUrl} name={u.username} size="sm" />
                <p className="flex-1 truncate text-sm font-medium text-foreground">{u.username}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full shrink-0"
                  disabled={unblockingId === u.id}
                  onClick={() => handleUnblock(u.id)}
                >
                  {unblockingId === u.id ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ShieldOff className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Débloquer
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compte */}
      <div className="mt-4 rounded-2xl border border-border bg-card p-5">
        <p className="text-sm font-semibold text-foreground">Compte</p>

        <Button
          variant="outline"
          className="mt-3 w-full justify-start rounded-full"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          Se déconnecter
        </Button>

        <Button
          variant="outline"
          className="mt-2 w-full justify-start rounded-full text-destructive hover:text-destructive"
          onClick={() => setIsDeleteOpen(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer mon compte
        </Button>
      </div>

      {/* Dialogue de confirmation */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer ton compte ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Cette action est définitive. Tes messages, publications et contacts seront perdus.
          </p>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Oui, supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
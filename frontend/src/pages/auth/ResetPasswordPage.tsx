import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AuthLayout } from "@/layouts/AuthLayout";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validation/auth.schemas";
import { authApi } from "@/api/auth.api";
import type { AuthView } from "./AuthFlow";
import { PasswordInput } from "@/components/shared/PasswordInput";

interface ResetPasswordPageProps {
  token: string;
  onNavigate: (view: AuthView) => void;
}

export function ResetPasswordPage({ token, onNavigate }: ResetPasswordPageProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    setIsLoading(true);
    try {
      await authApi.resetPassword({ token, password: values.password });
      toast.success("Mot de passe mis à jour ! Connecte-toi 🎉");
      onNavigate("login");
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Lien invalide ou expiré");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout title="Nouveau mot de passe" subtitle="Choisis un mot de passe sécurisé">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nouveau mot de passe</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirme le mot de passe</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full rounded-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Réinitialiser
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
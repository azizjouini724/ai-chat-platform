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
import { loginSchema, type LoginFormValues } from "@/lib/validation/auth.schemas";
import { authApi } from "@/api/auth.api";
import { usersApi } from "@/api/users.api";
import { useAuthStore } from "@/store/auth.store";
import type { AuthView } from "./AuthFlow";
import { extractErrorMessage } from "@/lib/error-message";
import { PasswordInput } from "@/components/shared/PasswordInput";

interface LoginPageProps {
  onNavigate: (view: AuthView) => void;
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    try {
      const { data } = await authApi.login(values);
      const meRes = await usersApi.getMe().catch(() => null);
      setAuth(meRes?.data ?? (data as any).user, data.accessToken, data.refreshToken);
      toast.success("Bienvenue sur Chatini");
    } catch (error: any) {
      if (!error?.response) {
        toast.error("Impossible de contacter le serveur. Vérifie ta connexion.");
      } else {
        toast.error(extractErrorMessage(error, "Email ou mot de passe incorrect"));
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Bon retour parmi les nuages"
      subtitle="Connecte-toi pour retrouver tes conversations"
      footer={
        <>
          Pas encore de compte ?{" "}
          <button
            onClick={() => onNavigate("register")}
            className="font-semibold text-primary hover:underline"
          >
            Crée-en un
          </button>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="toi@exemple.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Mot de passe</FormLabel>
                  <button
                    type="button"
                    onClick={() => onNavigate("forgot-password")}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Oublié ?
                  </button>
                </div>
                <FormControl>
                  <PasswordInput placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full rounded-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Se connecter
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
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
import { registerSchema, type RegisterFormValues } from "@/lib/validation/auth.schemas";
import { authApi } from "@/api/auth.api";
import type { AuthView } from "./AuthFlow";
import { PasswordInput } from "@/components/shared/PasswordInput";

interface RegisterPageProps {
  onNavigate: (view: AuthView) => void;
}

export function RegisterPage({ onNavigate }: RegisterPageProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: RegisterFormValues) {
    setIsLoading(true);
    try {
      await authApi.register({
        username: values.username,
        email: values.email,
        password: values.password,
      });
      toast.success("Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse.", {
        icon: <Mail className="h-4 w-4" />,
      });
      onNavigate("login");
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Impossible de créer le compte");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Rejoins le ciel de Chatini"
      subtitle="Crée ton compte en quelques secondes"
      footer={
        <>
          Déjà un compte ?{" "}
          <button
            onClick={() => onNavigate("login")}
            className="font-semibold text-primary hover:underline"
          >
            Connecte-toi
          </button>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom d'utilisateur</FormLabel>
                <FormControl>
                  <Input placeholder="CloudExplorer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                <FormLabel>Mot de passe</FormLabel>
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
            Créer mon compte
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
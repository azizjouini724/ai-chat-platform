import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
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
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validation/auth.schemas";
import { authApi } from "@/api/auth.api";
import type { AuthView } from "./AuthFlow";

interface ForgotPasswordPageProps {
  onNavigate: (view: AuthView) => void;
}

export function ForgotPasswordPage({ onNavigate }: ForgotPasswordPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(values.email);
      setSent(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Mot de passe oublié"
      subtitle="On t'envoie un lien de réinitialisation"
      footer={
        <button
          onClick={() => onNavigate("login")}
          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour à la connexion
        </button>
      }
    >
      {sent ? (
        <p className="text-center text-sm text-muted-foreground">
          Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé. Vérifie
          ta boîte mail (et tes spams) ✉️
        </p>
      ) : (
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

            <Button type="submit" className="w-full rounded-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Envoyer le lien
            </Button>
          </form>
        </Form>
      )}
    </AuthLayout>
  );
}
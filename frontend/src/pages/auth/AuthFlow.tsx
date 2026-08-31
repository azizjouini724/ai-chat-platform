import { useState } from "react";
import { LoginPage } from "./LoginPage";
import { RegisterPage } from "./RegisterPage";
import { ForgotPasswordPage } from "./ForgotPasswordPage";
import { ResetPasswordPage } from "./ResetPasswordPage";

export type AuthView = "login" | "register" | "forgot-password" | "reset-password";

export function AuthFlow() {
  const [view, setView] = useState<AuthView>("login");

  // Si l'utilisateur arrive via un lien email contenant ?token=..., on bascule direct sur reset
  const urlToken = new URLSearchParams(window.location.search).get("token");

  if (view === "register") return <RegisterPage onNavigate={setView} />;
  if (view === "forgot-password") return <ForgotPasswordPage onNavigate={setView} />;
  if (view === "reset-password" || urlToken)
    return <ResetPasswordPage token={urlToken ?? ""} onNavigate={setView} />;

  return <LoginPage onNavigate={setView} />;
}
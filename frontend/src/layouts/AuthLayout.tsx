import type { ReactNode } from "react";
import logo from "@/assets/logo.png";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-chatini-ice via-chatini-soft-sky to-chatini-lavender px-4 py-10">
      {/* Blobs décoratifs façon "nuages" */}
      <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-chatini-sky/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-chatini-violet/40 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 right-10 h-40 w-40 rounded-full bg-chatini-pink/40 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <img
            src={logo}
            alt="Chatini"
            className="mb-3 h-[270px] w-[270px] drop-shadow-[0_15px_25px_rgba(72,106,138,0.35)]"
          />
          <h1 className="font-heading text-2xl font-bold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="animate-float-delayed rounded-3xl border border-border/50 bg-card/90 p-8 shadow-2xl shadow-chatini-dusty/20 backdrop-blur-sm">
          {children}
        </div>

        {footer && <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </div>
  );
}
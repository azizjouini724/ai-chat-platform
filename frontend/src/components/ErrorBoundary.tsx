import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Erreur capturée par ErrorBoundary:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
          <p className="font-heading text-lg font-semibold text-foreground">
            Un souci est survenu
          </p>
          <p className="text-sm text-muted-foreground">Recharge la page pour réessayer.</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Recharger
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
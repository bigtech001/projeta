import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ChurchLive] Uncaught error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-8 gap-6">
          <div className="text-4xl font-bold text-destructive">Erro inesperado</div>
          <p className="text-muted-foreground text-center max-w-md">
            Ocorreu um erro ao renderizar a interface. Tente recarregar a página.
          </p>
          <pre className="text-xs text-muted-foreground bg-card border border-border rounded-lg p-4 max-w-xl w-full overflow-auto max-h-40">
            {this.state.error?.message}
          </pre>
          <button
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
            onClick={() => window.location.reload()}
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

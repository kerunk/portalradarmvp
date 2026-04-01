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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleRecover = () => {
    try { sessionStorage.removeItem("mvp_auth_session"); } catch {}
    try { localStorage.removeItem("mvp_auth_session"); } catch {}
    this.setState({ hasError: false, error: null });
    window.location.href = "/login";
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center space-y-6 max-w-md">
            <h1 className="text-2xl font-bold text-foreground">
              Algo deu errado
            </h1>
            <p className="text-muted-foreground">
              Ocorreu um erro inesperado. Use as opções abaixo para recuperar o acesso.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleRecover}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
              >
                Voltar para login
              </button>
              <button
                onClick={this.handleReload}
                className="px-6 py-2 border border-border text-foreground rounded-md hover:bg-muted transition-colors"
              >
                Recarregar aplicação
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

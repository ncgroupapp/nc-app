"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Optional custom fallback UI */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary — catches rendering errors anywhere in its child tree
 * and displays a friendly fallback UI instead of an invisible blank screen.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <MyComponent />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // TODO: integrate with an error tracking service (e.g. Sentry)
    console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack);
  }

  private reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[200px] items-center justify-center p-6">
          <div className="w-full max-w-md">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Algo salió mal</AlertTitle>
              <AlertDescription className="mt-2 space-y-3">
                <p>Ocurrió un error inesperado en esta sección.</p>
                {this.state.error?.message && (
                  <p className="font-mono text-xs opacity-70">
                    {this.state.error.message}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.reset}
                  className="mt-2 gap-2"
                >
                  <RefreshCw className="h-3 w-3" />
                  Intentar de nuevo
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

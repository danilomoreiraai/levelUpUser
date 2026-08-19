import { Component, type ErrorInfo, type ReactNode } from "react";

import { captureRuntimeError } from "@/lib/monitoring";

type ProductionErrorBoundaryProps = {
  children: ReactNode;
};

type ProductionErrorBoundaryState = {
  hasError: boolean;
};

export class ProductionErrorBoundary extends Component<
  ProductionErrorBoundaryProps,
  ProductionErrorBoundaryState
> {
  state: ProductionErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ProductionErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    void captureRuntimeError(error, {
      componentStack: errorInfo.componentStack ?? "unavailable",
      mechanism: "react_error_boundary",
    });
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="grid min-h-dvh place-items-center bg-surface px-6">
        <section className="max-w-sm text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Something went wrong</h1>
          <p className="mt-3 text-sm text-slate-500">
            The error was reported automatically. Please refresh the page.
          </p>
        </section>
      </main>
    );
  }
}

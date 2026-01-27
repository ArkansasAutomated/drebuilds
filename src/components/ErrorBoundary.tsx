import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
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

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-background flex items-center justify-center px-6">
                    <div className="max-w-md w-full p-8 bg-card border border-border rounded-sm text-center">
                        <h1 className="font-mono text-xl text-foreground mb-4">
                            &gt; SYSTEM_ERROR
                        </h1>
                        <p className="font-mono text-sm text-muted-foreground mb-6">
              // Something went wrong. Please refresh the page.
                        </p>
                        <pre className="font-mono text-xs text-destructive bg-surface-elevated p-4 rounded-sm overflow-auto mb-6">
                            {this.state.error?.message || "Unknown error"}
                        </pre>
                        <button
                            onClick={() => window.location.reload()}
                            className="font-mono text-sm text-primary hover:underline"
                        >
                            &gt; reload_page()
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

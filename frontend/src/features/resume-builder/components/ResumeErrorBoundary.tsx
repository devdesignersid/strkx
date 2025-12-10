import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/design-system/components/Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary for Resume Builder
 * Catches PDF render errors, font loading failures, and other runtime errors.
 * Provides a user-friendly fallback with retry option.
 */
export class ResumeErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to console with context
        console.error('[Resume Builder Error]', {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
        });
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="flex flex-col items-center justify-center w-full h-full p-8 text-center">
                    <div className="bg-card border border-border rounded-xl p-8 max-w-md shadow-lg">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-destructive" />
                        </div>

                        <h3 className="text-xl font-semibold text-foreground mb-2">
                            Something went wrong
                        </h3>

                        <p className="text-muted-foreground mb-6 text-sm">
                            We encountered an error while rendering your resume.
                            This might be a temporary issue.
                        </p>

                        {this.state.error && (
                            <details className="mb-6 text-left">
                                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                    Technical details
                                </summary>
                                <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto max-h-32 text-destructive">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}

                        <Button onClick={this.handleRetry} className="w-full">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Try Again
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

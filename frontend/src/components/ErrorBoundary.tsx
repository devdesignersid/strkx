import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { ErrorIllustration } from '@/design-system/illustrations';
import { Button, Card } from '@/design-system/components';
import { RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-md w-full p-8 text-center">
            <div className="w-32 h-32 mx-auto mb-6">
              <ErrorIllustration className="w-full h-full" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h1>
            <p className="text-muted-foreground mb-6">
              We apologize for the inconvenience. The application has encountered an unexpected error.
            </p>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4" />
              Reload Application
            </Button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-6 text-left overflow-auto max-h-32 bg-secondary/50 p-3 rounded-lg text-xs font-mono text-destructive">
                {this.state.error.toString()}
              </div>
            )}
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

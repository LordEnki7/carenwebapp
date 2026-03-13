import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import CrashlyticsService from '@/services/crashlytics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Generate unique error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console for development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Record in Crashlytics with context
    CrashlyticsService.recordError(error, {
      component: 'ErrorBoundary',
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      timestamp: Date.now(),
      errorId: this.state.errorId || 'unknown'
    });

    // Log breadcrumb for debugging
    CrashlyticsService.logBreadcrumb(`Error boundary triggered: ${error.message}`);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReload = () => {
    CrashlyticsService.logBreadcrumb('User triggered app reload from error boundary');
    window.location.reload();
  };

  handleRetry = () => {
    CrashlyticsService.logBreadcrumb('User attempted retry from error boundary');
    this.setState({ 
      hasError: false, 
      error: null,
      errorId: null 
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI or default error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Alert className="border-red-500/20 bg-red-500/10 text-red-300">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-red-200">Application Error</AlertTitle>
              <AlertDescription className="text-red-300 mb-4">
                Something went wrong in C.A.R.E.N.™ Don't worry - your emergency features are still available.
                <br />
                <br />
                <span className="text-xs font-mono text-red-400">
                  Error ID: {this.state.errorId}
                </span>
              </AlertDescription>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={this.handleRetry}
                  variant="outline"
                  size="sm"
                  className="border-red-500/30 hover:bg-red-500/20 text-red-200"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                
                <Button 
                  onClick={this.handleReload}
                  variant="outline"
                  size="sm"
                  className="border-blue-500/30 hover:bg-blue-500/20 text-blue-200"
                >
                  Reload App
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-xs">
                  <summary className="cursor-pointer text-red-400 hover:text-red-300">
                    Technical Details (Development)
                  </summary>
                  <pre className="mt-2 p-2 bg-black/30 rounded text-red-300 whitespace-pre-wrap text-xs">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
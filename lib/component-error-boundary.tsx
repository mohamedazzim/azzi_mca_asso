/**
 * Component-Level Error Boundaries
 * Graceful error handling for React components
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  level?: 'page' | 'component' | 'critical';
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    this.setState({
      error,
      errorInfo
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🔥 Component Error Boundary');
      
      
      
      console.groupEnd();
    }

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Error reporting service integration would go here
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      level: this.props.level || 'component'
    };

    // For now, just log to console in production
    
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        errorId: ''
      });
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { level = 'component' } = this.props;
      const canRetry = this.retryCount < this.maxRetries;

      // Different UI based on error level
      if (level === 'critical') {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full mx-auto p-8 bg-white rounded-lg shadow-lg text-center">
              <div className="mb-6">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Critical System Error
                </h1>
                <p className="text-gray-600">
                  The application has encountered a critical error and cannot continue.
                </p>
              </div>
              
              {this.props.showDetails && this.state.error && (
                <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
                  <h3 className="font-semibold text-sm text-gray-700 mb-2">
                    Error Details:
                  </h3>
                  <p className="text-xs text-gray-600 font-mono">
                    {this.state.error.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    ID: {this.state.errorId}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <Button onClick={this.handleReload} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Application
                </Button>
                <Button 
                  onClick={this.handleGoHome} 
                  variant="outline" 
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Return to Home
                </Button>
              </div>
            </div>
          </div>
        );
      }

      if (level === 'page') {
        return (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="max-w-md w-full mx-auto p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Page Error
              </h2>
              <p className="text-gray-600 mb-6">
                This page encountered an error and couldn't load properly.
              </p>
              
              {this.props.showDetails && this.state.error && (
                <div className="mb-4 p-3 bg-gray-100 rounded text-left">
                  <p className="text-sm text-gray-700">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {canRetry && (
                  <Button onClick={this.handleRetry} className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again ({this.maxRetries - this.retryCount} attempts left)
                  </Button>
                )}
                <Button 
                  onClick={this.handleReload} 
                  variant="outline" 
                  className="w-full"
                >
                  Reload Page
                </Button>
              </div>
            </div>
          </div>
        );
      }

      // Component-level error (default)
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 mb-1">
                Component Error
              </h3>
              <p className="text-sm text-red-700 mb-3">
                This component encountered an error and couldn't render properly.
              </p>
              
              {this.props.showDetails && this.state.error && (
                <div className="mb-3 p-2 bg-red-100 rounded text-xs">
                  <code className="text-red-800">
                    {this.state.error.message}
                  </code>
                </div>
              )}

              {canRetry && (
                <Button 
                  onClick={this.handleRetry} 
                  size="sm" 
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Specialized error boundaries for different contexts
export const PageErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="page" showDetails={process.env.NODE_ENV === 'development'}>
    {children}
  </ErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="component" showDetails={false}>
    {children}
  </ErrorBoundary>
);

export const CriticalErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="critical" showDetails={process.env.NODE_ENV === 'development'}>
    {children}
  </ErrorBoundary>
);

// Hook for programmatic error handling
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error, context?: string) => {
    // In a real app, you might want to send this to an error reporting service
    
    
    // You could also trigger a toast notification or other user feedback
    throw error; // This will be caught by the nearest error boundary
  }, []);

  return handleError;
};
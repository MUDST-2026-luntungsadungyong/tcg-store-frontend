import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback. Receives error + reset fn. */
  fallback?: (error: Error, resetErrorBoundary: () => void) => ReactNode;
  /** Called when an error is caught — useful for logging */
  onError?: (error: Error, info: ErrorInfo) => void;
  /** Called when the boundary is reset */
  onReset?: () => void;
}

/**
 * ErrorBoundary — catches any uncaught React render error in its subtree.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <SomeComponent />
 * </ErrorBoundary>
 *
 * // With custom fallback (e.g. a modal/popup from teammate):
 * <ErrorBoundary fallback={(err, reset) => <MyErrorModal error={err} onRetry={reset} />}>
 *   <SomeComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
    this.resetErrorBoundary = this.resetErrorBoundary.bind(this);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  resetErrorBoundary() {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  }

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (!hasError || !error) return children;

    if (fallback) return fallback(error, this.resetErrorBoundary);

    return <DefaultErrorFallback error={error} resetErrorBoundary={this.resetErrorBoundary} />;
  }
}

interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function DefaultErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <main
      role="alert"
      className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 py-12 text-center"
    >
      {/* Icon */}
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-status-danger/10">
        <svg
          className="h-8 w-8 text-status-danger"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>

      <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-status-danger">
        Something went wrong
      </p>
      <h1 className="mb-3 text-2xl font-bold text-white">
        This card view encountered an error
      </h1>
      <p className="mb-8 text-sm text-gray-400">
        An unexpected error occurred while rendering this section. Your collection data is safe.
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={resetErrorBoundary}
          className="inline-flex items-center justify-center rounded-full bg-brand-blue px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a85e0] focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 focus:ring-offset-bg-base"
        >
          Try again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center rounded-full border border-white/10 bg-bg-elevated px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-bg-elevated/80 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-bg-base"
        >
          Reload page
        </button>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium text-gray-400 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-bg-base"
        >
          Back to homepage
        </Link>
      </div>

      {/* Collapsible stack trace for developers */}
      {import.meta.env.DEV && (
        <details className="mt-8 w-full rounded-lg bg-bg-surface p-4 text-left">
          <summary className="cursor-pointer text-xs font-medium text-gray-500 hover:text-gray-300">
            Developer details
          </summary>
          <pre className="mt-3 overflow-auto text-xs text-status-danger/80">
            {error.stack ?? error.message}
          </pre>
        </details>
      )}
    </main>
  );
}

/**
 * RouteErrorBoundary — lightweight wrapper for use as React Router errorElement.
 *
 * Usage in router:
 * ```tsx
 * { path: '/', element: <PublicLayout />, errorElement: <RouteErrorBoundary />, children: [...] }
 * ```
 */
export function RouteErrorBoundary() {
  return (
    <main
      role="alert"
      className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 py-12 text-center"
    >
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-status-danger/10">
        <svg
          className="h-8 w-8 text-status-danger"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>
      <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-status-danger">
        Route error
      </p>
      <h1 className="mb-3 text-2xl font-bold text-white">This page failed to load</h1>
      <p className="mb-8 text-sm text-gray-400">
        Something went wrong while loading this page. Try reloading or go back to safety.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center rounded-full bg-brand-blue px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a85e0] focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 focus:ring-offset-bg-base"
        >
          Reload
        </button>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-full border border-white/10 bg-bg-elevated px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-bg-elevated/80 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-bg-base"
        >
          Homepage
        </Link>
      </div>
    </main>
  );
}

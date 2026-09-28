import { useState } from 'react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void | Promise<void>;
}

/**
 * ErrorState — inline error component for API/fetch failures inside a component.
 * Shows an alert icon, a message, and an optional Retry button.
 *
 * Usage:
 * ```tsx
 * {error && <ErrorState message={error.message} onRetry={fetchData} />}
 * ```
 */
export function ErrorState({ message = 'Something went wrong.', onRetry }: ErrorStateProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  async function handleRetry() {
    if (!onRetry) return;
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-status-danger/20 bg-status-danger/5 px-6 py-8 text-center"
    >
      {/* Alert icon */}
      <svg
        className="h-7 w-7 text-status-danger"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374l7.27-12.374c.866-1.5 3.032-1.5 3.898 0L21.303 16.126ZM12 15.75h.007v.008H12v-.008Z"
        />
      </svg>

      <p className="text-sm text-gray-300">{message}</p>

      {onRetry && (
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-bg-elevated px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-bg-elevated/80 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-bg-base disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRetrying && (
            <svg
              className="h-3.5 w-3.5 animate-spin text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {isRetrying ? 'Retrying…' : 'Retry'}
        </button>
      )}
    </div>
  );
}

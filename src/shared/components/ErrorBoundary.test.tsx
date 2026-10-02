import { act, render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

// A component that throws on demand
function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test explosion');
  return <p>All good</p>;
}

// Suppress console.error for expected error boundary noise
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});
afterEach(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundary', () => {
  it('renders children normally when no error is thrown', () => {
    render(
      <MemoryRouter>
        <ErrorBoundary>
          <p>All good</p>
        </ErrorBoundary>
      </MemoryRouter>,
    );

    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('renders default fallback when a child throws', () => {
    render(
      <MemoryRouter>
        <ErrorBoundary>
          <Bomb shouldThrow />
        </ErrorBoundary>
      </MemoryRouter>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try again/i })).toBeInTheDocument();
  });

  it('resets error state when "Try again" is clicked', async () => {
    let shouldThrow = true;

    function ControlledBomb() {
      if (shouldThrow) throw new Error('Test explosion');
      return <p>All good</p>;
    }

    render(
      <MemoryRouter>
        <ErrorBoundary>
          <ControlledBomb />
        </ErrorBoundary>
      </MemoryRouter>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Stop throwing before reset so children render cleanly after state reset
    shouldThrow = false;

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Try again/i }));
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('renders custom fallback when fallback prop is provided', () => {
    render(
      <MemoryRouter>
        <ErrorBoundary fallback={() => <p>Custom error UI</p>}>
          <Bomb shouldThrow />
        </ErrorBoundary>
      </MemoryRouter>,
    );

    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
    expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
  });

  it('calls onError callback when an error is caught', () => {
    const onError = vi.fn();

    render(
      <MemoryRouter>
        <ErrorBoundary onError={onError}>
          <Bomb shouldThrow />
        </ErrorBoundary>
      </MemoryRouter>,
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe('Test explosion');
  });
});

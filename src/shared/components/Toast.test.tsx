import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from './Toast';
import { MAX_TOASTS, useToastStore } from '@/shared/model/useToastStore';

vi.mock('motion/react', async () => {
  const React = await import('react');
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    useReducedMotion: () => true,
    motion: { div: ({ layout: _layout, initial: _initial, animate: _animate, exit: _exit, transition: _transition, ...props }: Record<string, unknown>) => React.createElement('div', props) },
  };
});

beforeEach(() => {
  vi.useFakeTimers();
  useToastStore.setState({ toasts: [] });
});
afterEach(() => vi.useRealTimers());

function add(type: 'success' | 'error' | 'info' | 'warning', message = 'Saved', duration?: number) {
  act(() => useToastStore.getState().addToast({ type, message, duration }));
}
function advance(milliseconds: number) {
  act(() => vi.advanceTimersByTime(milliseconds));
}

describe('toast notifications', () => {
  it('announces success politely and errors urgently, with accessible dismissal', () => {
    render(<ToastProvider />);
    add('success');
    add('error', 'Failed to save');
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to save');
    fireEvent.click(screen.getAllByRole('button', { name: 'Dismiss notification' })[0]);
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('keeps errors and warnings visible longer than success and info', () => {
    render(<ToastProvider />);
    add('success');
    add('info', 'Information');
    add('error', 'Error');
    add('warning', 'Warning');
    advance(4000);
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
    expect(screen.queryByText('Information')).not.toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    advance(4000);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('preserves remaining time and stays paused while either hovered or focused', () => {
    render(<ToastProvider />);
    add('success');
    advance(1000);
    const close = screen.getByRole('button', { name: 'Dismiss notification' });
    const toast = close.parentElement!;
    fireEvent.mouseEnter(toast);
    fireEvent.focus(close);
    advance(10000);
    fireEvent.mouseLeave(toast);
    advance(10000);
    expect(screen.getByText('Saved')).toBeInTheDocument();
    fireEvent.blur(close);
    advance(2999);
    expect(screen.getByText('Saved')).toBeInTheDocument();
    advance(1);
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('supports explicit duration and persistent notifications', () => {
    render(<ToastProvider />);
    add('info', 'Brief', 1000);
    add('error', 'Persistent', 0);
    advance(1000);
    expect(screen.queryByText('Brief')).not.toBeInTheDocument();
    advance(60000);
    expect(screen.getByText('Persistent')).toBeInTheDocument();
  });

  it('deduplicates active notifications and bounds the stack, allowing a dismissed message again', () => {
    add('success');
    add('success');
    expect(useToastStore.getState().toasts).toHaveLength(1);
    const id = useToastStore.getState().toasts[0].id;
    act(() => useToastStore.getState().removeToast(id));
    add('success');
    expect(useToastStore.getState().toasts).toHaveLength(1);
    for (let index = 0; index < MAX_TOASTS + 2; index++) add('info', `Message ${index}`);
    expect(useToastStore.getState().toasts).toHaveLength(MAX_TOASTS);
    expect(useToastStore.getState().toasts.at(-1)?.message).toBe(`Message ${MAX_TOASTS + 1}`);
  });
});

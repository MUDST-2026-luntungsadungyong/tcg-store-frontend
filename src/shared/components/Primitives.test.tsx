import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Input } from './Input';
import { Select } from './Select';
import { Modal } from './Modal';
import { FeedbackPopup } from './FeedbackPopup';

describe('shared field accessibility', () => {
  it('associates generated labels and errors without dropping existing descriptions', () => {
    render(<><p id="hint">Use your account name</p><Input label="Name" error="Required" aria-describedby="hint" /><Select label="Game" error="Choose a game" options={[]} /></>);
    expect(screen.getByLabelText('Name')).toHaveAccessibleDescription('Use your account name Required');
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Game')).toHaveAccessibleDescription('Choose a game');
  });
});

describe('Modal keyboard behavior', () => {
  it('leaves nested feedback focus and Escape with the acknowledgement dialog', () => {
    const onClose = vi.fn();
    render(<Modal isOpen title="Editor" onClose={onClose}><FeedbackPopup isOpen tone="info" title="Saved" message={<a href="#details">Details</a>} primaryAction={{ label: 'Continue', onClick: vi.fn() }} /></Modal>);
    const details = screen.getByRole('link', { name: 'Details' });
    details.focus();
    fireEvent.keyDown(details, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
    expect(details).toHaveFocus();
    fireEvent.keyDown(details, { key: 'Tab', shiftKey: true });
    expect(screen.getByRole('button', { name: 'Continue' })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('button', { name: 'Continue' }), { key: 'Tab' });
    expect(details).toHaveFocus();
  });

  it('traps keyboard focus, closes on Escape, and restores the opener', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const onClose = vi.fn();
    const { unmount } = render(<Modal isOpen title="Edit card" onClose={onClose}><button>Save</button></Modal>);
    const close = screen.getByRole('button', { name: 'Close modal' });
    const save = screen.getByRole('button', { name: 'Save' });
    expect(close).toHaveFocus();
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(save).toHaveFocus();
    fireEvent.keyDown(save, { key: 'Tab' });
    expect(close).toHaveFocus();
    fireEvent.keyDown(close, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
    unmount();
    expect(opener).toHaveFocus();
    opener.remove();
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FeedbackPopup } from './FeedbackPopup';

describe('FeedbackPopup', () => {
  it('renders nothing when isOpen is false', () => {
    render(
      <FeedbackPopup
        isOpen={false}
        tone="success"
        title="Test"
        message="Hidden"
        primaryAction={{ label: 'OK', onClick: () => {} }}
      />
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('renders correctly with title, message, and actions', () => {
    render(
      <FeedbackPopup
        isOpen={true}
        tone="success"
        title="Success!"
        message="Action completed"
        meta="Order #123"
        primaryAction={{ label: 'Continue', onClick: () => {} }}
        secondaryAction={{ label: 'Cancel', onClick: () => {} }}
      />
    );
    
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Action completed')).toBeInTheDocument();
    expect(screen.getByText('Order #123')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('calls action handlers when buttons are clicked', () => {
    const onPrimary = vi.fn();
    const onSecondary = vi.fn();
    
    render(
      <FeedbackPopup
        isOpen={true}
        tone="error"
        title="Error"
        message="Failed"
        primaryAction={{ label: 'Retry', onClick: onPrimary }}
        secondaryAction={{ label: 'Close', onClick: onSecondary }}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onPrimary).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onSecondary).toHaveBeenCalledTimes(1);
  });
});

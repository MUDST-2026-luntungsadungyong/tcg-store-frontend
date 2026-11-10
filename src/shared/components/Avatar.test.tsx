import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('shows an initial for a missing or failed image and retries a new URL', () => {
    const { rerender } = render(<Avatar name="  Guide" src="broken.png" alt="Profile photo" />);
    fireEvent.error(screen.getByRole('img', { name: 'Profile photo' }));
    expect(screen.getByText('G')).toBeInTheDocument();
    rerender(<Avatar name="Guide" src="new.png" alt="Profile photo" />);
    expect(screen.getByRole('img', { name: 'Profile photo' })).toHaveAttribute('src', 'new.png');
    rerender(<Avatar name="Guide" src={null} />);
    expect(screen.getByText('G')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { WorkspaceSidebar } from './WorkspaceSidebar';

describe('WorkspaceSidebar', () => {
  it('can be collapsed and expanded without removing navigation items', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/workspace/orders']}>
        <WorkspaceSidebar />
      </MemoryRouter>,
    );

    const sidebar = screen.getByRole('complementary', { name: 'Seller workspace' });
    expect(screen.getByRole('button', { name: 'Collapse workspace sidebar' })).toBeInTheDocument();
    expect(sidebar).toHaveClass('w-[240px]');

    await user.click(screen.getByRole('button', { name: 'Collapse workspace sidebar' }));

    expect(screen.getByRole('button', { name: 'Expand workspace sidebar' })).toBeInTheDocument();
    expect(sidebar).toHaveClass('w-[72px]');
    expect(screen.getByText('Card listings')).toHaveClass('sr-only');
    expect(screen.getByRole('link', { name: 'Reservation orders' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await user.click(screen.getByRole('button', { name: 'Expand workspace sidebar' }));

    expect(sidebar).toHaveClass('w-[240px]');
    expect(screen.getByText('Card listings')).not.toHaveClass('sr-only');
  });
});

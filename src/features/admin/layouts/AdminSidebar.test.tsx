import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { AdminSidebar } from './AdminSidebar';

describe('AdminSidebar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders all admin navigation links and highlights active item', () => {
    render(
      <MemoryRouter initialEntries={['/admin/users']}>
        <AdminSidebar />
      </MemoryRouter>
    );

    const desktopSidebar = screen.getByRole('complementary', { name: 'Platform administration' });
    const view = within(desktopSidebar);

    expect(view.getByRole('link', { name: 'Overview' })).toBeInTheDocument();
    expect(view.getByRole('link', { name: 'Seller approvals' })).toBeInTheDocument();
    expect(view.getByRole('link', { name: 'Order monitoring' })).toBeInTheDocument();
    expect(view.getByRole('link', { name: 'Admin management' })).toHaveAttribute('aria-current', 'page');
    expect(view.getByRole('link', { name: 'Audit trail' })).toBeInTheDocument();
  });

  it('collapses and expands on desktop when toggle button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminSidebar />
      </MemoryRouter>
    );

    const sidebar = screen.getByRole('complementary', { name: 'Platform administration' });
    expect(sidebar).toHaveClass('w-[270px]');

    const collapseButton = within(sidebar).getByRole('button', { name: 'Collapse administration sidebar' });
    await user.click(collapseButton);

    expect(sidebar).toHaveClass('w-[72px]');
    expect(localStorage.getItem('mythix_admin_sidebar_collapsed')).toBe('true');

    // Expand
    const expandButton = within(sidebar).getByRole('button', { name: 'Expand administration sidebar' });
    await user.click(expandButton);

    expect(sidebar).toHaveClass('w-[270px]');
    expect(localStorage.getItem('mythix_admin_sidebar_collapsed')).toBe('false');
  });

  it('toggles collapse state with Ctrl+B shortcut', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminSidebar />
      </MemoryRouter>
    );

    const sidebar = screen.getByRole('complementary', { name: 'Platform administration' });
    expect(sidebar).toHaveClass('w-[270px]');

    fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
    expect(sidebar).toHaveClass('w-[72px]');

    fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
    expect(sidebar).toHaveClass('w-[270px]');
  });

  it('opens and closes the mobile drawer', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminSidebar />
      </MemoryRouter>
    );

    const mobileMenuButton = screen.getByRole('button', { name: 'Open administration navigation' });
    expect(mobileMenuButton).toBeInTheDocument();

    await user.click(mobileMenuButton);

    const dialog = screen.getByRole('dialog', { name: 'Administration navigation' });
    expect(dialog).toBeInTheDocument();

    const closeButtons = screen.getAllByRole('button', { name: 'Close administration navigation' });
    await user.click(closeButtons[0]);

    expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'false');
  });
});

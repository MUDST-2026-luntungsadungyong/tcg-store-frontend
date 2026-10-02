import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { NotFoundPage } from './NotFoundPage';

function renderNotFound() {
  return render(
    <MemoryRouter>
      <NotFoundPage />
    </MemoryRouter>,
  );
}

describe('NotFoundPage', () => {
  it('renders the 404 status label', () => {
    renderNotFound();
    expect(screen.getByText(/404/i)).toBeInTheDocument();
  });

  it('renders the main heading', () => {
    renderNotFound();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders a link back to the homepage', () => {
    renderNotFound();
    const homeLink = screen.getByRole('link', { name: /back to homepage/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders a link to the marketplace', () => {
    renderNotFound();
    const marketplaceLink = screen.getByRole('link', { name: /explore marketplace/i });
    expect(marketplaceLink).toBeInTheDocument();
    expect(marketplaceLink).toHaveAttribute('href', '/browse');
  });

  it('renders a link to the public collections page', () => {
    renderNotFound();
    const collectionsLink = screen.getByRole('link', { name: /browse collections/i });
    expect(collectionsLink).toBeInTheDocument();
    expect(collectionsLink).toHaveAttribute('href', '/collections/public');
  });

  it('has an accessible recovery navigation landmark', () => {
    renderNotFound();
    expect(screen.getByRole('navigation', { name: /recovery navigation/i })).toBeInTheDocument();
  });
});

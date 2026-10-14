import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { CollectionEntry } from '@/entities/card/model/types';
import { CollectionCard } from './CollectionCard';

function createMockEntry(condition?: string): CollectionEntry {
  return {
    id: 'col-1',
    ownerId: 'usr-1',
    quantity: 2,
    sourceOrderId: 'ord-101',
    acquiredAt: '2026-09-01T00:00:00Z',
    listing: {
      id: 'lst-1',
      sellerId: 'usr-2',
      name: 'Charizard Base Set',
      game: 'Pokemon',
      image: '/assets/charizard.png',
      price: 500,
      cost: 400,
      stock: 1,
      status: 'SHOW',
      set: 'Base Set',
      condition,
    },
  };
}

describe('CollectionCard', () => {
  it('renders abbreviation condition as full human-readable name', () => {
    const entry = createMockEntry('NM');
    render(
      <BrowserRouter>
        <CollectionCard entry={entry} />
      </BrowserRouter>
    );

    expect(screen.getByText('Near Mint')).toBeInTheDocument();
    expect(screen.queryByText('NM')).not.toBeInTheDocument();
  });

  it('preserves custom or graded condition without incorrect conversion', () => {
    const entry = createMockEntry('PSA 10 Gem Mint');
    render(
      <BrowserRouter>
        <CollectionCard entry={entry} />
      </BrowserRouter>
    );

    expect(screen.getByText('PSA 10 Gem Mint')).toBeInTheDocument();
  });

  it('renders "Not specified" instead of defaulting to Mint when condition is missing', () => {
    const entry = createMockEntry(undefined);
    render(
      <BrowserRouter>
        <CollectionCard entry={entry} />
      </BrowserRouter>
    );

    expect(screen.getByText('Not specified')).toBeInTheDocument();
    expect(screen.queryByText(/Mint Condition/i)).not.toBeInTheDocument();
  });

  it('renders condition without mobile-hidden css class', () => {
    const entry = createMockEntry('LP');
    render(
      <BrowserRouter>
        <CollectionCard entry={entry} />
      </BrowserRouter>
    );

    const conditionEl = screen.getByText('Lightly Played');
    expect(conditionEl).toBeInTheDocument();
    expect(conditionEl.closest('.hidden')).toBeNull();
  });

  it('handles delete action correctly when onDelete provided', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const entry = createMockEntry('NM');

    render(
      <BrowserRouter>
        <CollectionCard entry={entry} onDelete={onDelete} />
      </BrowserRouter>
    );

    const deleteBtn = screen.getByRole('button', { name: /Remove Charizard Base Set from collection/i });
    await user.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith('col-1');
  });

  it('renders clear owned quantity badge with "× [qty]" and accessible label', () => {
    const entry = createMockEntry('NM');
    render(
      <BrowserRouter>
        <CollectionCard entry={entry} />
      </BrowserRouter>
    );

    expect(screen.getByText('× 2')).toBeInTheDocument();
    expect(screen.getByLabelText('2 cards owned')).toBeInTheDocument();
  });
});

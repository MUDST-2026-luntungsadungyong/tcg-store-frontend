import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { catalogApi, type CatalogCard } from '@/features/discovery/api/catalog';
import { CatalogCardPicker } from './CatalogCardPicker';

vi.mock('@/features/discovery/api/catalog', () => ({
  catalogApi: {
    searchCards: vi.fn(),
  },
}));

describe('CatalogCardPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('searches the catalog and returns the selected card', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const card: CatalogCard = {
      id: 'base1-4',
      name: 'Charizard',
      game: 'Pokemon',
      setName: 'Base',
      cardNumber: '4',
      imageSmall: '/charizard.png',
      marketPrice: 31401.65,
    };
    vi.mocked(catalogApi.searchCards).mockResolvedValue([card]);

    render(
      <CatalogCardPicker card={null} onSelect={onSelect} />,
    );

    await user.type(screen.getByRole('textbox', { name: 'Card' }), 'Charizard');
    await user.click(await screen.findByRole('option', { name: /Charizard/i }));

    expect(catalogApi.searchCards).toHaveBeenCalledWith('Charizard');
    expect(onSelect).toHaveBeenCalledWith(card);
    expect(screen.getByRole('textbox', { name: 'Card' })).toHaveValue('Charizard');
  });
});

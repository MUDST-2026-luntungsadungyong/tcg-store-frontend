import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { catalogApi, type CatalogCard } from '@/features/discovery/api/catalog';
import { CatalogCardDetails, CatalogCardPicker } from './CatalogCardPicker';

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

  it('renders the expanded catalog metadata and market price', () => {
    render(
      <CatalogCardDetails
        card={{
          id: 'base1-4',
          name: 'Charizard',
          setName: 'Base',
          cardNumber: '4',
          rarity: 'Rare Holo',
          supertype: 'Pokémon',
          subtypes: 'Stage 2',
          hp: '120',
          types: 'Fire',
          artist: 'Mitsuhiro Arita',
          marketPrice: 31401.65,
        }}
      />,
    );

    expect(screen.getByText('Charizard')).toBeInTheDocument();
    expect(screen.getByText('Base')).toBeInTheDocument();
    expect(screen.getByText('#4')).toBeInTheDocument();
    expect(screen.getByText('Rare Holo')).toBeInTheDocument();
    expect(screen.getByText('Pokémon')).toBeInTheDocument();
    expect(screen.getByText('Stage 2')).toBeInTheDocument();
    expect(screen.getByText('HP 120')).toBeInTheDocument();
    expect(screen.getByText('Fire')).toBeInTheDocument();
    expect(screen.getByText('Mitsuhiro Arita')).toBeInTheDocument();
    expect(screen.getByText('Database market price ฿31,401.65')).toBeInTheDocument();
  });
});

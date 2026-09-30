import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SellerOfferRow } from './SellerOfferRow';
import type { CardListing } from '@/entities/card/model/types';

describe('SellerOfferRow', () => {
  const mockOffer: CardListing = {
    id: 'listing-1',
    cardId: 'card-1',
    sellerId: 'seller-1',
    sellerName: 'Pokemon Haven',
    name: 'Pikachu Illustrator',
    game: 'Pokemon',
    image: '/assets/card1.png',
    price: 350000,
    cost: 100000,
    stock: 5,
    status: 'SHOW',
    condition: 'NM',
    language: 'EN',
  };

  it('renders price without "n in stock" under the price when stock > 0', () => {
    render(
      <MemoryRouter>
        <SellerOfferRow
          offer={mockOffer}
          isLoading={false}
          onAddToCart={vi.fn()}
          onReserveNow={vi.fn()}
        />
      </MemoryRouter>
    );

    // Price should be rendered
    expect(screen.getByText('฿350,000.00')).toBeInTheDocument();

    // Should NOT have "5 in stock" under the price
    expect(screen.queryByText('5 in stock')).not.toBeInTheDocument();

    // Should have "of 5" in the quantity widget
    expect(screen.getByText('of 5')).toBeInTheDocument();
  });

  it('renders dropdown with options from 1 to n (stock) and submits selected quantity', async () => {
    const user = userEvent.setup();
    const handleAddToCart = vi.fn().mockResolvedValue(undefined);
    const handleReserveNow = vi.fn().mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <SellerOfferRow
          offer={mockOffer}
          isLoading={false}
          onAddToCart={handleAddToCart}
          onReserveNow={handleReserveNow}
        />
      </MemoryRouter>
    );

    const select = screen.getByRole('combobox', { name: /select quantity/i }) as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('1');

    // Options should be 1, 2, 3, 4, 5
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(5);
    expect(options.map(opt => opt.textContent)).toEqual(['1', '2', '3', '4', '5']);

    // Change quantity to 3
    await user.selectOptions(select, '3');
    expect(select.value).toBe('3');

    // Add to cart
    const addToCartButton = screen.getByRole('button', { name: /add to reservation cart/i });
    await user.click(addToCartButton);
    expect(handleAddToCart).toHaveBeenCalledWith(mockOffer, 3);

    // Reserve now
    const reserveNowButton = screen.getByRole('button', { name: /reserve now/i });
    await user.click(reserveNowButton);
    expect(handleReserveNow).toHaveBeenCalledWith(mockOffer, 3);
  });

  it('handles out of stock listings gracefully', () => {
    const outOfStockOffer: CardListing = {
      ...mockOffer,
      stock: 0,
    };

    render(
      <MemoryRouter>
        <SellerOfferRow
          offer={outOfStockOffer}
          isLoading={false}
          onAddToCart={vi.fn()}
          onReserveNow={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Out of stock')).toBeInTheDocument();
    expect(screen.getByText('of 0')).toBeInTheDocument();

    const select = screen.getByRole('combobox', { name: /select quantity/i });
    expect(select).toBeDisabled();

    expect(screen.getByRole('button', { name: /add to reservation cart/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /reserve now/i })).toBeDisabled();
  });
});

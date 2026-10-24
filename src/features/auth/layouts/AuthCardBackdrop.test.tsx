import { StrictMode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listingDiscoveryApi } from '@/features/discovery/api/listings';
import { AuthCardBackdrop, useSaleCardImages } from './AuthCardBackdrop';

vi.mock('@/features/discovery/api/listings', () => ({ listingDiscoveryApi: { getListings: vi.fn() } }));

function Preview() {
  const images = useSaleCardImages(true);
  return <><AuthCardBackdrop images={images} /><button>Login</button></>;
}

describe('Sale-card authentication backdrop', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches once under StrictMode and only displays distinct in-stock sale images', async () => {
    vi.mocked(listingDiscoveryApi.getListings).mockResolvedValue({ items: [
      { image: '/available.png', status: 'SHOW', stock: 2 },
      { image: '/available.png', status: 'SHOW', stock: 3 },
      { image: '/hidden.png', status: 'HIDE', stock: 3 },
      { image: '/sold-out.png', status: 'SHOW', stock: 0 },
      { image: '', status: 'SHOW', stock: 3 },
    ] } as Awaited<ReturnType<typeof listingDiscoveryApi.getListings>>);
    const { container } = render(<StrictMode><Preview /></StrictMode>);
    await waitFor(() => expect(screen.getAllByTestId('auth-sale-track')).toHaveLength(2));
    expect(listingDiscoveryApi.getListings).toHaveBeenCalledTimes(1);
    expect([...container.querySelectorAll('.auth-sale-group img')].every((img) => img.getAttribute('src') === '/available.png')).toBe(true);
  });

  it('keeps authentication usable when the listing request fails', async () => {
    vi.mocked(listingDiscoveryApi.getListings).mockRejectedValue(new Error('Unavailable'));
    render(<Preview />);
    await waitFor(() => expect(listingDiscoveryApi.getListings).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('auth-card-fallback')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeEnabled();
  });

  it('falls back instead of repeatedly displaying a broken sale image', () => {
    const { container } = render(<AuthCardBackdrop images={['/broken.png']} />);
    fireEvent.error(container.querySelector('.auth-sale-group img')!);
    expect(screen.getByTestId('auth-card-fallback')).toBeInTheDocument();
    expect(container.querySelector('.auth-sale-track')).toBeNull();
  });
});

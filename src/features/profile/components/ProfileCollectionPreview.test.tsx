import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { collectionApi } from '@/features/collection/api/collection';
import type { CollectionEntry } from '@/entities/card/model/types';
import { ProfileCollectionPreview } from './ProfileCollectionPreview';

vi.mock('@/features/collection/api/collection', () => ({ collectionApi: { getMyCollection: vi.fn() } }));
beforeEach(() => vi.resetAllMocks());
const show = () => render(<MemoryRouter><ProfileCollectionPreview /></MemoryRouter>);

it('shows an empty state and links to the existing collection page', async () => {
  vi.mocked(collectionApi.getMyCollection).mockResolvedValue([]);
  show();
  expect(await screen.findByText('Your collection starts here')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'View collection' })).toHaveAttribute('href', '/collection');
});

it('limits the read-only preview to six entries and keeps owned quantities', async () => {
  vi.mocked(collectionApi.getMyCollection).mockResolvedValue(Array.from({ length: 8 }, (_, index) => ({
    id: String(index), quantity: 3, listing: { name: `Card ${index}`, game: 'Pokemon', image: '' },
  })) as CollectionEntry[]);
  show();
  expect(await screen.findByText('Card 0')).toBeInTheDocument();
  expect(screen.getAllByRole('listitem')).toHaveLength(6);
  expect(screen.queryByText('Card 6')).not.toBeInTheDocument();
  expect(screen.getAllByLabelText('3 owned')).toHaveLength(6);
  expect(screen.getAllByRole('button', { name: /Show details for/ })).toHaveLength(6);
  const card = screen.getByRole('button', { name: 'Show details for Card 0' });
  await userEvent.click(card);
  expect(card).toHaveAttribute('aria-pressed', 'true');
  await userEvent.click(card);
  expect(card).toHaveAttribute('aria-pressed', 'false');
});

it('retries a failed request instead of displaying an empty collection', async () => {
  vi.mocked(collectionApi.getMyCollection).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([]);
  show();
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load');
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('Your collection starts here')).toBeInTheDocument();
});

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listingsApi } from '../api/listings';
import { evaluateImageRules, type ListingImageRules } from './imagePolicy';
import { useListingImageRules } from './useListingImageRules';

vi.mock('../api/listings', () => ({ listingsApi: { validateListingRules: vi.fn() } }));
const input = { cardId: 'catalog-common', game: 'Pokemon', rarity: 'Common', price: 100, condition: 'NM' };
const mandatory = evaluateImageRules({ ...input, rarity: undefined });
describe('authoritative listing policy preflight', () => {
  beforeEach(() => vi.clearAllMocks());
  it('uses catalog rules returned by the server rather than the local rarity claim', async () => {
    vi.mocked(listingsApi.validateListingRules).mockResolvedValue(mandatory);
    const { result } = renderHook(() => useListingImageRules(input, true));
    expect(result.current.rules.imageMandatory).toBe(false);
    await waitFor(() => expect(result.current.rules.reasons).toEqual(['UNKNOWN_RARITY']));
    expect(listingsApi.validateListingRules).toHaveBeenCalledWith(input);
  });
  it('ignores an older response after the price changes', async () => {
    let resolveOld!: (rules: ListingImageRules) => void;
    vi.mocked(listingsApi.validateListingRules).mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; })).mockResolvedValueOnce(evaluateImageRules({ ...input, price: 500 }));
    const { result, rerender } = renderHook(({ price }) => useListingImageRules({ ...input, price }, true), { initialProps: { price: 100 } });
    await waitFor(() => expect(listingsApi.validateListingRules).toHaveBeenCalledTimes(1));
    rerender({ price: 500 });
    await waitFor(() => expect(result.current.pending).toBe(false));
    await act(async () => resolveOld(evaluateImageRules(input)));
    expect(result.current.rules.reasons).toEqual(['HIGH_PRICE']);
  });
  it('keeps legacy seller catalogs conservative and exposes preflight failure without blocking hidden drafts', async () => {
    vi.mocked(listingsApi.validateListingRules).mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useListingImageRules({ ...input, cardId: 'seller-listing-manual' }, true));
    expect(result.current.rules.reasons).toEqual(['UNKNOWN_RARITY']);
    await waitFor(() => expect(result.current.failed).toBe(true));
    expect(result.current.pending).toBe(false);
  });
});

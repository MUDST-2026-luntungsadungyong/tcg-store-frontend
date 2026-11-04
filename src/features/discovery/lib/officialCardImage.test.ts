import { describe, expect, it } from 'vitest';
import { officialCardImage } from './officialCardImage';

describe('official card image provenance', () => {
  it('uses catalog image fields for catalog-linked listings', () => {
    expect(officialCardImage({ id: '123', cardId: 'base1-58', imageLarge: '/catalog-large.png', imageSmall: '/catalog-small.png' })).toBe('/catalog-large.png');
  });
  it('never labels a seller-created pseudo catalog image as official', () => {
    expect(officialCardImage({ id: '123', cardId: 'seller-listing-manual', imageLarge: '/seller.png', imageSmall: '/seller.png' })).toBe('');
  });
  it('leaves official art unavailable when only a compatibility cover exists', () => {
    const legacy = { id: '123', image: '/seller-cover.png' };
    expect(officialCardImage(legacy)).toBe('');
  });
});

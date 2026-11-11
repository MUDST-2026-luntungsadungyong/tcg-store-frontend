import { describe, expect, it } from 'vitest';
import { draftFields, draftMultipart, validateDraftStep } from './auctionDraft';

describe('auction draft (one card per auction)', () => {
  it('submits a catalog card with exactly one card quantity without an inventory listing', () => {
    const fields = { ...draftFields(), cardId: 'card-1', quantity: '1', condition: 'NM', startPrice: '100' };
    const photo = new File(['photo'], 'card.png', { type: 'image/png' });
    expect(validateDraftStep(0, fields, false, { front: photo, back: photo }, {}, Date.now())).toEqual({});
    const body = draftMultipart(fields, { front: photo, back: photo });
    expect(body.get('cardId')).toBe('card-1');
    expect(body.get('productId')).toBeNull();
    expect(body.get('quantity')).toBe('1');
    expect(body.get('startPrice')).toBe('100');
  });

  it('rejects multiple cards in one auction', () => {
    const fields = { ...draftFields(), cardId: 'card-1', quantity: '2', condition: 'NM', startPrice: '100' };
    const errors = validateDraftStep(0, fields, false, {}, {}, Date.now());
    expect(errors.quantity).toBe('Auctions can only contain exactly one card.');
  });

  it('rejects invalid quantities and ensures quantity is 1 in draft multipart', () => {
    const fields = { ...draftFields(), productId: '12', quantity: '1.5' };
    expect(validateDraftStep(0, fields, true, {}, {}, Date.now()).quantity).toBeTruthy();
    const body = draftMultipart({ ...fields, quantity: '1' }, {});
    expect(body.get('productId')).toBe('12');
    expect(body.get('cardId')).toBeNull();
    expect(body.get('quantity')).toBe('1');
  });
});

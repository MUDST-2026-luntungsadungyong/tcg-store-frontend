import { describe, expect, it } from 'vitest';
import { draftFields, draftMultipart, validateDraftStep } from './auctionDraft';

describe('auction lot draft', () => {
  it('submits a catalog card and lot quantity without an inventory listing', () => {
    const fields = { ...draftFields(), cardId: 'card-1', quantity: '3', condition: 'NM', startPrice: '100' };
    const photo = new File(['photo'], 'card.png', { type: 'image/png' });
    expect(validateDraftStep(0, fields, false, { front: photo, back: photo }, {}, Date.now())).toEqual({});
    const body = draftMultipart(fields, { front: photo, back: photo });
    expect(body.get('cardId')).toBe('card-1');
    expect(body.get('productId')).toBeNull();
    expect(body.get('quantity')).toBe('3');
    expect(body.get('startPrice')).toBe('100');
  });

  it('rejects a single grading certificate for multiple copies', () => {
    const fields = { ...draftFields(), cardId: 'card-1', quantity: '2', gradingCompany: 'PSA' };
    expect(validateDraftStep(0, fields, false, {}, {}, Date.now()).gradingCompany).toBeTruthy();
  });

  it('rejects invalid lot quantities and preserves inventory submissions', () => {
    const fields = { ...draftFields(), productId: '12', quantity: '1.5' };
    expect(validateDraftStep(0, fields, true, {}, {}, Date.now()).quantity).toBeTruthy();
    const body = draftMultipart({ ...fields, quantity: '2' }, {});
    expect(body.get('productId')).toBe('12');
    expect(body.get('cardId')).toBeNull();
  });
});

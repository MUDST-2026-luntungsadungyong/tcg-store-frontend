import { describe, expect, it } from 'vitest';
import { evaluateImageRules, imageFileError, MAX_IMAGE_BYTES } from './imagePolicy';

describe('listing image policy', () => {
  const common = { game: 'Pokemon', rarity: 'Common', condition: 'NM', price: 499.99 };
  it('has an inclusive 500 baht boundary independent of market price', () => {
    expect(evaluateImageRules(common).imageMandatory).toBe(false);
    expect(evaluateImageRules({ ...common, price: 500 }).reasons).toEqual(['HIGH_PRICE']);
  });
  it.each(['LP', 'MP', 'HP', 'DMG', 'Lightly Played'])('requires photos for %s below the price threshold', condition => {
    expect(evaluateImageRules({ ...common, condition }).reasons).toContain('CONDITION');
  });
  it.each(['PSA', 'BGS', 'CGC'])('requires photos for %s even with common rarity', gradingCompany => {
    expect(evaluateImageRules({ ...common, gradingCompany }).reasons).toEqual(['GRADED']);
  });
  it.each(['SR', 'SAR', 'Alt-Art', 'Rare Ultra', 'Rare Holo'])('requires photos for catalog rarity %s', rarity => {
    expect(evaluateImageRules({ ...common, rarity }).reasons).toEqual(['SPECIAL_RARITY']);
  });
  it('fails closed for missing rarity and unknown games', () => {
    expect(evaluateImageRules({ ...common, rarity: undefined }).reasons).toEqual(['UNKNOWN_RARITY']);
    expect(evaluateImageRules({ ...common, game: 'Unknown' }).imageMandatory).toBe(true);
  });
  it('uses distinct low-risk codes per game and normalizes whitespace', () => {
    expect(evaluateImageRules({ ...common, game: ' One Piece ', rarity: ' uc ' }).imageMandatory).toBe(false);
    expect(evaluateImageRules({ ...common, game: 'YGO', rarity: 'Normal' }).imageMandatory).toBe(false);
    expect(evaluateImageRules({ ...common, game: 'YGO', rarity: 'Uncommon' }).imageMandatory).toBe(true);
    expect(evaluateImageRules({ ...common, game: 'MTG', rarity: 'U' }).imageMandatory).toBe(false);
  });
  it('validates the per-file boundary, type and empty files', () => {
    expect(imageFileError(new File([new Uint8Array(MAX_IMAGE_BYTES)], 'front.png', { type: 'image/png' }))).toBeUndefined();
    expect(imageFileError(new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], 'front.png', { type: 'image/png' }))).toMatch(/5 MiB/);
    expect(imageFileError(new File(['x'], 'front.gif', { type: 'image/gif' }))).toMatch(/JPG/);
    expect(imageFileError(new File([], 'front.png', { type: 'image/png' }))).toMatch(/non-empty/);
  });
});

import { normalizeConditionToCode } from '@/entities/card/model/condition';

export const MAX_ADDITIONAL_IMAGES = 4;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface ListingImageRules {
  imageMandatory: boolean;
  reasons: string[];
  minimumActualPhotos: number;
  maxAdditionalImages: number;
  maxImageSizeBytes: number;
  allowedImageTypes: string[];
}

// Mirrors the server policy for immediate form feedback and the mock API.
// The server always resolves rarity from the selected catalog card again.
export function evaluateImageRules(input: { price: number; condition?: string; gradingCompany?: string; rarity?: string; game?: string }): ListingImageRules {
  const reasons: string[] = [];
  if (input.price >= 500) reasons.push('HIGH_PRICE');
  if (input.gradingCompany?.trim()) reasons.push('GRADED');
  if (normalizeConditionToCode(input.condition || 'NM') !== 'NM') reasons.push('CONDITION');
  const normalize = (value?: string) => value?.trim().replace(/\s+/g, ' ').toUpperCase() || '';
  const rarity = normalize(input.rarity);
  const optionalByGame: Record<string, string[]> = {
    POKEMON: ['COMMON', 'UNCOMMON', 'REGULAR', 'C', 'U'], 'POKÉMON': ['COMMON', 'UNCOMMON', 'REGULAR', 'C', 'U'],
    TRAINER: ['COMMON', 'UNCOMMON', 'REGULAR', 'C', 'U'], ENERGY: ['COMMON', 'UNCOMMON', 'REGULAR', 'C', 'U'],
    YGO: ['COMMON', 'NORMAL', 'C'], 'YU-GI-OH': ['COMMON', 'NORMAL', 'C'], 'YU-GI-OH!': ['COMMON', 'NORMAL', 'C'],
    MTG: ['COMMON', 'UNCOMMON', 'C', 'U'], 'MAGIC: THE GATHERING': ['COMMON', 'UNCOMMON', 'C', 'U'],
    'ONE PIECE': ['COMMON', 'UNCOMMON', 'C', 'UC'],
  };
  const special = ['SR', 'SAR', 'ALT-ART', 'ALT ART', 'ALTERNATE ART', 'SECRET RARE', 'RARE SECRET', 'RARE ULTRA', 'ULTRA RARE', 'SUPER RARE', 'SPECIAL ART RARE', 'SPECIAL ILLUSTRATION RARE', 'RARE HOLO', 'RARE', 'R', 'MYTHIC', 'MYTHIC RARE', 'LEADER', 'L', 'SEC', 'SP'];
  if (!(optionalByGame[normalize(input.game)] ?? []).includes(rarity)) reasons.push(special.includes(rarity) ? 'SPECIAL_RARITY' : 'UNKNOWN_RARITY');
  return { imageMandatory: reasons.length > 0, reasons, minimumActualPhotos: reasons.length ? 2 : 0, maxAdditionalImages: MAX_ADDITIONAL_IMAGES, maxImageSizeBytes: MAX_IMAGE_BYTES, allowedImageTypes: IMAGE_TYPES };
}

export const IMAGE_REASON_LABELS: Record<string, string> = {
  HIGH_PRICE: 'Price is ฿500 or more', GRADED: 'Graded card', CONDITION: 'Card is not Near Mint',
  SPECIAL_RARITY: 'Collectible rarity', UNKNOWN_RARITY: 'Catalog rarity needs verification',
};

export function imageFileError(file: File): string | undefined {
  if (!IMAGE_TYPES.includes(file.type)) return 'Use a JPG, PNG, or WebP image.';
  if (!file.size) return 'Choose a non-empty image.';
  if (file.size > MAX_IMAGE_BYTES) return 'Each image must be 5 MiB or smaller.';
  return undefined;
}

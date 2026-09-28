export const CONDITION_OPTIONS = [
  'Near Mint',
  'Lightly Played',
  'Moderately Played',
  'Heavily Played',
  'Damaged',
] as const;

export type CardCondition = typeof CONDITION_OPTIONS[number];

export const CONDITION_CODE_MAP: Record<string, string> = {
  NM: 'Near Mint',
  LP: 'Lightly Played',
  MP: 'Moderately Played',
  HP: 'Heavily Played',
  DMG: 'Damaged',
};

export const CONDITION_LABEL_TO_CODE: Record<string, string> = {
  'NEAR MINT': 'NM',
  'NM': 'NM',
  'LIGHTLY PLAYED': 'LP',
  'LP': 'LP',
  'MODERATELY PLAYED': 'MP',
  'MP': 'MP',
  'HEAVILY PLAYED': 'HP',
  'HP': 'HP',
  'DAMAGED': 'DMG',
  'DMG': 'DMG',
  'MINT': 'NM',
};

/**
 * Formats a condition abbreviation or string (e.g. 'NM', 'LP', 'Near Mint')
 * into its user-friendly full display name (e.g. 'Near Mint', 'Lightly Played').
 * Preserves custom/graded strings (e.g. 'NM-MT 8 (Near Mint-Mint 8)') if not an abbreviation.
 */
export function formatCondition(condition?: string | null): string {
  if (!condition) return '';
  const trimmed = condition.trim();
  const normalized = trimmed.toUpperCase().replace(/[-_]/g, ' ');

  if (CONDITION_CODE_MAP[normalized]) {
    return CONDITION_CODE_MAP[normalized];
  }

  const code = CONDITION_LABEL_TO_CODE[normalized];
  if (code && CONDITION_CODE_MAP[code]) {
    return CONDITION_CODE_MAP[code];
  }

  return trimmed;
}

/**
 * Normalizes any condition format (full name or abbreviation) into the database abbreviation code ('NM', 'LP', 'MP', 'HP', 'DMG').
 */
export function normalizeConditionToCode(condition?: string | null): string {
  if (!condition) return '';
  const trimmed = condition.trim();
  const normalized = trimmed.toUpperCase().replace(/[-_]/g, ' ');
  return CONDITION_LABEL_TO_CODE[normalized] || trimmed;
}

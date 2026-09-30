import { describe, expect, it } from 'vitest';
import {
  formatCondition,
  normalizeConditionToCode,
  CONDITION_OPTIONS,
} from './condition';

describe('Condition Helpers', () => {
  describe('formatCondition', () => {
    it('formats database abbreviations into full user-friendly names', () => {
      expect(formatCondition('NM')).toBe('Near Mint');
      expect(formatCondition('nm')).toBe('Near Mint');
      expect(formatCondition('LP')).toBe('Lightly Played');
      expect(formatCondition('lp')).toBe('Lightly Played');
      expect(formatCondition('MP')).toBe('Moderately Played');
      expect(formatCondition('mp')).toBe('Moderately Played');
      expect(formatCondition('HP')).toBe('Heavily Played');
      expect(formatCondition('hp')).toBe('Heavily Played');
      expect(formatCondition('DMG')).toBe('Damaged');
      expect(formatCondition('dmg')).toBe('Damaged');
    });

    it('handles already full condition names properly', () => {
      expect(formatCondition('Near Mint')).toBe('Near Mint');
      expect(formatCondition('near mint')).toBe('Near Mint');
      expect(formatCondition('Lightly Played')).toBe('Lightly Played');
      expect(formatCondition('Moderately Played')).toBe('Moderately Played');
      expect(formatCondition('Heavily Played')).toBe('Heavily Played');
      expect(formatCondition('Damaged')).toBe('Damaged');
    });

    it('preserves special graded or tournament strings', () => {
      expect(formatCondition('NM-MT 8 (Near Mint-Mint 8)')).toBe('NM-MT 8 (Near Mint-Mint 8)');
      expect(formatCondition('PSA 10 Gem Mint')).toBe('PSA 10 Gem Mint');
    });

    it('returns empty string for nullish or empty condition', () => {
      expect(formatCondition('')).toBe('');
      expect(formatCondition(null)).toBe('');
      expect(formatCondition(undefined)).toBe('');
    });
  });

  describe('normalizeConditionToCode', () => {
    it('normalizes full condition names to standard DB abbreviation codes', () => {
      expect(normalizeConditionToCode('Near Mint')).toBe('NM');
      expect(normalizeConditionToCode('NEAR MINT')).toBe('NM');
      expect(normalizeConditionToCode('Lightly Played')).toBe('LP');
      expect(normalizeConditionToCode('Moderately Played')).toBe('MP');
      expect(normalizeConditionToCode('Heavily Played')).toBe('HP');
      expect(normalizeConditionToCode('Damaged')).toBe('DMG');
      expect(normalizeConditionToCode('Mint')).toBe('NM');
    });

    it('preserves and normalizes abbreviation codes', () => {
      expect(normalizeConditionToCode('NM')).toBe('NM');
      expect(normalizeConditionToCode('nm')).toBe('NM');
      expect(normalizeConditionToCode('LP')).toBe('LP');
      expect(normalizeConditionToCode('MP')).toBe('MP');
      expect(normalizeConditionToCode('HP')).toBe('HP');
      expect(normalizeConditionToCode('DMG')).toBe('DMG');
    });

    it('handles empty or null values gracefully', () => {
      expect(normalizeConditionToCode('')).toBe('');
      expect(normalizeConditionToCode(null)).toBe('');
      expect(normalizeConditionToCode(undefined)).toBe('');
    });
  });

  describe('CONDITION_OPTIONS', () => {
    it('contains all 5 standard customer-facing condition options', () => {
      expect(CONDITION_OPTIONS).toEqual([
        'Near Mint',
        'Lightly Played',
        'Moderately Played',
        'Heavily Played',
        'Damaged',
      ]);
    });
  });
});

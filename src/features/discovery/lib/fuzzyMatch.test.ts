import { describe, it, expect } from 'vitest';
import { levenshteinDistance, findFuzzySuggestion } from './fuzzyMatch';

describe('US-28-1: Fuzzy Matching & Typo Tolerance', () => {
  describe('levenshteinDistance', () => {
    it('calculates edit distance accurately for typos within 2 edits', () => {
      expect(levenshteinDistance('pokamon', 'Pokemon')).toBe(1);
      expect(levenshteinDistance('chairzard', 'Charizard')).toBe(2);
      expect(levenshteinDistance('pikashu', 'Pikachu')).toBe(1);
      expect(levenshteinDistance('charizard', 'charizard')).toBe(0);
    });

    it('handles empty strings properly', () => {
      expect(levenshteinDistance('', 'abc')).toBe(3);
      expect(levenshteinDistance('abc', '')).toBe(3);
    });
  });

  describe('findFuzzySuggestion', () => {
    it('suggests "Pokemon" for typo "pokamon"', () => {
      const result = findFuzzySuggestion('pokamon');
      expect(result).not.toBeNull();
      expect(result?.suggested).toBe('Pokemon');
      expect(result?.distance).toBe(1);
    });

    it('suggests "Charizard" for typo "chairzard"', () => {
      const result = findFuzzySuggestion('chairzard');
      expect(result).not.toBeNull();
      expect(result?.suggested).toBe('Charizard');
      expect(result?.distance).toBe(2);
    });

    it('suggests "Pikachu" for typo "pikashu"', () => {
      const result = findFuzzySuggestion('pikashu');
      expect(result).not.toBeNull();
      expect(result?.suggested).toBe('Pikachu');
      expect(result?.distance).toBe(1);
    });

    it('returns null if input is an exact match (no typo)', () => {
      expect(findFuzzySuggestion('Charizard')).toBeNull();
      expect(findFuzzySuggestion('pikachu')).toBeNull();
    });

    it('returns null if input distance is greater than 2', () => {
      expect(findFuzzySuggestion('completelydifferentname123')).toBeNull();
    });
  });
});

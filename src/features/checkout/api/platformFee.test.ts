import { describe, expect, it } from 'vitest';
import { calculatePlatformFee } from './platformFee';

describe('platform fee calculation', () => {
  const policy = { rate: 0.05, minimumFee: 20 };

  it('uses the policy minimum for a small direct-sale subtotal', () => {
    expect(calculatePlatformFee(30, policy)).toBe(20);
  });

  it('uses the percentage fee and caps it at the subtotal', () => {
    expect(calculatePlatformFee(1250, policy)).toBe(62.5);
    expect(calculatePlatformFee(10, policy)).toBe(10);
  });
});

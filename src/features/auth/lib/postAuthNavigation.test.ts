import { describe, expect, it } from 'vitest';
import { getPostAuthDestination } from './postAuthNavigation';

describe('getPostAuthDestination', () => {
  it('returns the protected route requested before login', () => {
    expect(getPostAuthDestination('BUYER', { from: '/profile?tab=contact' })).toBe('/profile?tab=contact');
  });

  it('rejects an external redirect and uses the role default', () => {
    expect(getPostAuthDestination('BUYER', { from: '//untrusted.example' })).toBe('/');
  });

  it('uses seller and admin defaults without a saved destination', () => {
    expect(getPostAuthDestination('SELLER', null)).toBe('/workspace/listings');
    expect(getPostAuthDestination('ADMIN', undefined)).toBe('/');
  });
});

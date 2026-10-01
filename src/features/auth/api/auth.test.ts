import { describe, expect, it } from 'vitest';
import { getAuthErrorMessage, toFrontendUser } from './auth';

describe('auth API contract adapters', () => {
  it('maps a regular backend user to a non-seller account', () => {
    expect(toFrontendUser({ id: '42', name: 'Naphat', email: 'naphat@example.com', role: 'USER' })).toEqual({
      id: '42',
      name: 'Naphat',
      email: 'naphat@example.com',
      role: 'USER',
      isSeller: false,
    });
  });

  it('maps a verified seller to a user account with seller capability', () => {
    expect(toFrontendUser({ id: '43', name: 'Seller', email: 'seller@example.com', role: 'USER', sellerStatus: 'VERIFIED' })).toMatchObject({
      role: 'USER',
      isSeller: true,
    });
  });

  it('maps an approved backend seller to a user account with seller capability', () => {
    expect(toFrontendUser({ id: '44', name: 'Seller', email: 'seller@example.com', role: 'USER', sellerStatus: 'APPROVED' })).toMatchObject({
      role: 'USER',
      isSeller: true,
    });
  });

  it('keeps a pending seller application without granting seller capability', () => {
    expect(toFrontendUser({ id: '45', name: 'Pending', email: 'pending@example.com', role: 'USER', sellerStatus: 'PENDING' })).toMatchObject({
      isSeller: false,
      sellerStatus: 'PENDING',
    });
  });

  it('rejects an unknown backend role instead of granting a default role', () => {
    expect(() => toFrontendUser({
      id: '1',
      name: 'Naphat',
      email: 'naphat@example.com',
      role: 'SUPERUSER',
    })).toThrow('Unsupported user role');
  });

  it('keeps a plain API error message useful to the form', () => {
    expect(getAuthErrorMessage(new Error('Email already exists'), 'Sign up failed')).toBe('Email already exists');
  });
});

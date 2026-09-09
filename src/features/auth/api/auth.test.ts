import { describe, expect, it } from 'vitest';
import { getAuthErrorMessage, toFrontendUser } from './auth';

describe('auth API contract adapters', () => {
  it('maps the backend USER role to the frontend BUYER role', () => {
    expect(toFrontendUser({ id: '42', name: 'Naphat', email: 'naphat@example.com', role: 'USER' })).toEqual({
      id: '42',
      name: 'Naphat',
      email: 'naphat@example.com',
      role: 'BUYER',
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

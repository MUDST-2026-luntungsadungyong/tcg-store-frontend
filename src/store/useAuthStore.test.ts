import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from './useAuthStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ token: null, user: null, isHydrating: false });
  });

  it('persists login and clears every auth field on logout', () => {
    const user = { id: '1', name: 'Naphat', email: 'naphat@example.com', role: 'CUSTOMER' as const };
    useAuthStore.getState().login('jwt-token', user);

    expect(localStorage.getItem('token')).toBe('jwt-token');
    expect(useAuthStore.getState().user).toEqual(user);

    useAuthStore.getState().logout();

    expect(localStorage.getItem('token')).toBeNull();
    expect(useAuthStore.getState()).toMatchObject({ token: null, user: null, isHydrating: false });
  });
});

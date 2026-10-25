import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from './useAuthStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    useAuthStore.setState({ token: null, user: null, isHydrating: false });
  });

  it('keeps an unchecked login in the tab session through profile hydration', () => {
    const user = { id: '1', name: 'Naphat', email: 'naphat@example.com', role: 'USER' as const, isSeller: false };
    useAuthStore.getState().login('temporary-token', user, false);
    useAuthStore.getState().completeHydration({ ...user, name: 'Updated' });

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('tcg_auth_storage')).toBeNull();
    expect(sessionStorage.getItem('token')).toBe('temporary-token');
    expect(JSON.parse(sessionStorage.getItem('tcg_auth_storage')!).state.user.name).toBe('Updated');

    useAuthStore.getState().logout();
    expect(sessionStorage.getItem('token')).toBeNull();
    expect(sessionStorage.getItem('tcg_auth_storage')).toBeNull();
  });

  it('removes previous credentials when switching persistence modes', () => {
    const user = { id: '1', name: 'Naphat', email: 'naphat@example.com', role: 'USER' as const, isSeller: false };
    useAuthStore.getState().login('remembered-token', user, true);
    useAuthStore.getState().login('temporary-token', user, false);
    expect(localStorage.getItem('token')).toBeNull();
    useAuthStore.getState().login('remembered-again', user, true);
    expect(sessionStorage.getItem('token')).toBeNull();
    expect(sessionStorage.getItem('tcg_auth_storage')).toBeNull();
    expect(localStorage.getItem('token')).toBe('remembered-again');
  });

  it('preserves an unchecked Remember me choice when profile saves reuse login', () => {
    const user = { id: '1', name: 'Naphat', email: 'naphat@example.com', role: 'USER' as const, isSeller: false };
    useAuthStore.getState().login('temporary-token', user, false);
    useAuthStore.getState().login('temporary-token', { ...user, name: 'Updated' });
    expect(sessionStorage.getItem('token')).toBe('temporary-token');
    expect(localStorage.getItem('token')).toBeNull();
    expect(JSON.parse(sessionStorage.getItem('tcg_auth_storage')!).state.user.name).toBe('Updated');
  });

  it('restores tab credentials on reload without making them persistent', async () => {
    const user = { id: '1', name: 'Naphat', email: 'naphat@example.com', role: 'USER' as const, isSeller: false };
    useAuthStore.getState().login('temporary-token', user, false);
    vi.resetModules();
    const { useAuthStore: reloadedStore } = await import('./useAuthStore');
    expect(reloadedStore.getState()).toMatchObject({ token: 'temporary-token', user });
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('persists login and clears every auth field on logout', () => {
    const user = { id: '1', name: 'Naphat', email: 'naphat@example.com', role: 'USER' as const, isSeller: false };
    useAuthStore.getState().login('jwt-token', user);

    expect(localStorage.getItem('token')).toBe('jwt-token');
    expect(useAuthStore.getState().user).toEqual(user);

    useAuthStore.getState().logout();

    expect(localStorage.getItem('token')).toBeNull();
    expect(useAuthStore.getState()).toMatchObject({ token: null, user: null, isHydrating: false });
  });
});

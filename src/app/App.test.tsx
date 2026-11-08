import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@/entities/account/model/types';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { profileApi } from '@/features/profile/api/profile';
import App from './App';

vi.mock('@/app/router', () => ({ router: {} }));
vi.mock('react-router-dom', () => ({ RouterProvider: () => null }));
vi.mock('@/shared/config/env', () => ({ ENV: { ENABLE_MOCK_API: false } }));
vi.mock('@/features/profile/api/profile', () => ({ profileApi: { get: vi.fn() } }));
vi.mock('@/features/auth/api/auth', () => ({ authApi: { getProfile: vi.fn() } }));
vi.mock('@/shared/api/client', () => ({ configureApiClientAuth: vi.fn() }));
vi.mock('@/shared/components/Toast', () => ({ ToastProvider: () => null }));
vi.mock('@/shared/components/DevSettings', () => ({ DevSettings: () => null }));

const original: User = { id: '1', name: 'Original', email: 'original@test.local', role: 'USER', isSeller: false };

function startHydration() {
  let resolve!: (user: User) => void;
  let reject!: (error: Error) => void;
  vi.mocked(profileApi.get).mockReturnValue(new Promise<User>((ok, fail) => { resolve = ok; reject = fail; }));
  render(<App />);
  expect(profileApi.get).toHaveBeenCalledOnce();
  return { resolve, reject };
}

describe('Account hydration request ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    useAuthStore.getState().logout();
    useAuthStore.getState().login('original-token', original, false);
  });

  it('hydrates the unchanged account normally', async () => {
    const pending = startHydration();
    const refreshed = { ...original, name: 'Server name' };
    await act(async () => pending.resolve(refreshed));
    expect(useAuthStore.getState().user).toEqual(refreshed);
  });

  it('does not overwrite a saved profile with a delayed initial response', async () => {
    const pending = startHydration();
    const edited = { ...original, name: 'Saved name' };
    act(() => useAuthStore.getState().login('original-token', edited));
    await act(async () => pending.resolve(original));
    expect(useAuthStore.getState().user).toEqual(edited);
    expect(JSON.parse(sessionStorage.getItem('tcg_auth_storage')!).state.user.name).toBe('Saved name');
  });

  it('does not restore a logged-out account when the response arrives', async () => {
    const pending = startHydration();
    act(() => useAuthStore.getState().logout());
    await act(async () => pending.resolve(original));
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('does not overwrite a newly signed-in account', async () => {
    const pending = startHydration();
    const next = { ...original, id: '2', name: 'Next account' };
    act(() => useAuthStore.getState().login('next-token', next, false));
    await act(async () => pending.resolve(original));
    expect(useAuthStore.getState().user).toEqual(next);
    expect(useAuthStore.getState().token).toBe('next-token');
  });

  it('does not log out a newer session when the old request fails', async () => {
    const pending = startHydration();
    const next = { ...original, id: '2', name: 'Next account' };
    act(() => useAuthStore.getState().login('next-token', next, false));
    await act(async () => pending.reject(new Error('Old session expired')));
    expect(useAuthStore.getState().user).toEqual(next);
    expect(useAuthStore.getState().token).toBe('next-token');
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authApi } from '@/features/auth/api/auth';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { LoginPage } from './LoginPage';

describe('Login persistence choice', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    useAuthStore.setState({ token: null, user: null, isHydrating: false });
    vi.spyOn(authApi, 'login').mockResolvedValue({
      token: 'test-access-token',
      user: { id: '1', name: 'Trainer', email: 'trainer@example.com', role: 'USER', isSeller: false },
    });
  });

  for (const remember of [false, true]) {
    it(`uses ${remember ? 'persistent' : 'tab'} storage after submitting the login form`, async () => {
      const user = userEvent.setup();
      render(<MemoryRouter initialEntries={['/login']}><Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<p>Signed in</p>} />
      </Routes></MemoryRouter>);
      const checkbox = screen.getByRole('checkbox', { name: 'Remember me' });
      expect(checkbox).not.toBeChecked();
      if (remember) await user.click(checkbox);
      await user.type(screen.getByLabelText('Email'), 'trainer@example.com');
      await user.type(screen.getByLabelText('Password'), 'ExamplePassword123!');
      await user.click(screen.getByRole('button', { name: 'Login' }));
      expect(await screen.findByText('Signed in')).toBeInTheDocument();
      expect((remember ? localStorage : sessionStorage).getItem('token')).toBe('test-access-token');
      expect((remember ? sessionStorage : localStorage).getItem('token')).toBeNull();
      expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain('ExamplePassword123!');
    });
  }
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '@/shared/api/client';
import { authApi } from '@/features/auth/api/auth';
import { ResetPasswordPage } from './ResetPasswordPage';
import { ResetSuccessPage } from './ResetSuccessPage';

vi.mock('@/shared/config/env', () => ({
  ENV: { ENABLE_MOCK_API: false, API_BASE_URL: '/api' },
}));

vi.mock('@/shared/api/client', () => ({
  default: { post: vi.fn() },
}));

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.mocked(apiClient.post).mockReset();
  });

  it('stays on the success page after the API clears the pending reset', async () => {
    vi.mocked(apiClient.post)
      .mockResolvedValueOnce({ data: { exists: true } })
      .mockResolvedValueOnce({ data: undefined });
    await authApi.forgotPassword('naphat@example.com');

    render(
      <MemoryRouter initialEntries={['/reset-password']}>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/reset-success" element={<ResetSuccessPage />} />
          <Route path="/forgot-password" element={<p>Forgot Password</p>} />
        </Routes>
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('New Password'), 'Newpassword123');
    await user.type(screen.getByLabelText('Confirm Password'), 'Newpassword123');
    await user.click(screen.getByRole('button', { name: 'Reset Password' }));

    expect(await screen.findByRole('heading', { name: 'Password Changed Successfully' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Login' })).toHaveAttribute('href', '/login');
    expect(sessionStorage.getItem('mythix_demo_reset_email')).toBeNull();
  });

  it('does not redirect during a rerender after the pending email is cleared', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { exists: true } });
    await authApi.forgotPassword('naphat@example.com');

    const view = render(
      <MemoryRouter initialEntries={['/reset-password']}>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/forgot-password" element={<p>Forgot Password</p>} />
        </Routes>
      </MemoryRouter>,
    );

    sessionStorage.clear();
    view.rerender(
      <MemoryRouter initialEntries={['/reset-password']}>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/forgot-password" element={<p>Forgot Password</p>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument();
  });
});

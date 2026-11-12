import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '@/shared/api/client';
import { ResetPasswordPage } from './ResetPasswordPage';
import { ResetSuccessPage } from './ResetSuccessPage';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { CheckEmailPage } from './CheckEmailPage';

vi.mock('@/shared/config/env', () => ({ ENV: { ENABLE_MOCK_API: false, API_BASE_URL: '/api' } }));
vi.mock('@/shared/api/client', () => ({ default: { post: vi.fn() } }));

function renderFlow(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/reset-success" element={<ResetSuccessPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/check-email" element={<CheckEmailPage />} />
  </Routes></MemoryRouter>);
}

describe('password recovery', () => {
  beforeEach(() => vi.mocked(apiClient.post).mockReset());

  it('requests a link without revealing whether the email is registered', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: undefined });
    renderFlow('/forgot-password');
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Email'), 'person@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));
    expect(await screen.findByText(/If an account exists for that email/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Resend in/ })).toBeDisabled();
    expect(apiClient.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'person@example.com' });
  });

  it('resends to the original email and restarts the cooldown', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: undefined });
    render(<MemoryRouter initialEntries={[{ pathname: '/check-email', state: { email: 'person@example.com', sentAt: Date.now() - 61_000 } }]}>
      <Routes><Route path="/check-email" element={<CheckEmailPage />} /></Routes>
    </MemoryRouter>);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Resend Email' }));
    expect(apiClient.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'person@example.com' });
    expect(await screen.findByText(/If an account exists, another link will be sent/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Resend in/ })).toBeDisabled();
  });

  it('displays resend failure and leaves the button available for retry', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Network unavailable'));
    render(<MemoryRouter initialEntries={[{ pathname: '/check-email', state: { email: 'person@example.com', sentAt: Date.now() - 61_000 } }]}>
      <Routes><Route path="/check-email" element={<CheckEmailPage />} /></Routes>
    </MemoryRouter>);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Resend Email' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Network unavailable');
    expect(screen.getByRole('button', { name: 'Resend Email' })).toBeEnabled();
  });

  it('sends the link token and password, then shows the success page', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: undefined });
    renderFlow('/reset-password?token=secure-token');
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('New Password'), 'Newpassword123');
    await user.type(screen.getByLabelText('Confirm Password'), 'Newpassword123');
    await user.click(screen.getByRole('button', { name: 'Reset Password' }));
    expect(await screen.findByRole('heading', { name: 'Password Changed Successfully' })).toBeInTheDocument();
    expect(apiClient.post).toHaveBeenCalledWith('/auth/reset-password', { token: 'secure-token', newPassword: 'Newpassword123' });
  });

  it('offers a new link when the token is missing', () => {
    renderFlow('/reset-password');
    expect(screen.getByRole('link', { name: 'Request a new link' })).toHaveAttribute('href', '/forgot-password');
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('offers a new link when the server rejects an expired or used token', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new AxiosError('Bad Request', 'ERR_BAD_REQUEST', undefined, undefined,
      { status: 400, statusText: 'Bad Request', headers: {}, config: {} as never, data: {} }));
    renderFlow('/reset-password?token=expired-token');
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('New Password'), 'Newpassword123');
    await user.type(screen.getByLabelText('Confirm Password'), 'Newpassword123');
    await user.click(screen.getByRole('button', { name: 'Reset Password' }));
    expect(await screen.findByRole('link', { name: 'Request a new link' })).toBeInTheDocument();
  });
});

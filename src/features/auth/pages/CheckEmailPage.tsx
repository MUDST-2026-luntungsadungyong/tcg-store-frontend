import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { AuthLayout } from '@/features/auth/layouts/AuthLayout';
import { Button } from '@/shared/components/Button';
import { authApi, getAuthErrorMessage } from '@/features/auth/api/auth';

const RESEND_DELAY_MS = 60_000;

export function CheckEmailPage() {
  const location = useLocation();
  const state = location.state as { email?: string; sentAt?: number } | null;
  const email = state?.email;
  const [nextResendAt, setNextResendAt] = useState((state?.sentAt ?? Date.now()) + RESEND_DELAY_MS);
  const [now, setNow] = useState(Date.now());
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');
  const secondsLeft = Math.max(0, Math.ceil((nextResendAt - now) / 1000));

  useEffect(() => {
    if (!secondsLeft) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  async function handleResend() {
    if (!email || secondsLeft || isResending) return;
    setError('');
    setResent(false);
    setIsResending(true);
    try {
      await authApi.forgotPassword(email);
      const sentAt = Date.now();
      setNow(sentAt);
      setNextResendAt(sentAt + RESEND_DELAY_MS);
      setResent(true);
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Could not request another link. Please try again.'));
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AuthLayout title="Check Your Email">
      <div className="mt-4 flex flex-col items-center gap-3 text-center">
        <MailCheck className="size-10 text-brand-blue" />
        <p className="text-sm text-gray-400">
          If an account exists for that email, we'll send a password reset link. Please check your inbox and spam folder.
        </p>
      </div>

      <div className="mt-6 space-y-5">
        {email ? <Button
          type="button"
          variant="primary"
          size="lg"
          className="w-full font-semibold"
          isLoading={isResending}
          disabled={secondsLeft > 0}
          onClick={handleResend}
        >
          {isResending ? 'Sending…' : secondsLeft ? `Resend in ${secondsLeft}s` : 'Resend Email'}
        </Button> : (
          <p className="text-center text-sm text-gray-400">
            <Link to="/forgot-password" className="font-medium text-brand-blue hover:underline">Request another link</Link>
          </p>
        )}

        {resent && (
          <p role="status" aria-live="polite" className="text-center text-sm text-status-success">
            If an account exists, another link will be sent.
          </p>
        )}
        {error && <p role="alert" className="text-center text-sm text-status-danger">{error}</p>}
      </div>

      <p className="mt-6 text-center text-sm text-gray-400">
        Didn't get it?{' '}
        <Link to="/login" className="font-medium text-brand-blue hover:text-brand-blue/80 hover:underline">
          Back to Login
        </Link>
      </p>
    </AuthLayout>
  );
}

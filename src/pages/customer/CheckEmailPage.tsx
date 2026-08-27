import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/common/Button';
import { authApi } from '@/api/auth';

export function CheckEmailPage() {
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleResend() {
    setIsResending(true);
    try {
      await authApi.forgotPassword('');
      setResent(true);
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AuthLayout title="Check Your Email">
      <div className="mt-4 flex flex-col items-center gap-3 text-center">
        <MailCheck className="size-10 text-brand-blue" />
        <p className="text-sm text-gray-400">
          We've sent a password reset link to your email. Check your inbox and follow the instructions.
        </p>
      </div>

      <div className="mt-6 space-y-5">
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="w-full font-semibold"
          isLoading={isResending}
          onClick={handleResend}
        >
          {isResending ? 'Resending…' : 'Resend Email'}
        </Button>

        {resent && (
          <p role="status" aria-live="polite" className="text-center text-sm text-status-success">
            Email resent.
          </p>
        )}
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

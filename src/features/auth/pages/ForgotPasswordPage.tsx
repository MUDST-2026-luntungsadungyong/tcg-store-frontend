import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, AlertCircle } from 'lucide-react';
import { AuthLayout } from '@/features/auth/layouts/AuthLayout';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { authApi, getAuthErrorMessage } from '@/features/auth/api/auth';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      navigate('/check-email', { state: { email: email.trim(), sentAt: Date.now() } });
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Could not request a reset. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout title="Forgot Password">
      <p className="mt-3 text-center text-sm text-gray-400">
        Enter your email address and we'll send you a link to reset your password if an account exists.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        <Input
          id="email"
          type="email"
          label="Email"
          icon={Mail}
          placeholder="you@example.com"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="flex items-center gap-2 rounded-md bg-status-danger/10 px-3 py-2 text-sm text-status-danger ring-1 ring-status-danger/20"
          >
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        <Button type="submit" variant="primary" size="lg" className="w-full font-semibold" isLoading={isLoading}>
          {isLoading ? 'Sending…' : 'Send Reset Link'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-400">
        Remember your password?{' '}
        <Link to="/login" className="font-medium text-brand-blue hover:text-brand-blue/80 hover:underline">
          Login
        </Link>
      </p>
    </AuthLayout>
  );
}

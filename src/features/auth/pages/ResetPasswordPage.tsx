import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { AuthLayout } from '@/features/auth/layouts/AuthLayout';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { authApi, getAuthErrorMessage, hasPendingDemoReset } from '@/features/auth/api/auth';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!hasPendingDemoReset()) return <Navigate to="/forgot-password" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8 || password.length > 72) {
      setError('Password must be between 8 and 72 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(password);
      navigate('/reset-success');
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Could not reset password. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout title="Reset Password">
      <p className="mt-3 text-center text-sm text-gray-400">Demo flow: this changes the account password without email verification.</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        <div className="relative">
          <Input
            id="new-password"
            type={showPassword ? 'text' : 'password'}
            label="New Password"
            icon={Lock}
            placeholder="••••••••"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
            className="pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute bottom-0 right-1 flex h-[44px] w-9 items-center justify-center text-gray-300 transition-colors hover:text-brand-blue focus:text-brand-blue focus:outline-none"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <Input
          id="confirm-password"
          type={showPassword ? 'text' : 'password'}
          label="Confirm Password"
          icon={Lock}
          placeholder="••••••••"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
          {isLoading ? 'Resetting…' : 'Reset Password'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-400">
        <Link to="/login" className="font-medium text-brand-blue hover:text-brand-blue/80 hover:underline">
          Back to Login
        </Link>
      </p>
    </AuthLayout>
  );
}

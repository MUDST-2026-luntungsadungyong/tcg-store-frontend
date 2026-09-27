import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle, Check, X } from 'lucide-react';
import { AuthLayout } from '@/features/auth/layouts/AuthLayout';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { authApi, getAuthErrorMessage, hasPendingDemoReset } from '@/features/auth/api/auth';
import { PASSWORD_RULES } from '@/features/auth/lib/passwordRules';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Capture entry permission once; the API clears it after a successful reset.
  const [resetStarted] = useState(hasPendingDemoReset);
  const passwordValid = PASSWORD_RULES.every((rule) => rule.test(password));
  const passwordsMatch = confirmPassword.length === 0 || confirmPassword === password;

  if (!resetStarted) return <Navigate to="/forgot-password" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!passwordValid) {
      setError('Password does not meet the requirements');
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
            aria-describedby="new-password-requirements"
            minLength={8}
            maxLength={72}
            required
            className="pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
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
        {(passwordFocused || password.length > 0) && (
          <ul id="new-password-requirements" className="space-y-1">
            {PASSWORD_RULES.map((rule) => {
              const ok = rule.test(password);
              return (
                <li
                  key={rule.label}
                  className={`flex items-center gap-1.5 text-xs transition-colors ${ok ? 'text-status-success' : 'text-gray-500'}`}
                >
                  {ok ? <Check size={13} className="shrink-0" /> : <X size={13} className="shrink-0" />}
                  {rule.label}
                </li>
              );
            })}
          </ul>
        )}

        <div>
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
          {!passwordsMatch && (
            <p className="mt-1.5 text-xs text-status-danger">Passwords do not match</p>
          )}
        </div>

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

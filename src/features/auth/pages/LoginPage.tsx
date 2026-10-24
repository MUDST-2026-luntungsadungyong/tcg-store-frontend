import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { AuthLayout } from '@/features/auth/layouts/AuthLayout';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { authApi, getAuthErrorMessage } from '@/features/auth/api/auth';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { getPostAuthDestination } from '@/features/auth/lib/postAuthNavigation';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { token, user } = await authApi.login(email, password);
      login(token, user, rememberMe);
      navigate(getPostAuthDestination(user, location.state));
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Login failed'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout title="Welcome back!">
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

        <div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              icon={Lock}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="pr-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute bottom-0 right-1 flex h-[44px] w-11 items-center justify-center text-gray-300 transition-colors hover:text-brand-blue focus:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-md"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3">
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                name="remember-me"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="size-4 shrink-0 cursor-pointer rounded border-white/20 accent-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg-elevated"
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="inline-flex min-h-11 items-center rounded-md px-1 text-sm font-medium text-brand-blue hover:text-brand-blue/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue">
              Forgot password?
            </Link>
          </div>
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
          {isLoading ? 'Signing in…' : 'Login'}
        </Button>
      </form>

      <p className="mt-5 flex flex-wrap items-center justify-center gap-x-1 text-center text-sm text-gray-400 md:mt-6">
        Don't have an account?{' '}
        <Link to="/register" state={location.state} className="inline-flex min-h-11 items-center rounded-md px-1 font-medium text-brand-blue hover:text-brand-blue/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}

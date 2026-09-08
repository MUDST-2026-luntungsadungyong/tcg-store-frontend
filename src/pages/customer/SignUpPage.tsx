import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Check, X, UserRound } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { authApi, getAuthErrorMessage } from '@/api/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { getPostAuthDestination } from '@/auth/postAuthNavigation';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { label: 'One uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'One number', test: (v: string) => /[0-9]/.test(v) },
];
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export function SignUpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const passwordValid = PASSWORD_RULES.every((rule) => rule.test(password));
  const passwordsMatch = confirmPassword.length === 0 || confirmPassword === password;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      setError('Enter a valid email address');
      return;
    }

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
      const { token, user } = await authApi.register(name.trim(), email, password);
      login(token, user);
      navigate(getPostAuthDestination(user.role, location.state));
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Sign up failed'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout title="Create account">
      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        <Input
          id="name"
          type="text"
          label="Name"
          icon={UserRound}
          placeholder="Your name"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
              autoComplete="new-password"
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
            <ul className="mt-2 space-y-1">
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
        </div>

        <div>
          <Input
            id="confirm-password"
            type={showPassword ? 'text' : 'password'}
            label="Confirm Password"
            icon={Lock}
            placeholder="••••••••"
            autoComplete="new-password"
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
          {isLoading ? 'Creating account…' : 'Sign Up'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-400">
        Already have an account?{' '}
        <Link to="/login" state={location.state} className="font-medium text-brand-blue hover:text-brand-blue/80 hover:underline">
          Login
        </Link>
      </p>
    </AuthLayout>
  );
}

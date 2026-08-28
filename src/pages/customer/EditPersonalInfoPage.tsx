import { useRef, useState, type FormEvent, type FocusEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, User, Mail, Phone as PhoneIcon, Camera, Trash2 } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { usersApi } from '@/api/users';
import { useAuthStore } from '@/store/useAuthStore';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

function validateName(v: string) {
  return v.trim() ? '' : 'Full name is required';
}

function validateEmail(v: string) {
  if (!v.trim()) return 'Email is required';
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address';
  return '';
}

export function EditPersonalInfoPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const login = useAuthStore((s) => s.login);

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [avatarError, setAvatarError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string }>({});
  const [submitError, setSubmitError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ponytail: no real upload endpoint — reads the file client-side and stores it as a data URL, same as any other profile field
  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('File must be an image');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError('Image must be under 2MB');
      return;
    }

    setAvatarError('');
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleBlur(field: 'name' | 'email') {
    return (e: FocusEvent<HTMLInputElement>) => {
      const message = field === 'name' ? validateName(e.target.value) : validateEmail(e.target.value);
      setFieldErrors((prev) => ({ ...prev, [field]: message || undefined }));
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const nameError = validateName(name);
    const emailError = validateEmail(email);
    if (nameError || emailError) {
      setFieldErrors({ name: nameError || undefined, email: emailError || undefined });
      (nameError ? nameRef : emailRef).current?.focus();
      return;
    }

    if (!user || !token) return;
    setSubmitError('');
    setIsLoading(true);
    try {
      const updated = await usersApi.updateProfile(user.id, { name, email, phone, avatarUrl });
      login(token, updated);
      navigate('/profile');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-[900px] mx-auto px-8 py-16 w-full">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/profile" className="hover:text-white transition-colors">Profile</Link>
        <ChevronRight size={14} />
        <span className="text-white">Edit Personal Information</span>
      </nav>

      <section className="glass-card rounded-2xl px-8 py-7">
        <h1 className="text-2xl font-bold text-white mb-6">Personal Information</h1>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="flex items-start gap-5">
            <div className="flex shrink-0 flex-col items-center gap-2">
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="size-20 rounded-full object-cover ring-1 ring-white/10"
                  />
                ) : (
                  <span className="flex size-20 items-center justify-center rounded-full bg-brand-blue/20 text-2xl font-bold text-brand-blue ring-1 ring-brand-blue/40">
                    {(name || 'J').charAt(0).toUpperCase()}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  aria-label="Change profile picture"
                  className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-brand-blue text-white ring-2 ring-bg-card transition-colors hover:bg-[#4a85e0] focus:outline-none focus:ring-2 focus:ring-brand-blue/50"
                >
                  <Camera size={15} />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              <p className="text-center text-xs text-gray-400">JPG or PNG, up to 2MB</p>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-status-danger hover:underline"
                >
                  <Trash2 size={12} />
                  Remove
                </button>
              )}
              {avatarError && (
                <p role="alert" className="text-center text-xs text-status-danger">{avatarError}</p>
              )}
            </div>

            <Input
              ref={nameRef}
              id="name"
              label="Full Name *"
              icon={User}
              autoComplete="name"
              required
              className="flex-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleBlur('name')}
              error={fieldErrors.name}
            />
          </div>
          <Input
            ref={emailRef}
            id="email"
            type="email"
            label="Email *"
            icon={Mail}
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={handleBlur('email')}
            error={fieldErrors.email}
          />
          <Input
            id="phone"
            type="tel"
            label="Phone"
            icon={PhoneIcon}
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          {submitError && (
            <p role="alert" aria-live="polite" className="text-sm text-status-danger">
              {submitError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => navigate('/profile')}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              {isLoading ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

import { useRef, useState, type FormEvent, type FocusEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, CreditCard, User, Calendar, Lock } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { usersApi } from '@/api/users';
import { useAuthStore } from '@/store/useAuthStore';
import visaLogo from '@/assets/cards/visa.webp';
import mastercardLogo from '@/assets/cards/mastercard.svg';
import amexLogo from '@/assets/cards/amex.svg';
import discoverLogo from '@/assets/cards/discover.png';

const BRAND_LOGOS: Record<string, string> = {
  Visa: visaLogo,
  Mastercard: mastercardLogo,
  Amex: amexLogo,
  Discover: discoverLogo,
};

function BrandIcon({ brand, size = 18, className }: { brand: string } & LucideProps) {
  return <img src={BRAND_LOGOS[brand]} alt={brand} width={size} className={className} />;
}

function CardPreview({ number, name, expiry, brand }: { number: string; name: string; expiry: string; brand: string }) {
  const displayNumber = (number || '#### #### #### ####').padEnd(19, '#').slice(0, 19);

  return (
    <div className="aspect-[1.586/1] w-full max-w-[360px] rounded-2xl bg-gradient-to-br from-bg-elevated to-bg-card p-6 ring-1 ring-white/10 shadow-xl">
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="h-8 w-11 rounded-md bg-gradient-to-br from-brand-gold/70 to-brand-gold/30" />
          {brand ? (
            <BrandIcon brand={brand} size={36} className="h-9 w-auto object-contain" />
          ) : (
            <CreditCard size={28} className="text-white/40" />
          )}
        </div>

        <p className="font-mono text-lg tracking-widest text-white sm:text-xl">{displayNumber}</p>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400">Card Holder</p>
            <p className="max-w-[200px] truncate text-sm font-semibold uppercase text-white">
              {name || 'Your Name'}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400">Expires</p>
            <p className="text-sm font-semibold text-white">{expiry || 'MM/YY'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

// ponytail: IIN-prefix ranges only, no full BIN table — covers the brands checkout actually needs to distinguish
function detectCardBrand(digits: string): string {
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'Amex';
  if (/^6(?:011|5)/.test(digits)) return 'Discover';
  return '';
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

function validateCardNumber(v: string) {
  const digits = v.replace(/\D/g, '');
  return digits.length >= 13 && digits.length <= 19 ? '' : 'Enter a valid card number';
}

function validateName(v: string) {
  return v.trim() ? '' : 'Name on card is required';
}

function validateExpiry(v: string) {
  const match = /^(\d{2})\/(\d{2})$/.exec(v);
  if (!match) return 'Use MM/YY format';
  const month = Number(match[1]);
  if (month < 1 || month > 12) return 'Enter a valid month';
  const expiry = new Date(2000 + Number(match[2]), month);
  if (expiry < new Date()) return 'Card has expired';
  return '';
}

function validateCvv(v: string) {
  return /^\d{3,4}$/.test(v) ? '' : 'Enter a valid CVV';
}

type FieldName = 'cardNumber' | 'name' | 'expiry' | 'cvv';

export function EditPaymentMethodPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const login = useAuthStore((s) => s.login);

  const [cardNumber, setCardNumber] = useState('');
  const [name, setName] = useState(user?.cardHolder ?? user?.name ?? '');
  const [expiry, setExpiry] = useState(user?.cardExpiry ?? '');
  const [cvv, setCvv] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [submitError, setSubmitError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const cardBrand = detectCardBrand(cardNumber.replace(/\D/g, ''));
  const cardNumberIcon = cardBrand
    ? (props: LucideProps) => <BrandIcon brand={cardBrand} {...props} />
    : CreditCard;

  const refs: Record<FieldName, React.RefObject<HTMLInputElement | null>> = {
    cardNumber: useRef<HTMLInputElement>(null),
    name: useRef<HTMLInputElement>(null),
    expiry: useRef<HTMLInputElement>(null),
    cvv: useRef<HTMLInputElement>(null),
  };

  const validators: Record<FieldName, (v: string) => string> = {
    cardNumber: validateCardNumber,
    name: validateName,
    expiry: validateExpiry,
    cvv: validateCvv,
  };

  function handleBlur(field: FieldName) {
    return (e: FocusEvent<HTMLInputElement>) => {
      const message = validators[field](e.target.value);
      setFieldErrors((prev) => ({ ...prev, [field]: message || undefined }));
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const values: Record<FieldName, string> = { cardNumber, name, expiry, cvv };
    const errors: Partial<Record<FieldName, string>> = {};
    let firstInvalid: FieldName | null = null;
    (Object.keys(validators) as FieldName[]).forEach((field) => {
      const message = validators[field](values[field]);
      if (message) {
        errors[field] = message;
        firstInvalid ??= field;
      }
    });

    if (firstInvalid) {
      setFieldErrors(errors);
      refs[firstInvalid].current?.focus();
      return;
    }

    if (!user || !token) return;
    setSubmitError('');
    setIsLoading(true);
    try {
      // ponytail: mock checkout only — persist last4/holder/expiry, never the full number or CVV
      const cardLast4 = cardNumber.replace(/\D/g, '').slice(-4);
      const updated = await usersApi.updateProfile(user.id, { cardLast4, cardHolder: name, cardExpiry: expiry, cardBrand });
      login(token, updated);
      navigate('/profile');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update payment method');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-[1100px] mx-auto px-8 py-16 w-full">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/profile" className="hover:text-white transition-colors">Profile</Link>
        <ChevronRight size={14} />
        <span className="text-white">Edit Payment Method</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
        <div className="flex justify-center lg:sticky lg:top-24 lg:justify-start">
          <CardPreview number={cardNumber} name={name} expiry={expiry} brand={cardBrand} />
        </div>

        <section className="glass-card rounded-2xl px-8 py-7">
        <h1 className="text-2xl font-bold text-white mb-6">Payment Method</h1>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Input
            ref={refs.cardNumber}
            id="card-number"
            label="Card Number *"
            icon={cardNumberIcon}
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="1234 5678 9012 3456"
            required
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            onBlur={handleBlur('cardNumber')}
            error={fieldErrors.cardNumber}
          />
          <Input
            ref={refs.name}
            id="card-name"
            label="Name on Card *"
            icon={User}
            autoComplete="cc-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleBlur('name')}
            error={fieldErrors.name}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              ref={refs.expiry}
              id="card-expiry"
              label="Expiry Date *"
              icon={Calendar}
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM / YY"
              required
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              onBlur={handleBlur('expiry')}
              error={fieldErrors.expiry}
            />
            <Input
              ref={refs.cvv}
              id="card-cvv"
              label="CVV *"
              icon={Lock}
              type="password"
              inputMode="numeric"
              autoComplete="cc-csc"
              maxLength={4}
              required
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
              onBlur={handleBlur('cvv')}
              error={fieldErrors.cvv}
            />
          </div>

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
              {isLoading ? 'Saving…' : 'Save Payment'}
            </Button>
          </div>
        </form>
        </section>
      </div>
    </div>
  );
}

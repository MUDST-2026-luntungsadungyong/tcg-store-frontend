import { useRef, useState, type FormEvent, type FocusEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, CreditCard, User, Calendar, Lock } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { usersApi } from '@/api/users';
import { useAuthStore } from '@/store/useAuthStore';

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
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
      const updated = await usersApi.updateProfile(user.id, { cardLast4, cardHolder: name, cardExpiry: expiry });
      login(token, updated);
      navigate('/profile');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update payment method');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-[900px] mx-auto px-8 py-16 w-full">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/profile" className="hover:text-white transition-colors">Profile</Link>
        <ChevronRight size={14} />
        <span className="text-white">Edit Payment Method</span>
      </nav>

      <section className="glass-card rounded-2xl px-8 py-7">
        <h1 className="text-2xl font-bold text-white mb-6">Payment Method</h1>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Input
            ref={refs.cardNumber}
            id="card-number"
            label="Card Number *"
            icon={CreditCard}
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
  );
}

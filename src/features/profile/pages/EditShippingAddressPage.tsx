import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, Package } from 'lucide-react';
import { Input } from '@/shared/components/Input';
import { Select } from '@/shared/components/Select';
import { Button } from '@/shared/components/Button';
import { usersApi } from '@/features/profile/api/users';
import { useAuthStore } from '@/features/auth';

// ponytail: no real postal-code lookup service — a tiny static table stands in until one exists
const POSTAL_LOOKUP: Record<string, { subDistrict: string; district: string; province: string }> = {
  '10110': { subDistrict: 'Khlong Tan Nuea', district: 'Watthana', province: 'Bangkok' },
  '10330': { subDistrict: 'Wang Mai', district: 'Pathum Wan', province: 'Bangkok' },
  '50200': { subDistrict: 'Si Phum', district: 'Mueang Chiang Mai', province: 'Chiang Mai' },
};

const PROVINCES = ['Bangkok', 'Chiang Mai', 'Nonthaburi', 'Pathum Thani', 'Nakhon Ratchasima'];

function optionsFrom(values: string[]) {
  return values.map((v) => ({ value: v, label: v }));
}

function Barcode() {
  // ponytail: decorative pattern, not a scannable barcode — this is a shipping-label mockup, not a real carrier label
  const widths = [2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1];
  return (
    <div className="flex h-10 items-stretch gap-[2px]">
      {widths.map((w, i) => (
        <span key={i} className="bg-white" style={{ width: `${w * 2}px` }} />
      ))}
    </div>
  );
}

function ShippingLabelPreview({
  name,
  addressLine,
  subDistrict,
  district,
  province,
  postalCode,
}: {
  name: string;
  addressLine: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
}) {
  return (
    <div className="w-full max-w-[360px] rounded-lg bg-bg-elevated p-5 text-white shadow-xl ring-1 ring-white/10">
      <div className="flex items-center justify-between border-b-2 border-dashed border-white/15 pb-3">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">
          <Package size={14} />
          Mythix Market
        </div>
        <span className="rounded bg-brand-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-gold">
          Standard
        </span>
      </div>

      <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-gray-500">Ship To</p>
      <p className="mt-1 text-lg font-bold leading-tight text-white">{name || 'Recipient Name'}</p>
      <p className="mt-1 text-sm leading-snug text-gray-300">
        {addressLine || 'House No., Street'}
        <br />
        {[subDistrict, district].filter(Boolean).join(', ') || 'Sub-district, District'}
        <br />
        {[province, postalCode].filter(Boolean).join(' ') || 'Province, Postal Code'}
      </p>

      <div className="mt-4 border-t-2 border-dashed border-white/15 pt-3">
        <Barcode />
        <p className="mt-1 text-center text-[10px] font-mono tracking-[0.3em] text-gray-500">
          {(postalCode || '00000').padEnd(5, '0')}-TH
        </p>
      </div>
    </div>
  );
}

export function EditShippingAddressPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const login = useAuthStore((s) => s.login);

  const [postalCode, setPostalCode] = useState(user?.postalCode ?? '');
  const [subDistrict, setSubDistrict] = useState(user?.subDistrict ?? '');
  const [district, setDistrict] = useState(user?.district ?? '');
  const [province, setProvince] = useState(user?.province ?? '');
  const [addressLine, setAddressLine] = useState(user?.addressLine ?? '');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function handlePostalCodeChange(value: string) {
    setPostalCode(value);
    const match = POSTAL_LOOKUP[value];
    if (match) {
      setSubDistrict(match.subDistrict);
      setDistrict(match.district);
      setProvince(match.province);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !token) return;
    setError('');
    setIsLoading(true);
    try {
      const updated = await usersApi.updateProfile(user.id, {
        postalCode,
        subDistrict,
        district,
        province,
        addressLine,
      });
      login(token, updated);
      navigate('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update address');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-[1100px] mx-auto px-8 py-16 w-full">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/profile" className="hover:text-white transition-colors">Profile</Link>
        <ChevronRight size={14} />
        <span className="text-white">Edit Shipping Address</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
        <div className="flex justify-center lg:sticky lg:top-24 lg:justify-start">
          <ShippingLabelPreview
            name={user?.name ?? ''}
            addressLine={addressLine}
            subDistrict={subDistrict}
            district={district}
            province={province}
            postalCode={postalCode}
          />
        </div>

        <section className="glass-card rounded-2xl px-8 py-7">
        <h1 className="text-2xl font-bold text-white mb-6">Shipping Address</h1>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <Input
              id="postal-code"
              label="Postal Code"
              icon={MapPin}
              autoComplete="postal-code"
              inputMode="numeric"
              maxLength={5}
              required
              value={postalCode}
              onChange={(e) => handlePostalCodeChange(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-gray-500">
              We'll auto-fill sub-district, district, and province from your postal code.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              id="sub-district"
              label="Sub-district"
              required
              value={subDistrict}
              onChange={(e) => setSubDistrict(e.target.value)}
            />
            <Input
              id="district"
              label="District"
              required
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            />
          </div>

          <Select
            id="province"
            label="Province"
            required
            options={[{ value: '', label: 'Select province' }, ...optionsFrom(PROVINCES)]}
            value={province}
            onChange={(e) => setProvince(e.target.value)}
          />

          <Input
            id="address-line"
            label="Address (House No., Street)"
            autoComplete="address-line1"
            required
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
          />

          {error && (
            <p role="alert" aria-live="polite" className="text-sm text-status-danger">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => navigate('/profile')}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              {isLoading ? 'Saving…' : 'Save Address'}
            </Button>
          </div>
        </form>
        </section>
      </div>
    </div>
  );
}

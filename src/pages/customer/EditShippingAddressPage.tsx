import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { usersApi } from '@/api/users';
import { useAuthStore } from '@/store/useAuthStore';

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
    <div className="max-w-[900px] mx-auto px-8 py-16 w-full">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/profile" className="hover:text-white transition-colors">Profile</Link>
        <ChevronRight size={14} />
        <span className="text-white">Edit Shipping Address</span>
      </nav>

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
  );
}

import { useEffect, useState } from 'react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { storesApi, type StoreProfileInput } from '../api/stores';

const emptyProfile: StoreProfileInput = { shopName: '', shopDescription: '', phone: '', line: '', facebook: '', otherContact: '' };

export function StoreSettingsPage() {
  const [form, setForm] = useState<StoreProfileInput>(emptyProfile);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    storesApi.mine().then(({ sellerId: _sellerId, ...profile }) => setForm({ ...emptyProfile, ...profile }))
      .catch(() => setNote('Unable to load store profile.'));
  }, []);

  const change = (key: keyof StoreProfileInput, value: string) => setForm(current => ({ ...current, [key]: value }));
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const { sellerId: _sellerId, ...profile } = await storesApi.update(form);
      setForm({ ...emptyProfile, ...profile });
      setNote('Store profile saved.');
    } catch { setNote('Unable to save store profile.'); } finally { setSaving(false); }
  }

  return <section className="mx-auto max-w-3xl">
    <h1 className="text-3xl font-bold">Store Profile</h1>
    <p className="mt-2 text-gray-400">ชื่อและคำอธิบายแสดงบนหน้าร้าน ส่วนช่องทางติดต่อจะแสดงเฉพาะ buyer ที่มีออเดอร์กับร้านแล้ว</p>
    <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl border border-white/10 bg-white/[.03] p-6">
      <Input id="shopName" label="Store name" required value={form.shopName} onChange={event => change('shopName', event.target.value)} />
      <label className="block text-sm font-medium">Description<textarea className="mt-2 min-h-28 w-full rounded-lg border border-white/15 bg-bg-input p-3" value={form.shopDescription} onChange={event => change('shopDescription', event.target.value)} /></label>
      <Input id="phone" label="Phone" value={form.phone} onChange={event => change('phone', event.target.value)} />
      <Input id="line" label="Line ID / URL" value={form.line} onChange={event => change('line', event.target.value)} />
      <Input id="facebook" label="Facebook" value={form.facebook} onChange={event => change('facebook', event.target.value)} />
      <Input id="otherContact" label="Other contact" value={form.otherContact} onChange={event => change('otherContact', event.target.value)} />
      {note && <p role="status">{note}</p>}<Button type="submit" isLoading={saving}>Save store profile</Button>
    </form>
  </section>;
}

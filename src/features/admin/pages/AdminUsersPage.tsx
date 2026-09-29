import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, ShieldCheck } from 'lucide-react';
import apiClient from '@/shared/api/client';
import { Button } from '@/shared/components/Button';

type Admin = { id: string; name: string; email: string; role: 'ADMIN'; sellerStatus: string };
type CreateAdmin = { name: string; email: string; password: string };

const emptyForm: CreateAdmin = { name: '', email: '', password: '' };

export function AdminUsersPage() {
  const [query, setQuery] = useState('');
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [form, setForm] = useState<CreateAdmin>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setError('');
      const response = await apiClient.get<Admin[]>('/admin/users', { params: { search: query } });
      setAdmins(response.data);
    } catch {
      setError('Unable to load administrators.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [query]);

  const createAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      setError('');
      const response = await apiClient.post<Admin>('/admin/users', form);
      setAdmins((current) => [response.data, ...current]);
      setForm(emptyForm);
      setShowForm(false);
    } catch {
      setError('Unable to add administrator. Check the details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><h1 className="text-3xl font-bold text-white">Admin management</h1><p className="mt-1 text-sm text-slate-400">Manage platform administrator accounts.</p></div>
      <Button onClick={() => setShowForm((value) => !value)}><Plus size={16} />Add admin</Button>
    </div>
    {showForm && <form onSubmit={createAdmin} className="mt-6 grid gap-4 rounded-xl border border-white/10 bg-bg-elevated p-5 sm:grid-cols-2">
      <label className="text-sm text-slate-300">Name<input required maxLength={255} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1.5 w-full rounded-lg bg-bg-input p-3 text-white" /></label>
      <label className="text-sm text-slate-300">Email<input required type="email" maxLength={255} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1.5 w-full rounded-lg bg-bg-input p-3 text-white" /></label>
      <label className="text-sm text-slate-300 sm:col-span-2">Password<input required type="password" minLength={8} maxLength={72} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-1.5 w-full rounded-lg bg-bg-input p-3 text-white" /></label>
      <div className="flex justify-end gap-3 sm:col-span-2"><Button type="button" variant="secondary" onClick={() => { setShowForm(false); setForm(emptyForm); }}>Cancel</Button><Button type="submit" disabled={submitting}>{submitting ? 'Adding…' : 'Add administrator'}</Button></div>
    </form>}
    <input aria-label="Search administrators" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or email" className="mt-6 w-full max-w-md rounded-lg bg-bg-input p-3 text-white" />
    {error && <p role="alert" className="mt-4 text-status-danger">{error}</p>}
    <div className="mt-6 overflow-x-auto rounded-xl border border-white/10"><table className="w-full text-left text-sm"><thead className="bg-bg-elevated text-gray-400"><tr><th className="p-4">Administrator</th><th className="p-4">Role</th></tr></thead><tbody>{loading ? <tr><td colSpan={2} className="p-6 text-center text-slate-400">Loading administrators…</td></tr> : admins.length ? admins.map((admin) => <tr key={admin.id} className="border-t border-white/10 text-gray-200"><td className="p-4"><b>{admin.name}</b><span className="block text-xs text-gray-400">{admin.email}</span></td><td className="p-4"><span className="inline-flex items-center gap-2 text-brand-blue"><ShieldCheck size={16} />Admin</span></td></tr>) : <tr><td colSpan={2} className="p-6 text-center text-slate-400">No administrators found.</td></tr>}</tbody></table></div>
  </main>;
}

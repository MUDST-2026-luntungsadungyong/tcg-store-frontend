import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import apiClient from '@/shared/api/client';
import { Button } from '@/shared/components/Button';
import { Modal } from '@/shared/components/Modal';
import { useToastStore } from '@/shared/model/useToastStore';

type Admin = { id: string; name: string; email: string; role: 'ADMIN'; sellerStatus: string };
type CreateAdmin = { name: string; email: string; password: string };

const emptyForm: CreateAdmin = { name: '', email: '', password: '' };

/* ── Mobile card for a single admin row ── */
function AdminCard({ admin, onDelete }: { admin: Admin; onDelete: () => void }) {
  return (
    <div className="rounded-xl border border-white/10 bg-bg-elevated p-4 flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-white truncate">{admin.name}</p>
        <p className="mt-0.5 text-xs text-gray-400 truncate">{admin.email}</p>
      </div>
      <Button
        variant="danger"
        size="sm"
        onClick={onDelete}
        aria-label={`Delete ${admin.name}`}
      >
        <Trash2 size={14} className="mr-1.5" />
        Delete
      </Button>
    </div>
  );
}

export function AdminUsersPage() {
  const [query, setQuery] = useState('');
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [form, setForm] = useState<CreateAdmin>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null);
  const [error, setError] = useState('');
  const { addToast } = useToastStore();

  const load = useCallback(async () => {
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
  }, [query]);

  useEffect(() => { void load(); }, [load]);

  const createAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      setError('');
      const response = await apiClient.post<Admin>('/admin/users', form);
      setAdmins((current) => [response.data, ...current]);
      setForm(emptyForm);
      setShowForm(false);
      addToast({
        type: 'success',
        message: `Administrator ${response.data.name} added successfully.`,
      });
    } catch {
      setError('Unable to add administrator. Check the details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/admin/users/${adminToDelete.id}`);
      setAdmins((current) => current.filter((admin) => admin.id !== adminToDelete.id));
      addToast({
        type: 'success',
        message: `Administrator ${adminToDelete.name} has been deleted.`,
      });
      setAdminToDelete(null);
    } catch {
      addToast({
        type: 'error',
        message: 'Unable to delete administrator. Please try again.',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin management</h1>
          <p className="mt-1 text-sm text-slate-400">Manage platform administrator accounts.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={load}
            isLoading={loading}
            className="gap-2 shrink-0"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} />
            Add admin
          </Button>
        </div>
      </div>

      <input
        aria-label="Search administrators"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search name or email"
        className="mt-6 w-full max-w-md rounded-lg bg-bg-input p-3 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-blue"
      />

      {error && <p role="alert" className="mt-4 text-status-danger">{error}</p>}

      {/* Administrators List */}
      <section className="mt-6">
        {loading ? (
          <div className="rounded-xl border border-white/10 bg-bg-elevated p-6 text-center text-slate-400">
            Loading administrators…
          </div>
        ) : admins.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-bg-elevated p-6 text-center text-slate-400">
            No administrators found.
          </div>
        ) : (
          <>
            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-bg-elevated text-gray-400">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id} className="border-t border-white/10 text-gray-200">
                      <td className="p-4 font-medium text-white">{admin.name}</td>
                      <td className="p-4 text-gray-300">{admin.email}</td>
                      <td className="p-4 text-right">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setAdminToDelete(admin)}
                          aria-label={`Delete ${admin.name}`}
                        >
                          <Trash2 size={14} className="mr-1.5" />
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (Hidden on desktop) */}
            <div className="flex flex-col gap-3 md:hidden">
              {admins.map((admin) => (
                <AdminCard
                  key={admin.id}
                  admin={admin}
                  onDelete={() => setAdminToDelete(admin)}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Add Admin Modal (Slide Sheet on Mobile) */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          if (!submitting) {
            setShowForm(false);
            setForm(emptyForm);
          }
        }}
        title="Add administrator"
        mobileSheet
      >
        <form onSubmit={createAdmin} className="space-y-4">
          <label className="block text-sm text-slate-300">
            Name
            <input
              required
              maxLength={255}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="mt-1.5 w-full rounded-lg bg-bg-input p-3 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              placeholder="e.g. John Doe"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Email
            <input
              required
              type="email"
              maxLength={255}
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className="mt-1.5 w-full rounded-lg bg-bg-input p-3 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              placeholder="admin@example.com"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Password
            <input
              required
              type="password"
              minLength={8}
              maxLength={72}
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              className="mt-1.5 w-full rounded-lg bg-bg-input p-3 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              placeholder="Minimum 8 characters"
            />
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={() => {
                setShowForm(false);
                setForm(emptyForm);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting} disabled={submitting}>
              {submitting ? 'Adding…' : 'Add administrator'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal (Slide Sheet on Mobile) */}
      <Modal
        isOpen={Boolean(adminToDelete)}
        onClose={() => {
          if (!deleting) setAdminToDelete(null);
        }}
        title="Delete administrator"
        mobileSheet
      >
        {adminToDelete && (
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              Are you sure you want to delete administrator{' '}
              <span className="font-semibold text-white">{adminToDelete.name}</span> (
              <span className="text-gray-400">{adminToDelete.email}</span>)?
            </p>
            <p className="text-xs text-status-danger">
              This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={deleting}
                onClick={() => setAdminToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                isLoading={deleting}
                disabled={deleting}
                onClick={handleDeleteAdmin}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
}

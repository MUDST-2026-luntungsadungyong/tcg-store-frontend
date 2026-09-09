import { useState, type FormEvent } from 'react';
import { ChevronRight, MapPin, Phone, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { usersApi } from '@/api/users';
import { useAuthStore } from '@/store/useAuthStore';

export function EditContactInformationPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const login = useAuthStore((state) => state.login);
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [contactLine, setContactLine] = useState(user?.contactLine ?? '');
  const [contactFacebook, setContactFacebook] = useState(user?.contactFacebook ?? '');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user || !token) return;
    setError('');
    setIsSaving(true);
    try {
      const updated = await usersApi.updateContactInfo(user, { phone, contactLine, contactFacebook });
      login(token, updated);
      navigate('/profile');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save contact information.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[900px] px-6 py-12 sm:px-8 sm:py-16">
      <nav className="flex items-center gap-2 text-sm text-gray-400" aria-label="Breadcrumb">
        <Link to="/profile" className="min-h-11 py-3 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue/50">My Profile</Link>
        <ChevronRight size={14} aria-hidden="true" />
        <span className="font-medium text-brand-blue">Edit Contact Information</span>
      </nav>

      <section className="glass-card mt-6 rounded-2xl px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex items-center gap-3 border-b border-white/10 pb-6">
          <span className="flex size-10 items-center justify-center rounded-full bg-brand-blue/15 text-brand-blue ring-1 ring-brand-blue/30"><MapPin size={20} /></span>
          <div>
            <h1 className="text-2xl font-bold text-white">Contact Information</h1>
            <p className="mt-1 text-sm text-gray-400">Let buyers know how they can reach you.</p>
          </div>
        </div>

        <form className="mt-6 space-y-5" onSubmit={submit}>
          <Input id="contact-phone" type="tel" autoComplete="tel" label="Phone Number" icon={Phone} value={phone} onChange={(event) => setPhone(event.target.value)} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Input id="contact-line" label="Line ID" icon={UserRound} value={contactLine} onChange={(event) => setContactLine(event.target.value)} />
            <Input id="contact-facebook" label="Facebook" icon={UserRound} value={contactFacebook} onChange={(event) => setContactFacebook(event.target.value)} />
          </div>
          {error && <p role="alert" className="text-sm text-status-danger">{error}</p>}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => navigate('/profile')}>Cancel</Button>
            <Button type="submit" isLoading={isSaving}>{isSaving ? 'Saving…' : 'Save Contact Info'}</Button>
          </div>
        </form>
      </section>
    </div>
  );
}

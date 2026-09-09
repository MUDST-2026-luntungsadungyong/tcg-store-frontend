import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { CheckCircle2, ChevronLeft, FileText, ShieldCheck, Store, UploadCloud } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { sellerVerificationApi, SellerVerificationError } from '@/api/sellerVerification';
import { useAuthStore } from '@/store/useAuthStore';

const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

export function SellerVerificationPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const login = useAuthStore((state) => state.login);
  const documentInput = useRef<HTMLInputElement>(null);
  const [shopName, setShopName] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [line, setLine] = useState('');
  const [facebook, setFacebook] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [documentError, setDocumentError] = useState('');
  const [shopNameError, setShopNameError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  if (user?.role === 'SELLER' && !isComplete) {
    return (
      <div className="mx-auto flex min-h-[56vh] max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
        <CheckCircle2 className="size-12 text-emerald-400" aria-hidden="true" />
        <h1 className="mt-5 text-3xl font-bold text-white">You are already a seller</h1>
        <p className="mt-3 text-gray-400">Your seller account is verified and ready for listings.</p>
        <Button className="mt-7" onClick={() => navigate('/seller/inventory')}>Open inventory</Button>
      </div>
    );
  }

  function selectDocument(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      setDocumentError('Choose a PDF, JPG, or PNG file.');
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      setDocumentError('Document must be 5MB or smaller.');
      return;
    }
    setDocumentError('');
    setDocumentName(file.name);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const nameError = shopName.trim() ? '' : 'Store name is required.';
    setShopNameError(nameError);
    if (nameError) return;
    if (!user || !token) return;

    setSubmitError('');
    setIsSubmitting(true);
    try {
      await sellerVerificationApi.submit({
        shopName: shopName.trim(),
        shopDescription: shopDescription.trim() || undefined,
        phone: phone.trim() || undefined,
        line: line.trim() || undefined,
        facebook: facebook.trim() || undefined,
      });
      login(token, { ...user, role: 'SELLER', sellerStatus: 'VERIFIED', phone: phone.trim() || user.phone });
      setIsComplete(true);
    } catch (error) {
      setSubmitError(error instanceof SellerVerificationError ? error.message : 'We could not submit your application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isComplete) {
    return (
      <div className="mx-auto flex min-h-[56vh] max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/30"><CheckCircle2 className="size-8" /></span>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-brand-gold">Seller verification complete</p>
        <h1 className="mt-3 text-3xl font-bold text-white">Your store is ready to set up</h1>
        <p className="mt-3 max-w-md text-gray-400">Your account is now a verified seller. Add your first card whenever you are ready.</p>
        <Button className="mt-7" onClick={() => navigate('/seller/inventory')}>Go to seller inventory</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[900px] px-6 py-12 sm:px-8 sm:py-16">
      <Link to="/profile" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-gray-400 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue/50">
        <ChevronLeft size={17} aria-hidden="true" /> Back to account information
      </Link>

      <header className="mt-7 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-gold">Sell on Mythix</p>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Apply to become a seller</h1>
        <p className="mx-auto mt-3 max-w-2xl text-gray-400">Share your store details, add a proof document, and we will prepare your seller account.</p>
      </header>

      <ol aria-label="Seller verification progress" className="mx-auto mt-9 grid max-w-2xl grid-cols-3 gap-3 text-center text-xs sm:text-sm">
        {['Store details', 'Identity document', 'Verified seller'].map((step, index) => (
          <li key={step} className="flex flex-col items-center gap-2 text-gray-300">
            <span className={`flex size-8 items-center justify-center rounded-full border font-semibold ${index === 0 ? 'border-brand-gold bg-brand-gold text-bg-base' : 'border-white/15 bg-bg-elevated text-gray-400'}`}>{index + 1}</span>
            {step}
          </li>
        ))}
      </ol>

      <section className="glass-card mt-9 rounded-2xl px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex gap-3 border-b border-white/10 pb-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-blue/15 text-brand-blue ring-1 ring-brand-blue/30"><Store size={20} /></span>
          <div>
            <h2 className="text-xl font-bold text-white">Store and contact information</h2>
            <p className="mt-1 text-sm text-gray-400">A store name is required. Contact details help buyers reach you.</p>
          </div>
        </div>

        <form className="mt-6 space-y-5" onSubmit={submit} noValidate>
          <Input id="seller-shop-name" label="Store name *" required value={shopName} onChange={(event) => setShopName(event.target.value)} onBlur={() => setShopNameError(shopName.trim() ? '' : 'Store name is required.')} error={shopNameError} />
          <div>
            <label htmlFor="seller-description" className="mb-1 block text-sm font-medium text-gray-300">Store description</label>
            <textarea id="seller-description" value={shopDescription} onChange={(event) => setShopDescription(event.target.value)} maxLength={5000} rows={4} placeholder="Tell collectors what you specialize in." className="block w-full rounded-xl border border-[rgba(165,201,249,0.3)] bg-[#0b141f] px-3 py-3 text-sm text-gray-200 placeholder-[#808ca6] focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input id="seller-phone" type="tel" autoComplete="tel" label="Phone number" value={phone} onChange={(event) => setPhone(event.target.value)} />
            <Input id="seller-line" label="Line ID" value={line} onChange={(event) => setLine(event.target.value)} />
          </div>
          <Input id="seller-facebook" label="Facebook" value={facebook} onChange={(event) => setFacebook(event.target.value)} />

          <div className="rounded-xl border border-dashed border-brand-blue/40 bg-brand-blue/5 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <FileText className="mt-0.5 size-5 shrink-0 text-brand-blue" aria-hidden="true" />
                <div>
                  <label className="text-sm font-semibold text-white">Identity document <span className="text-gray-400">(prototype)</span></label>
                  <p className="mt-1 text-xs leading-5 text-gray-400">Select a PDF, JPG, or PNG up to 5MB. File-upload delivery will be enabled when its backend endpoint is available.</p>
                </div>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={() => documentInput.current?.click()}><UploadCloud size={16} className="mr-1.5" />Select file</Button>
            </div>
            <input ref={documentInput} type="file" accept="application/pdf,image/jpeg,image/png" onChange={selectDocument} className="sr-only" />
            {documentName && <p className="mt-3 text-sm text-emerald-300">Selected: {documentName}</p>}
            {documentError && <p role="alert" className="mt-3 text-sm text-status-danger">{documentError}</p>}
          </div>

          {submitError && <p role="alert" className="text-sm text-status-danger">{submitError}</p>}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => navigate('/profile')}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}><ShieldCheck size={17} className="mr-2" />Submit seller application</Button>
          </div>
        </form>
      </section>
    </div>
  );
}

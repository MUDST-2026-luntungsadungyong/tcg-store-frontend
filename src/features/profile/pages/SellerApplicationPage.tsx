import { useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Phone, ShieldCheck, Store } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/shared/components/Input";
import { Button } from "@/shared/components/Button";
import { profileApi } from "../api/profile";
import { useAuthStore } from "@/features/auth/model/useAuthStore";

export function SellerApplicationPage() {
  const user = useAuthStore((state) => state.user);
  const [shopName, setShopName] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [line, setLine] = useState(user?.line || "");
  const [facebook, setFacebook] = useState(user?.facebook || "");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!shopName.trim()) {
      setError("Store name is required.");
      return;
    }
    if (!phone.trim() && !line.trim() && !facebook.trim()) {
      setError("Please provide at least one contact method.");
      return;
    }
    setError("");
    setSubmitted(false);
    setIsSubmitting(true);
    try {
      const response = await profileApi.verifySeller({ shopName, shopDescription, phone, line, facebook });
      if (user) useAuthStore.setState({ user: { ...user, sellerStatus: response.sellerStatus ?? "PENDING" } });
      setError("");
      setShopName("");
      setShopDescription("");
      setSubmitted(true);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError("You already have a pending seller application.");
      } else {
        setError("Unable to submit your seller application. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Link to="/profile" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-gray-400 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 focus:ring-offset-bg-base">
        <ArrowLeft size={18} aria-hidden="true" />
        Back to profile
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-12">
        <form onSubmit={submit} className="overflow-hidden rounded-[28px] border border-white/10 bg-bg-surface shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
          <header className="border-b border-white/10 px-5 py-6 sm:px-8 sm:py-7">
            <div className="flex items-start gap-4">
              <Store size={27} className="mt-1 shrink-0 text-brand-gold" aria-hidden="true" />
              <div className="min-w-0">
                <h1 className="text-balance text-3xl font-semibold tracking-tight text-white">Open your seller space</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-gray-300">Tell us about your store and how buyers can contact you. An administrator will review your application.</p>
              </div>
            </div>
          </header>

          <div className="space-y-8 px-5 py-6 sm:px-8 sm:py-8">
            <fieldset className="space-y-5">
              <legend className="text-lg font-semibold text-white">Store profile</legend>
              <Input id="shop-name" label="Store name" value={shopName} required maxLength={50} placeholder="e.g. Naphat Card House" className="rounded-xl bg-bg-input" onChange={(event) => setShopName(event.target.value)} />
              <div>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <label htmlFor="shop-description" className="block text-sm font-medium text-gray-300">Store description</label>
                  <span className="text-xs text-gray-400">{shopDescription.length}/500</span>
                </div>
                <textarea id="shop-description" value={shopDescription} maxLength={500} placeholder="What do you collect or sell? Mention your preferred TCGs or specialties." className="block min-h-32 w-full resize-y rounded-xl border border-white/15 bg-bg-input px-3 py-3 text-sm leading-6 text-gray-100 placeholder:text-[#9AA9C0] transition-colors focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold" onChange={(event) => setShopDescription(event.target.value)} />
              </div>
            </fieldset>

            <fieldset className="space-y-5 border-t border-white/10 pt-7">
              <legend className="text-lg font-semibold text-white">Contact details</legend>
              <p className="-mt-3 text-sm leading-6 text-gray-300">These details are visible to buyers so you can arrange contact outside Mythix.</p>
              <Input id="phone" label="Phone" value={phone} icon={Phone} placeholder="Your phone number" className="rounded-xl bg-bg-input" onChange={(event) => setPhone(event.target.value)} />
              <Input id="line" label="LINE ID" value={line} iconUrl="https://cdn.simpleicons.org/line/06C755" placeholder="Your LINE ID" className="rounded-xl bg-bg-input" onChange={(event) => setLine(event.target.value)} />
              <Input id="facebook" label="Facebook" value={facebook} iconUrl="https://cdn.simpleicons.org/facebook/1877F2" placeholder="Your Facebook name" className="rounded-xl bg-bg-input" onChange={(event) => setFacebook(event.target.value)} />
            </fieldset>

            {error && <p role="alert" className="flex items-center gap-2 text-sm text-status-danger"><AlertCircle size={17} aria-hidden="true" />{error}</p>}
            {submitted && <p role="status" className="flex items-center gap-2 text-sm text-status-success"><CheckCircle2 size={17} aria-hidden="true" />Application submitted. Your seller account will be activated once an administrator approves it.</p>}

            <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Link to="/profile" className="inline-flex min-h-11 items-center justify-center px-3 text-sm font-medium text-gray-400 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 focus:ring-offset-bg-surface">Cancel</Link>
              <Button type="submit" isLoading={isSubmitting} className="w-full gap-2 sm:w-auto">Submit for review <ArrowRight size={17} aria-hidden="true" /></Button>
            </div>
          </div>
        </form>

        <aside className="border-t border-white/10 pt-6 lg:border-t-0 lg:pt-2" aria-label="Seller application process">
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-gold"><ShieldCheck size={18} aria-hidden="true" />What happens next</div>
          <ol className="mt-5 space-y-5 text-sm leading-6">
            <li className="border-b border-white/10 pb-5"><span className="block font-medium text-white">We review your details</span><span className="mt-1 block text-gray-400">Your storefront information is checked by an administrator.</span></li>
            <li className="border-b border-white/10 pb-5"><span className="block font-medium text-white">Your account is approved</span><span className="mt-1 block text-gray-400">Once approved, you can create listings from your seller workspace.</span></li>
            <li><span className="block font-medium text-white">Buyers contact you directly</span><span className="mt-1 block text-gray-400">Mythix records reservations; payment and delivery stay outside the platform.</span></li>
          </ol>
        </aside>
      </div>
    </main>
  );
}

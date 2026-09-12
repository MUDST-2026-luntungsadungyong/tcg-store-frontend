import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/shared/components/Input";
import { Button } from "@/shared/components/Button";
import { profileApi } from "../api/profile";
import { useAuthStore } from "@/features/auth/model/useAuthStore";

export function SellerApplicationPage() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const [shopName, setShopName] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [line, setLine] = useState(user?.line || "");
  const [facebook, setFacebook] = useState(user?.facebook || "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!shopName.trim()) {
      setError("Store name is required.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await profileApi.verifySeller({ shopName, shopDescription, phone, line, facebook });
      if (user && token) login(token, { ...user, isSeller: true, phone, line, facebook });
      navigate("/workspace/store-settings");
    } catch {
      setError("Unable to submit your seller application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <Link to="/profile" className="inline-flex min-h-11 items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 focus:ring-offset-bg-base">
        <ArrowLeft size={18} aria-hidden="true" />
        Back to profile
      </Link>

      <header className="mt-7 border-b border-white/10 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">Become a seller</h1>
        <p className="mt-2 text-gray-400">Add the details buyers need to contact your store.</p>
      </header>

      <form className="mt-7 space-y-8" onSubmit={submit}>
        <fieldset className="space-y-5">
          <legend className="text-lg font-semibold text-white">Store details</legend>
          <Input id="shop-name" label="Store name" value={shopName} required maxLength={50} placeholder="Your store name" className="rounded-xl bg-bg-input" onChange={(event) => setShopName(event.target.value)} />
          <div>
            <label htmlFor="shop-description" className="mb-1 block text-sm font-medium text-gray-300">Store description</label>
            <textarea id="shop-description" value={shopDescription} maxLength={500} placeholder="What do you collect or sell?" className="block min-h-28 w-full resize-y rounded-xl border border-white/15 bg-bg-input px-3 py-3 text-sm text-gray-100 placeholder:text-[#808ca6] transition-colors focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold" onChange={(event) => setShopDescription(event.target.value)} />
          </div>
        </fieldset>

        <fieldset className="space-y-5 border-t border-white/10 pt-7">
          <legend className="text-lg font-semibold text-white">Contact details</legend>
          <p className="-mt-3 text-sm text-gray-400">These details let buyers reach you outside Mythix.</p>
          <Input id="phone" label="Phone" value={phone} className="rounded-xl bg-bg-input" onChange={(event) => setPhone(event.target.value)} />
          <Input id="line" label="LINE ID" value={line} className="rounded-xl bg-bg-input" onChange={(event) => setLine(event.target.value)} />
          <Input id="facebook" label="Facebook" value={facebook} className="rounded-xl bg-bg-input" onChange={(event) => setFacebook(event.target.value)} />
        </fieldset>

        {error && <p role="alert" className="text-sm text-status-danger">{error}</p>}
        <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-6">
          <Button type="submit" isLoading={isSubmitting}>Submit seller application</Button>
          <Link to="/profile" className="px-3 py-2 text-sm text-gray-400 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 focus:ring-offset-bg-base">Cancel</Link>
        </div>
      </form>
    </main>
  );
}

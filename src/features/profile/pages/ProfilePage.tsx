import { useEffect, useRef, useState, type ElementType } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronRight, Copy, Edit3, Mail, Phone, UserRound } from "lucide-react";
import { useAuthStore } from "@/features/auth/model/useAuthStore";
import { isSellerUser } from "@/entities/account/model/types";
import { useToastStore } from "@/shared/model/useToastStore";

type ContactItemProps = {
  icon?: ElementType;
  iconUrl?: string;
  label: string;
  value?: string;
  iconClassName: string;
};

function ContactItem({
  icon: Icon,
  iconUrl,
  label,
  value,
  iconClassName,
}: ContactItemProps) {
  const isSet = Boolean(value?.trim());
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className={`shrink-0 ${iconClassName}`} aria-hidden="true">
        {iconUrl ? (
          <img src={iconUrl} alt="" className="h-5 w-5" />
        ) : (
          Icon && <Icon size={19} strokeWidth={1.8} />
        )}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-300">{label}</p>
        <p
          className={
            isSet ? "truncate text-sm text-gray-100" : "text-sm text-gray-500"
          }
        >
          {isSet ? value : "Not added"}
        </p>
      </div>
    </div>
  );
}

const editLinkClassName =
  "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-white/15 px-4 text-sm font-medium text-gray-100 transition-colors hover:border-brand-blue hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 focus:ring-offset-bg-base";

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const addToast = useToastStore((state) => state.addToast);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const copiedResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (copiedResetTimer.current) clearTimeout(copiedResetTimer.current);
  }, []);

  async function copyContact(label: string, value?: string) {
    if (!value?.trim()) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopiedLabel(label);
      if (copiedResetTimer.current) clearTimeout(copiedResetTimer.current);
      copiedResetTimer.current = setTimeout(() => {
        setCopiedLabel((currentLabel) => (currentLabel === label ? null : currentLabel));
        copiedResetTimer.current = null;
      }, 1500);
      addToast({ type: "success", title: "Copied", message: `${label} copied to clipboard.` });
    } catch {
      setCopiedLabel(null);
      addToast({ type: "error", title: "Unable to copy", message: `Please copy the ${label} manually.` });
    }
  }

  const contactButtonClassName =
    "group flex min-h-24 items-center justify-between rounded-xl border border-white/10 px-4 text-left transition-colors hover:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 focus:ring-offset-bg-base disabled:cursor-not-allowed disabled:opacity-55";

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-7">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          My Profile
        </h1>
      </header>
      <section
        className="rounded-2xl border border-white/10 bg-bg-surface p-5 sm:p-7"
        aria-labelledby="personal-information-heading"
      >
        <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <UserRound size={24} className="shrink-0 text-brand-gold" aria-hidden="true" />
            <h2 id="personal-information-heading" className="text-xl font-semibold text-white">
              Personal Information
            </h2>
          </div>
          <Link className={editLinkClassName} to="/profile/edit">
            <Edit3 size={16} aria-hidden="true" />
            Edit profile
          </Link>
        </div>
        <dl className="mt-1 divide-y divide-white/10">
          <div className="grid gap-1 py-5 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:items-center sm:gap-5">
            <dt className="text-sm text-gray-400">Name</dt>
            <dd className="truncate text-lg font-semibold text-white">{user?.name || "Your name"}</dd>
          </div>
          <div className="grid gap-1 py-5 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:items-center sm:gap-5">
            <dt className="text-sm text-gray-400">Email</dt>
            <dd className="flex min-w-0 items-center gap-2 text-sm text-gray-100">
              <Mail
                size={16}
                className="shrink-0 text-brand-blue"
                aria-hidden="true"
              />
              <span className="truncate">
                {user?.email || "Email not added"}
              </span>
            </dd>
          </div>
        </dl>
      </section>
      <section className="mt-5 rounded-2xl border border-white/10 bg-bg-surface p-5 sm:p-7" aria-labelledby="contact-information-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Phone size={24} className="shrink-0 text-brand-gold" aria-hidden="true" />
            <h2 id="contact-information-heading" className="text-xl font-semibold text-white">Contact Information</h2>
          </div>
          <Link className={editLinkClassName} to="/profile/edit/contact">
            <Edit3 size={16} aria-hidden="true" />
            Edit contact
          </Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <button className={contactButtonClassName} type="button" onClick={() => void copyContact("Phone", user?.phone)} disabled={!user?.phone?.trim()} aria-label="Copy phone number">
            <ContactItem icon={Phone} label="Phone" value={user?.phone} iconClassName="text-brand-blue" />
            {copiedLabel === "Phone" ? <Check size={18} className="ml-3 shrink-0 text-status-success" aria-hidden="true" /> : <Copy size={17} className="ml-3 shrink-0 text-gray-500 transition-colors group-hover:text-white" aria-hidden="true" />}
          </button>
          <button className={contactButtonClassName} type="button" onClick={() => void copyContact("LINE ID", user?.line)} disabled={!user?.line?.trim()} aria-label="Copy LINE ID">
            <ContactItem iconUrl="https://cdn.simpleicons.org/line/06C755" label="LINE ID" value={user?.line} iconClassName="" />
            {copiedLabel === "LINE ID" ? <Check size={18} className="ml-3 shrink-0 text-status-success" aria-hidden="true" /> : <Copy size={17} className="ml-3 shrink-0 text-gray-500 transition-colors group-hover:text-white" aria-hidden="true" />}
          </button>
          <button className={contactButtonClassName} type="button" onClick={() => void copyContact("Facebook", user?.facebook)} disabled={!user?.facebook?.trim()} aria-label="Copy Facebook contact">
            <ContactItem iconUrl="https://cdn.simpleicons.org/facebook/1877F2" label="Facebook" value={user?.facebook} iconClassName="" />
            {copiedLabel === "Facebook" ? <Check size={18} className="ml-3 shrink-0 text-status-success" aria-hidden="true" /> : <Copy size={17} className="ml-3 shrink-0 text-gray-500 transition-colors group-hover:text-white" aria-hidden="true" />}
          </button>
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {copiedLabel ? `${copiedLabel} copied to clipboard.` : ""}
        </p>
      </section>
      {user?.role === "USER" && !isSellerUser(user) && (
        <Link
          className="mt-5 flex min-h-28 items-center justify-between rounded-2xl border border-brand-gold/35 bg-brand-gold/10 px-5 py-5 text-gray-100 transition-colors hover:bg-brand-gold/15 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2 focus:ring-offset-bg-base sm:px-7"
          to="/profile/seller-application"
        >
          <span>
            <span className="block text-xl font-semibold">Want to sell something?</span>
            <span className="mt-1 block text-sm text-gray-300">Join as a seller to start listing your items.</span>
          </span>
          <span className="ml-4 inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-gold px-4 py-3 text-sm font-semibold text-bg-base">
            Become a seller
            <ChevronRight size={16} aria-hidden="true" />
          </span>
        </Link>
      )}
    </main>
  );
}

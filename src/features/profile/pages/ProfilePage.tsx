import { useEffect, useRef, useState, type ElementType, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link } from "react-router-dom";
import { Check, ChevronRight, Clock3, Copy, Edit3, Mail, Phone, Store } from "lucide-react";
import { useAuthStore } from "@/features/auth/model/useAuthStore";
import { isSellerUser } from "@/entities/account/model/types";
import { useToastStore } from "@/shared/model/useToastStore";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { Modal } from "@/shared/components/Modal";
import { profileApi } from "../api/profile";

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

function CopyStatusIcon({ copied }: { copied: boolean }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {copied ? (
        <motion.span key="copied" initial={{ opacity: 0, scale: 0.55, rotate: -20 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: "spring", stiffness: 520, damping: 24 }} className="ml-3 shrink-0 text-status-success">
          <Check size={18} aria-label="Copied" />
        </motion.span>
      ) : (
        <motion.span key="copy" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.14 }} className="ml-3 shrink-0 text-gray-500 transition-colors group-hover:text-white">
          <Copy size={17} aria-hidden="true" />
        </motion.span>
      )}
    </AnimatePresence>
  );
}

type BusinessCardProps = {
  side: "front" | "back";
  onFlip: () => void;
  name?: string;
  email?: string;
  phone?: string;
  line?: string;
  facebook?: string;
};

function BusinessCard({ side, onFlip, name, email, phone, line, facebook }: BusinessCardProps) {
  const showingFront = side === "front";
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  return (
    <aside className="w-full lg:sticky lg:top-24" aria-label="Profile business card preview">
      <div className="mb-3 flex items-center justify-between px-1 text-xs font-medium text-gray-400">
        <span>Profile card</span>
        <span>{showingFront ? "Front" : "Back"}</span>
      </div>
      <div style={{ perspective: "1200px" }}>
        <motion.button
          type="button"
          onClick={onFlip}
          onPointerMove={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            setTilt({
              x: -((event.clientY - bounds.top) / bounds.height - 0.5) * 7,
              y: ((event.clientX - bounds.left) / bounds.width - 0.5) * 7,
            });
          }}
          onPointerLeave={() => setTilt({ x: 0, y: 0 })}
          animate={{ rotateX: tilt.x, rotateZ: tilt.y * 0.18 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          aria-label={showingFront ? "Show contact side of business card" : "Show name and email side of business card"}
          className="block h-56 w-full cursor-pointer rounded-[26px] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-4 focus-visible:ring-offset-bg-base"
        >
          <motion.div
          animate={{ rotateY: showingFront ? 0 : 180 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformStyle: "preserve-3d" }}
          className="relative h-56 w-full"
        >
          <div aria-hidden={!showingFront} style={{ backfaceVisibility: "hidden" }} className="absolute inset-0 flex flex-col overflow-hidden rounded-[26px] border border-brand-gold/45 bg-[#172238] p-6 shadow-[0_24px_55px_rgba(0,0,0,0.32),0_0_28px_rgba(191,166,89,0.12)]">
            <span aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-brand-gold/10 blur-3xl" />
            <div className="flex items-start justify-between gap-4">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-gold">Mythix TCG</span>
              <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold text-gray-300">Member</span>
            </div>
            <div className="mt-auto min-w-0">
              <h2 className="truncate text-3xl font-semibold tracking-tight text-white">{name || "Your name"}</h2>
              <p className="mt-2 flex min-w-0 items-center gap-2 text-sm text-[#D8E5FC]"><Mail size={16} className="shrink-0 text-brand-blue" aria-hidden="true" /><span className="truncate">{email || "Email not added"}</span></p>
            </div>
          </div>
          <div aria-hidden={showingFront} style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }} className="absolute inset-0 flex flex-col overflow-hidden rounded-[26px] border border-brand-blue/45 bg-[#111C2E] p-6 shadow-[0_24px_55px_rgba(0,0,0,0.32),0_0_28px_rgba(114,168,255,0.14)]">
            <span aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-brand-blue/10 blur-3xl" />
            <span className="relative text-xs font-bold uppercase tracking-[0.18em] text-brand-blue">Contact</span>
            <dl className="relative mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3"><dt className="flex items-center gap-2 text-gray-400"><Phone size={15} className="text-brand-blue" aria-hidden="true" />Phone</dt><dd className="truncate text-right text-white">{phone || "Not added"}</dd></div>
              <div className="flex items-center gap-2 text-gray-400"><dt className="flex items-center gap-2"><img src="https://cdn.simpleicons.org/line/06C755" alt="" className="size-[15px]" />LINE ID</dt><dd className="ml-auto truncate text-right text-white">{line || "Not added"}</dd></div>
              <div className="flex items-center gap-2 text-gray-400"><dt className="flex items-center gap-2"><img src="https://cdn.simpleicons.org/facebook/1877F2" alt="" className="size-[15px]" />Facebook</dt><dd className="ml-auto truncate text-right text-white">{facebook || "Not added"}</dd></div>
            </dl>
            <span className="relative mt-auto text-xs text-gray-400">Mythix TCG marketplace</span>
          </div>
        </motion.div>
        </motion.button>
      </div>
      <p className="mt-3 text-center text-xs text-gray-400">Move to tilt · Click to flip</p>
    </aside>
  );
}

const editLinkClassName =
  "group inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-full border border-white/15 px-4 text-sm font-medium text-gray-100 transition-[transform,border-color,color,box-shadow] duration-200 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 hover:border-brand-blue hover:text-white hover:shadow-lg hover:shadow-brand-blue/10 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 focus:ring-offset-bg-base sm:w-auto";

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const login = useAuthStore((state) => state.login);
  const addToast = useToastStore((state) => state.addToast);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const [activeEditor, setActiveEditor] = useState<"profile" | "contact" | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [line, setLine] = useState("");
  const [facebook, setFacebook] = useState("");
  const [editorError, setEditorError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [cardSide, setCardSide] = useState<"front" | "back">("front");
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

  function openEditor(editor: "profile" | "contact") {
    setEditorError("");
    if (editor === "profile") {
      setName(user?.name || "");
      setEmail(user?.email || "");
    } else {
      setPhone(user?.phone || "");
      setLine(user?.line || "");
      setFacebook(user?.facebook || "");
    }
    setActiveEditor(editor);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEditorError("");
    setIsSaving(true);
    try {
      const updated = await profileApi.update({ name, email });
      if (token) login(token, updated);
      setActiveEditor(null);
      addToast({ type: "success", title: "Profile updated", message: "Your personal information has been saved." });
    } catch {
      setEditorError("Unable to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEditorError("");
    setIsSaving(true);
    try {
      const updated = await profileApi.update({ phone, line, facebook });
      if (token) login(token, updated);
      setActiveEditor(null);
      addToast({ type: "success", title: "Contact updated", message: "Your contact information has been saved." });
    } catch {
      setEditorError("Unable to save contact information. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  const contactButtonClassName =
    "group flex min-h-24 items-center justify-between px-5 text-left transition-[background-color,transform] duration-150 motion-safe:active:scale-[0.98] hover:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-blue disabled:cursor-not-allowed disabled:opacity-55";
  const hasPendingSellerApplication = user?.sellerStatus?.toUpperCase() === "PENDING";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-7 text-center sm:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          My Profile
        </h1>
      </header>
      <div className="grid gap-6 lg:grid-cols-[minmax(17rem,22rem)_minmax(0,1fr)] lg:items-start">
        <BusinessCard side={cardSide} onFlip={() => setCardSide((current) => current === "front" ? "back" : "front")} name={user?.name} email={user?.email} phone={user?.phone} line={user?.line} facebook={user?.facebook} />
        <div className="min-w-0">
      <section className="overflow-hidden rounded-[28px] border border-white/10 bg-bg-surface shadow-[0_20px_50px_rgba(0,0,0,0.18)]" aria-labelledby="personal-information-heading">
        <div className="flex flex-col items-center gap-5 border-b border-white/10 px-5 py-5 text-center sm:flex-row sm:items-start sm:justify-between sm:px-7 sm:py-6 sm:text-left">
          <div className="min-w-0">
            <h2 id="personal-information-heading" className="truncate text-2xl font-semibold tracking-tight text-white">{user?.name || "Your name"}</h2>
            <p className="mt-2 flex min-w-0 items-center justify-center gap-2 text-sm text-gray-300 sm:justify-start"><Mail size={16} className="shrink-0 text-brand-blue" aria-hidden="true" /><span className="truncate">{user?.email || "Email not added"}</span></p>
          </div>
          <button type="button" className={editLinkClassName} onClick={() => openEditor("profile")}>
            <Edit3 size={16} aria-hidden="true" className="transition-transform duration-200 ease-out motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5" />
            Edit profile
          </button>
        </div>
        <div className="flex flex-col items-center gap-4 px-5 py-5 text-center sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6 sm:text-left" aria-labelledby="contact-information-heading">
          <div className="flex items-center gap-3">
            <Phone size={22} className="shrink-0 text-brand-gold" aria-hidden="true" />
            <h2 id="contact-information-heading" className="text-xl font-semibold text-white">Contact card</h2>
          </div>
          <button type="button" className={editLinkClassName} onClick={() => openEditor("contact")}>
            <Edit3 size={16} aria-hidden="true" className="transition-transform duration-200 ease-out motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5" />
            Edit contact
          </button>
        </div>
        <div className="grid divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <button className={contactButtonClassName} type="button" onClick={() => void copyContact("Phone", user?.phone)} disabled={!user?.phone?.trim()} aria-label="Copy phone number">
            <ContactItem icon={Phone} label="Phone" value={user?.phone} iconClassName="text-brand-blue" />
            <CopyStatusIcon copied={copiedLabel === "Phone"} />
          </button>
          <button className={contactButtonClassName} type="button" onClick={() => void copyContact("LINE ID", user?.line)} disabled={!user?.line?.trim()} aria-label="Copy LINE ID">
            <ContactItem iconUrl="https://cdn.simpleicons.org/line/06C755" label="LINE ID" value={user?.line} iconClassName="" />
            <CopyStatusIcon copied={copiedLabel === "LINE ID"} />
          </button>
          <button className={contactButtonClassName} type="button" onClick={() => void copyContact("Facebook", user?.facebook)} disabled={!user?.facebook?.trim()} aria-label="Copy Facebook contact">
            <ContactItem iconUrl="https://cdn.simpleicons.org/facebook/1877F2" label="Facebook" value={user?.facebook} iconClassName="" />
            <CopyStatusIcon copied={copiedLabel === "Facebook"} />
          </button>
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {copiedLabel ? `${copiedLabel} copied to clipboard.` : ""}
        </p>
      </section>
      {user?.role === "USER" && !isSellerUser(user) && (hasPendingSellerApplication ? (
        <section className="mt-5 flex min-h-28 items-center justify-between gap-5 rounded-2xl border border-status-warning/35 bg-status-warning/[0.07] px-5 py-5 sm:px-7" aria-labelledby="seller-application-pending-heading">
          <span className="flex min-w-0 items-start gap-3">
            <Clock3 size={21} className="mt-1 shrink-0 text-status-warning" aria-hidden="true" />
            <span>
              <h2 id="seller-application-pending-heading" className="text-xl font-semibold text-white">Seller application pending</h2>
              <span className="mt-1 block text-sm text-gray-300">Your store details are waiting for an administrator to review.</span>
            </span>
          </span>
          <span className="shrink-0 rounded-full border border-status-warning/40 bg-status-warning/10 px-3 py-2 text-xs font-semibold text-status-warning">Pending review</span>
        </section>
      ) : (
        <Link
          className="group relative mt-5 flex min-h-28 items-center justify-between overflow-hidden rounded-2xl border border-brand-gold/35 bg-brand-gold/10 px-5 py-5 text-gray-100 transition-[border-color,background-color,box-shadow] duration-300 hover:border-brand-gold/65 hover:bg-brand-gold/[0.14] hover:shadow-[0_16px_36px_rgba(191,166,89,0.12)] focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2 focus:ring-offset-bg-base sm:px-7"
          to="/profile/seller-application"
        >
          <span aria-hidden="true" className="pointer-events-none absolute -right-12 -top-16 size-48 rounded-full bg-brand-gold/10 blur-3xl transition-transform duration-500 ease-out group-hover:scale-125" />
          <span className="relative flex min-w-0 items-start gap-3">
            <Store size={21} className="mt-1 shrink-0 text-brand-gold transition-transform duration-300 ease-out group-hover:rotate-3 group-hover:scale-110" aria-hidden="true" />
            <span>
              <span className="block text-xl font-semibold">Want to sell something?</span>
              <span className="mt-1 block text-sm text-gray-300">Join as a seller to start listing your items.</span>
            </span>
          </span>
          <span className="relative ml-4 inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-gold px-4 py-3 text-sm font-semibold text-bg-base transition-[transform,box-shadow,background-color] duration-200 ease-out group-hover:-translate-y-0.5 group-hover:bg-[#d2b965] group-hover:shadow-lg group-hover:shadow-brand-gold/20 group-active:translate-y-0">
            Become a seller
            <ChevronRight size={16} className="transition-transform duration-200 ease-out group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </Link>
      ))}
        </div>
      </div>
      <Modal
        isOpen={activeEditor === "profile"}
        onClose={() => { if (!isSaving) setActiveEditor(null); }}
        title="Edit profile"
        mobileSheet
        desktopFromRight
        footer={<><Button type="button" variant="secondary" onClick={() => setActiveEditor(null)} disabled={isSaving}>Cancel</Button><Button type="submit" form="edit-profile-form" isLoading={isSaving}>Save changes</Button></>}
      >
        <form id="edit-profile-form" onSubmit={saveProfile} className="space-y-5">
          <Input id="name" label="Full name" placeholder="e.g. Naphat Phoruang" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
          <Input id="email" label="Email" type="email" placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
          {editorError && <p className="text-sm text-status-danger" role="alert">{editorError}</p>}
        </form>
      </Modal>
      <Modal
        isOpen={activeEditor === "contact"}
        onClose={() => { if (!isSaving) setActiveEditor(null); }}
        title="Edit contact"
        mobileSheet
        desktopFromRight
        footer={<><Button type="button" variant="secondary" onClick={() => setActiveEditor(null)} disabled={isSaving}>Cancel</Button><Button type="submit" form="edit-contact-form" isLoading={isSaving}>Save contact</Button></>}
      >
        <form id="edit-contact-form" onSubmit={saveContact} className="space-y-5">
          <Input id="phone" label="Phone" type="tel" placeholder="e.g. +66 81 234 5678" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" />
          <Input id="line" label="LINE ID" iconUrl="https://cdn.simpleicons.org/line/06C755" placeholder="e.g. naphat.tcg" value={line} onChange={(event) => setLine(event.target.value)} />
          <Input id="facebook" label="Facebook" iconUrl="https://cdn.simpleicons.org/facebook/1877F2" placeholder="e.g. facebook.com/naphat.tcg" value={facebook} onChange={(event) => setFacebook(event.target.value)} />
          {editorError && <p className="text-sm text-status-danger" role="alert">{editorError}</p>}
        </form>
      </Modal>
    </main>
  );
}

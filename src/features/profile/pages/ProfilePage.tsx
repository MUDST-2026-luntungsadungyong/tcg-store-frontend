import { useEffect, useRef, useState, type ElementType, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link } from "react-router-dom";
import { X, UserRound, Mail, Camera, ShieldCheck, Check, ChevronRight, Clock3, Copy, Edit3, Phone, Store } from "lucide-react";
import { useAuthStore } from "@/features/auth/model/useAuthStore";
import { isSellerUser } from "@/entities/account/model/types";
import { useToastStore } from "@/shared/model/useToastStore";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { Modal } from "@/shared/components/Modal";
import { profileApi } from "../api/profile";
import { AvatarPhotoEditor } from "../components/AvatarPhotoEditor";
import { ProfileCollectionPreview } from "../components/ProfileCollectionPreview";

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

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const login = useAuthStore((state) => state.login);
  const addToast = useToastStore((state) => state.addToast);
  const [completionHovered, setCompletionHovered] = useState(false);
  const [completionFocused, setCompletionFocused] = useState(false);
  const [dismissedCompletionAccounts, setDismissedCompletionAccounts] = useState<string[]>(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem("mythix_profile_completion_dismissed_v1") || "[]");
      return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
    } catch { return []; }
  });
  const [completionOpen, setCompletionOpen] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const [activeEditor, setActiveEditor] = useState<"profile" | "contact" | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [line, setLine] = useState("");
  const [facebook, setFacebook] = useState("");
  const [editorError, setEditorError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  async function saveAvatar(editedFile: File) {
    if (uploadingAvatar) return;
    setUploadingAvatar(true);
    setAvatarError("");
    try {
      const updated = await profileApi.uploadAvatar(editedFile);
      if (token) login(token, updated);
      setAvatarFile(null);
      setAvatarEditorOpen(false);
      addToast({ type: "success", title: "Profile photo updated", message: "Your new photo has been saved." });
    } catch {
      setAvatarError("Unable to upload your photo. Please try again.");
    } finally { setUploadingAvatar(false); }
  }
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
    "group flex min-h-14 min-w-0 items-center justify-between gap-2 rounded-xl px-2 text-left transition-[background-color,transform] duration-150 motion-safe:active:scale-[0.98] hover:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-blue disabled:cursor-not-allowed disabled:opacity-55";
  const profileFields = [
    { label: "Profile photo", value: user?.avatarUrl, editor: "photo" },
    { label: "Full name", value: user?.name, editor: "profile" },
    { label: "Email", value: user?.email, editor: "profile" },
    { label: "Phone", value: user?.phone, editor: "contact" },
    { label: "LINE ID", value: user?.line, editor: "contact" },
    { label: "Facebook", value: user?.facebook, editor: "contact" },
  ] as const;
  const missingFields = profileFields.filter((field) => !field.value?.trim());
  const completedFields = profileFields.length - missingFields.length;
  const completionVisible = completionOpen || completionHovered || completionFocused;
  const completionPercent = Math.round(completedFields / profileFields.length * 100);
  const completionDismissed = completionPercent === 100 && Boolean(user && dismissedCompletionAccounts.includes(user.id));

  function persistDismissedCompletion(accounts: string[]) {
    setDismissedCompletionAccounts(accounts);
    try { localStorage.setItem("mythix_profile_completion_dismissed_v1", JSON.stringify(accounts)); } catch { /* Keep dismissal for this session if browser storage is unavailable. */ }
  }

  useEffect(() => {
    if (user && completionPercent < 100 && dismissedCompletionAccounts.includes(user.id)) {
      persistDismissedCompletion(dismissedCompletionAccounts.filter((id) => id !== user.id));
    }
  }, [user?.id, completionPercent, dismissedCompletionAccounts]);

  const hasPendingSellerApplication = user?.sellerStatus?.toUpperCase() === "PENDING";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {!completionDismissed && <section aria-label="Profile completion" className="fixed right-4 top-20 z-40 md:right-6 md:top-24"
        onPointerEnter={(event) => { if (event.pointerType === "mouse") setCompletionHovered(true); }}
        onPointerLeave={() => setCompletionHovered(false)}
        onFocusCapture={(event) => { if (event.target.matches(":focus-visible")) setCompletionFocused(true); }}
        onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setCompletionFocused(false); }}
        onKeyDown={(event) => { if (event.key === "Escape") { setCompletionOpen(false); setCompletionHovered(false); setCompletionFocused(false); event.stopPropagation(); } }}>
        <button type="button" aria-expanded={completionVisible} aria-controls="profile-completion-details" aria-label="Toggle profile completion details" onClick={() => setCompletionOpen((value) => !value)} className="relative flex size-16 items-center justify-center rounded-full bg-bg-surface text-brand-blue shadow-xl shadow-black/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue">
          <svg viewBox="0 0 64 64" aria-hidden="true" className={`absolute inset-0 size-full -rotate-90 ${completionPercent === 100 ? "text-status-success" : "text-brand-blue"}`}>
            <circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.15" />
            <circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" strokeWidth="3" pathLength="100" strokeDasharray={`${completionPercent} 100`} strokeLinecap="round" />
          </svg>
          <span role="progressbar" aria-label="Profile completeness" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completionPercent} aria-valuetext={`${completedFields} of ${profileFields.length} details completed`} className="text-base font-semibold tabular-nums">{completionPercent}%</span>
        </button>
        <div id="profile-completion-details" aria-hidden={!completionVisible} inert={!completionVisible} className={`absolute right-0 top-full w-72 max-w-[calc(100vw-2rem)] origin-top-right pt-3 transition-[opacity,transform,visibility] duration-200 ease-out motion-reduce:transition-none ${completionVisible ? "visible translate-y-0 scale-100 opacity-100" : "pointer-events-none invisible -translate-y-2 scale-[0.97] opacity-0"}`}>
          <div className="max-h-[calc(100dvh-11rem)] overflow-y-auto rounded-2xl border border-border-default bg-bg-surface p-4 shadow-xl shadow-black/30">
            <div className="flex items-center justify-between gap-3">
              <h2 id="profile-completion-heading" className="text-sm font-semibold text-text-primary">{completionPercent === 100 ? "Your profile is complete" : "Complete your profile"}</h2>
              <span className="font-semibold tabular-nums text-brand-blue">{completionPercent}%</span>
            </div>
            <div aria-hidden="true" className="mt-3 h-2 overflow-hidden rounded-full bg-bg-elevated">
              <div style={{ width: `${completionPercent}%` }} className={`h-full rounded-full ${completionPercent === 100 ? "bg-status-success" : "bg-brand-blue"}`} />
            </div>
            <p className="mt-3 text-sm text-text-secondary">{completionPercent === 100 ? "You're all set. Your photo and contact details are ready." : `${completedFields} of ${profileFields.length} details added. Help other collectors recognize and connect with you.`}</p>
            {completionPercent === 100 && <Button type="button" variant="ghost" className="mt-3 w-full gap-2" aria-label="Dismiss profile completion" onClick={() => { if (user) persistDismissedCompletion([...dismissedCompletionAccounts, user.id]); }}><X size={16} aria-hidden="true" />Dismiss</Button>}
            {missingFields.length > 0 && <div className="mt-3 flex flex-wrap gap-2">
              {missingFields.map((field) => <button key={field.label} type="button" onClick={() => { setCompletionOpen(false); setCompletionHovered(false); setCompletionFocused(false); if (field.editor === "photo") { setAvatarError(""); setAvatarEditorOpen(true); } else openEditor(field.editor); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-default px-3 text-sm text-text-primary transition-colors hover:border-brand-blue hover:text-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-blue"><span aria-hidden="true">+</span>Add {field.label}</button>)}
            </div>}
          </div>
        </div>
      </section>}
      <header className="mb-6 flex items-center gap-3 text-sm text-text-secondary">
        <span className="h-px w-8 bg-brand-gold" aria-hidden="true" /> Your collector identity
      </header>
      <section className="mb-6 overflow-hidden rounded-[28px] border border-border-default bg-bg-surface" aria-label="Profile overview">
        <div className="relative h-36 overflow-hidden bg-bg-elevated sm:h-52" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/30 via-bg-elevated to-brand-gold/20" />
          <div className="absolute -right-8 -top-24 size-80 rotate-12 rounded-[48px] border border-brand-blue/25" />
          <div className="absolute right-16 top-12 size-56 -rotate-12 rounded-[32px] border border-brand-gold/25" />
          <span className="absolute left-6 top-6 text-xs font-semibold uppercase tracking-[0.24em] text-text-secondary">Mythix / Collect. Connect. Trade.</span>
        </div>
        <div className="relative px-5 pb-7 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="relative -mt-14 size-28 rounded-full border-[6px] border-bg-surface bg-bg-card sm:-mt-16 sm:size-36">
              {user?.avatarUrl ? <img src={user.avatarUrl} alt={`${user.name}'s profile`} className="size-full rounded-full object-cover" /> : <span className="flex size-full items-center justify-center rounded-full bg-brand-blue/15 text-4xl font-semibold text-brand-blue">{user?.name?.trim().slice(0, 1).toUpperCase() || "M"}</span>}
              <button type="button" aria-label="Change profile photo" onClick={() => { setAvatarError(""); setAvatarEditorOpen(true); }} disabled={uploadingAvatar} className="absolute -bottom-1 -right-2 flex size-11 items-center justify-center rounded-full border-4 border-bg-surface bg-brand-blue text-bg-base transition-colors hover:bg-brand-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-blue"><Camera size={19} /></button>
            </div>
            <Button type="button" variant="secondary" className="mt-4 w-full shrink-0 gap-2 sm:w-auto" onClick={() => openEditor("profile")}><Edit3 size={16} aria-hidden="true" />Edit profile</Button>
          </div>
          <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" aria-label="Choose profile photo" className="sr-only" onChange={(event) => {
            const file = event.target.files?.[0]; event.target.value = "";
            if (!file) return;
            if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024 || file.size === 0) {
              setAvatarError("Choose a PNG, JPEG or WebP photo up to 5 MiB."); return;
            }
            setAvatarError(""); setAvatarFile(file); setAvatarEditorOpen(true);
          }} />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <h1 className="break-words text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">{user?.name || "Your name"}</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-gold/30 bg-brand-gold/10 px-3 py-1 text-xs font-semibold text-brand-gold"><ShieldCheck size={14} aria-hidden="true" />{user?.role === "ADMIN" ? "Administrator" : isSellerUser(user) ? "Seller" : "Collector"}</span>
          </div>
          <p className="mt-2 break-all text-sm text-text-secondary">{user?.email}</p>
          {avatarError && !avatarEditorOpen && <p role="alert" className="mt-3 text-sm text-status-danger">{avatarError}</p>}
          <section className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" aria-label="Contact information">
        <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-3 md:gap-5">
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
            <Button type="button" variant="secondary" className="w-full shrink-0 gap-2 sm:w-auto" onClick={() => openEditor("contact")}>
              <Edit3 size={16} aria-hidden="true" />Edit contact
            </Button>
          </section>

          <p className="sr-only" role="status" aria-live="polite">
            {copiedLabel ? `${copiedLabel} copied to clipboard.` : ""}
          </p>
        </div>
      </section>
      {user && <ProfileCollectionPreview key={`${user.id}:${token}`} />}
      <div>
        <div className="min-w-0">
      {user?.role === "USER" && !isSellerUser(user) && (hasPendingSellerApplication ? (
        <section className="mt-5 flex min-h-28 flex-col items-start justify-between gap-5 sm:flex-row sm:items-center rounded-2xl border border-status-warning/35 bg-status-warning/[0.07] px-5 py-5 sm:px-7" aria-labelledby="seller-application-pending-heading">
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
          className="group relative mt-5 flex min-h-28 flex-col items-start justify-between gap-5 overflow-hidden sm:flex-row sm:items-center rounded-2xl border border-brand-gold/35 bg-brand-gold/10 px-5 py-5 text-gray-100 transition-[border-color,background-color,box-shadow] duration-300 hover:border-brand-gold/65 hover:bg-brand-gold/[0.14] hover:shadow-[0_16px_36px_rgba(191,166,89,0.12)] focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2 focus:ring-offset-bg-base sm:px-7"
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
          <span className="relative inline-flex shrink-0 sm:ml-4 items-center gap-2 rounded-full bg-brand-gold px-4 py-3 text-sm font-semibold text-bg-base transition-[transform,box-shadow,background-color] duration-200 ease-out group-hover:-translate-y-0.5 group-hover:bg-[#d2b965] group-hover:shadow-lg group-hover:shadow-brand-gold/20 group-active:translate-y-0">
            Become a seller
            <ChevronRight size={16} className="transition-transform duration-200 ease-out group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </Link>
      ))}
        </div>
      </div>
      {avatarEditorOpen && <AvatarPhotoEditor file={avatarFile} currentUrl={user?.avatarUrl} saving={uploadingAvatar} error={avatarError} onUpload={() => fileInput.current?.click()} onClose={() => { setAvatarEditorOpen(false); setAvatarFile(null); setAvatarError(""); }} onSave={saveAvatar} />}
      <Modal
        isOpen={activeEditor === "profile"}
        onClose={() => { if (!isSaving) setActiveEditor(null); }}
        title="Edit profile"
        aria-describedby="profile-editor-description"
        mobileSheet
        className="bg-bg-surface md:rounded-3xl"
        footer={<><Button type="button" variant="ghost" className="flex-1 sm:flex-none" onClick={() => setActiveEditor(null)} disabled={isSaving}>Cancel</Button><Button type="submit" className="flex-1 gap-2 sm:flex-none" form="edit-profile-form" isLoading={isSaving}><Check size={16} aria-hidden="true" />Save changes</Button></>}
      >
        <form id="edit-profile-form" onSubmit={saveProfile} className="space-y-6 p-1 sm:p-2">
          <div className="flex items-center gap-4 rounded-2xl bg-brand-blue/[0.07] p-4">
            <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-brand-blue/25 bg-bg-elevated text-xl font-semibold text-brand-blue">
              {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="size-full object-cover" /> : <UserRound size={25} aria-hidden="true" />}
            </span>
            <div><p className="font-semibold text-text-primary">Your personal details</p><p id="profile-editor-description" className="mt-1 text-sm leading-5 text-text-secondary">Keep your name and email up to date.</p></div>
          </div>
          <fieldset disabled={isSaving} className="space-y-5 rounded-2xl border border-border-default bg-bg-base/40 p-4 sm:p-5">
            <legend className="sr-only">Personal information</legend>
          <Input id="name" label="Full name" placeholder="e.g. Naphat Phoruang" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" icon={UserRound} className="h-12 text-base" required />
          <Input id="email" label="Email" type="email" placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" icon={Mail} className="h-12 text-base" required />
          </fieldset>
          {editorError && <p className="text-sm text-status-danger" role="alert">{editorError}</p>}
        </form>
      </Modal>
      <Modal
        isOpen={activeEditor === "contact"}
        onClose={() => { if (!isSaving) setActiveEditor(null); }}
        title="Edit contact"
        aria-describedby="contact-editor-description"
        mobileSheet
        className="bg-bg-surface md:rounded-3xl"
        footer={<><Button type="button" variant="ghost" className="flex-1 sm:flex-none" onClick={() => setActiveEditor(null)} disabled={isSaving}>Cancel</Button><Button type="submit" className="flex-1 gap-2 sm:flex-none" form="edit-contact-form" isLoading={isSaving}><Check size={16} aria-hidden="true" />Save contact</Button></>}
      >
        <form id="edit-contact-form" onSubmit={saveContact} className="space-y-6 p-1 sm:p-2">
          <div className="flex items-center gap-4 rounded-2xl bg-brand-gold/[0.07] p-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-brand-gold/25 bg-bg-elevated text-brand-gold"><Phone size={24} aria-hidden="true" /></span>
            <div><p className="font-semibold text-text-primary">Stay connected</p><p id="contact-editor-description" className="mt-1 text-sm leading-5 text-text-secondary">Choose how other collectors can reach you.</p></div>
          </div>
          <fieldset disabled={isSaving} className="space-y-5 rounded-2xl border border-border-default bg-bg-base/40 p-4 sm:p-5">
            <legend className="sr-only">Contact information</legend>
          <Input id="phone" label="Phone" type="tel" placeholder="e.g. +66 81 234 5678" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" icon={Phone} className="h-12 text-base" />
          <Input id="line" label="LINE ID" iconUrl="https://cdn.simpleicons.org/line/06C755" placeholder="e.g. naphat.tcg" value={line} onChange={(event) => setLine(event.target.value)} className="h-12 text-base" />
          <Input id="facebook" label="Facebook" iconUrl="https://cdn.simpleicons.org/facebook/1877F2" placeholder="e.g. facebook.com/naphat.tcg" value={facebook} onChange={(event) => setFacebook(event.target.value)} className="h-12 text-base" />
          <p className="text-xs leading-5 text-text-secondary">All contact fields are optional. Clear a field to remove it from your profile.</p>
          </fieldset>
          {editorError && <p className="text-sm text-status-danger" role="alert">{editorError}</p>}
        </form>
      </Modal>
    </main>
  );
}

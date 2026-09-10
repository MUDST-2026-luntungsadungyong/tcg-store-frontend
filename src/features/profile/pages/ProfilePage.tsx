import type { ElementType } from "react";
import { Link } from "react-router-dom";
import { Edit3, Mail, Phone } from "lucide-react";
import { useAuthStore } from "@/features/auth/model/useAuthStore";

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
    <div className="flex min-w-0 items-center gap-3 py-2">
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
  "inline-flex min-h-11 shrink-0 items-center gap-2 px-1 text-sm font-medium text-brand-blue transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 focus:ring-offset-bg-base";

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-7">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          My Profile
        </h1>
      </header>
      <section
        className="rounded-xl border border-white/10 bg-bg-surface p-5 sm:p-6"
        aria-labelledby="personal-information-heading"
      >
        <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <h2
            id="personal-information-heading"
            className="text-xl font-semibold text-white"
          >
            Personal Information
          </h2>
          <Link className={editLinkClassName} to="/profile/edit">
            <Edit3 size={16} aria-hidden="true" />
            Edit profile
          </Link>
        </div>
        <div className="mt-5">
          <div className="min-w-0">
            <p className="truncate text-xl font-semibold text-white">
              {user?.name || "Your name"}
            </p>
            <p className="mt-1 flex min-w-0 items-center gap-2 text-sm text-gray-400">
              <Mail
                size={16}
                className="shrink-0 text-brand-blue"
                aria-hidden="true"
              />
              <span className="truncate">
                {user?.email || "Email not added"}
              </span>
            </p>
          </div>
        </div>
        <div
          className="mt-6 border-t border-white/10 pt-6"
          aria-labelledby="contact-information-heading"
        >
          <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <h2
              id="contact-information-heading"
              className="text-xl font-semibold text-white"
            >
              Contact Information
            </h2>
            <Link className={editLinkClassName} to="/profile/edit/contact">
              <Edit3 size={16} aria-hidden="true" />
              Edit contact
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <ContactItem
              icon={Phone}
              label="Phone"
              value={user?.phone}
              iconClassName="text-brand-blue"
            />
            <ContactItem
              iconUrl="https://cdn.simpleicons.org/line/06C755"
              label="LINE ID"
              value={user?.line}
              iconClassName=""
            />
            <ContactItem
              iconUrl="https://cdn.simpleicons.org/facebook/1877F2"
              label="Facebook"
              value={user?.facebook}
              iconClassName=""
            />
          </div>
        </div>
      </section>
      {user?.role === "BUYER" && (
        <Link
          className="mt-6 inline-flex min-h-11 items-center rounded-full bg-brand-gold px-5 text-sm font-semibold text-bg-base transition-colors hover:bg-brand-gold/85 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2 focus:ring-offset-bg-base"
          to="/profile/seller-application"
        >
          Become a seller
        </Link>
      )}
    </main>
  );
}

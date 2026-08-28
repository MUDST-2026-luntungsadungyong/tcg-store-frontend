import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, CreditCard, Pencil } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

interface ProfileRowProps {
  icon: typeof MapPin;
  title: string;
  editHref: string;
  children: React.ReactNode;
}

function ProfileRow({ icon: Icon, title, editHref, children }: ProfileRowProps) {
  return (
    <div className="flex items-start justify-between gap-6 px-8 py-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-blue/15 text-brand-blue ring-1 ring-brand-blue/30">
          <Icon size={18} />
        </span>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
          <div className="mt-1.5 space-y-1 text-gray-300">{children}</div>
        </div>
      </div>
      <Link
        to={editHref}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-brand-blue transition-colors hover:bg-brand-blue/10 focus:outline-none focus:ring-2 focus:ring-brand-blue/50"
      >
        <Pencil size={14} />
        Edit
      </Link>
    </div>
  );
}

export function ProfileSettingsPage() {
  const user = useAuthStore((s) => s.user);

  const hasAddress = user?.addressLine && user?.province;
  const hasPayment = user?.cardLast4;
  const displayName = user?.name ?? 'Jane Doe';

  return (
    <div className="max-w-[900px] mx-auto px-8 py-16 w-full">
      <h1 className="mb-8 text-3xl font-bold text-white">My Profile</h1>

      {/* One surface, one identity — every fact about the user lives inside the same card, split only by dividers */}
      <section className="glass-card rounded-2xl">
        <div className="flex items-start justify-between gap-6 px-8 py-7">
          <div className="flex items-center gap-4">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="size-14 shrink-0 rounded-full object-cover ring-1 ring-white/10"
              />
            ) : (
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-blue/20 text-xl font-bold text-brand-blue ring-1 ring-brand-blue/40">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
            <div>
              <h2 className="text-2xl font-bold text-white">{displayName}</h2>
              <div className="mt-1.5 space-y-1 text-gray-300">
                <p className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-gray-500" />
                  {user?.email ?? 'you@example.com'}
                </p>
                <p className="flex items-center gap-2 text-sm">
                  <Phone size={14} className="text-gray-500" />
                  {user?.phone ?? '+1 555-0199'}
                </p>
              </div>
            </div>
          </div>
          <Link
            to="/profile/edit/personal"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-brand-blue transition-colors hover:bg-brand-blue/10 focus:outline-none focus:ring-2 focus:ring-brand-blue/50"
          >
            <Pencil size={14} />
            Edit
          </Link>
        </div>

        <div className="divide-y divide-white/5 border-t border-white/5">
          <ProfileRow icon={MapPin} title="Shipping Address" editHref="/profile/edit/address">
            {hasAddress ? (
              <>
                <p className="text-base font-medium text-white">{user?.addressLine}</p>
                <p className="text-sm">{user?.subDistrict}, {user?.district}, {user?.province} {user?.postalCode}</p>
              </>
            ) : (
              <p className="text-sm text-gray-500">No address on file yet</p>
            )}
          </ProfileRow>

          <ProfileRow icon={CreditCard} title="Payment Method" editHref="/profile/edit/payment">
            {hasPayment ? (
              <>
                <p className="text-base font-medium text-white">
                  {user?.cardBrand ? `${user.cardBrand} ` : ''}ending in {user?.cardLast4}
                </p>
                <p className="text-sm">{user?.cardHolder} · Expires {user?.cardExpiry}</p>
              </>
            ) : (
              <p className="text-sm text-gray-500">No payment method on file yet</p>
            )}
          </ProfileRow>
        </div>
      </section>
    </div>
  );
}

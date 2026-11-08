import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '@/features/auth/layouts/AuthLayout';

export function ResetSuccessPage() {
  return (
    <AuthLayout title="Password Changed Successfully">
      <div className="mt-5 flex flex-col items-center gap-4 text-center">
        <CheckCircle2 className="size-12 text-status-success" aria-hidden="true" />
        <p className="text-sm text-gray-300">
          Your password has been changed. Sign in with your new password to continue.
        </p>
      </div>

      <Link
        to="/login"
        className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-brand-blue px-6 py-3 text-lg font-semibold text-bg-base transition-colors hover:bg-[#4a85e0] focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 focus:ring-offset-bg-base"
      >
        Go to Login
      </Link>
    </AuthLayout>
  );
}

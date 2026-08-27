import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/common/Button';

export function ResetSuccessPage() {
  return (
    <AuthLayout title="Password Updated">
      <div className="mt-4 flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="size-10 text-status-success" />
        <p className="text-sm text-gray-400">
          Your password has been updated. You can now sign in with your new password.
        </p>
      </div>

      <div className="mt-6">
        <Link to="/login">
          <Button type="button" variant="primary" size="lg" className="w-full font-semibold">
            Go to Login
          </Button>
        </Link>
      </div>

      <p className="mt-6 text-center text-sm text-gray-400">
        <Link to="/" className="font-medium text-brand-blue hover:text-brand-blue/80 hover:underline">
          Back to Home
        </Link>
      </p>
    </AuthLayout>
  );
}

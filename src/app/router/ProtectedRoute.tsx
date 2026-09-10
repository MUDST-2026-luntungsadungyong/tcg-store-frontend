import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { isSellerUser, type Role } from '@/entities/account/model/types';

export function ProtectedRoute({ requiredRole, requiredSeller }: { requiredRole?: Role; requiredSeller?: boolean }) {
  const location = useLocation();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const isHydrating = useAuthStore((s) => s.isHydrating);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search + location.hash }} />;
  }

  if (isHydrating) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen items-center justify-center bg-bg-base text-gray-400"
      >
        Checking your session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search + location.hash }} />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  if (requiredSeller && !isSellerUser(user)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

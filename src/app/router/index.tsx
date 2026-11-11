import { createBrowserRouter, type RouteObject } from 'react-router-dom';

import { PublicLayout } from '@/app/layouts/PublicLayout';
import { WorkspaceLayout } from '@/app/layouts/WorkspaceLayout';
import { AdminLayout } from '@/app/layouts/AdminLayout';
import { authRoutes } from '@/features/auth/routes';
import { adminAuctionRoutes, buyerAuctionRoutes, sellerAuctionRoutes } from '@/features/auctions/routes';
import { collectionRoutes, publicCollectionRoutes } from '@/features/collection/routes';
import { checkoutRoutes } from '@/features/checkout/routes';
import { discoveryRoutes } from '@/features/discovery/routes';
import { notificationRoutes } from '@/features/notifications/routes';
import { profileRoutes } from '@/features/profile/routes';
import { reservationCartRoutes } from '@/features/reservation-cart/routes';
import {
  buyerReservationRoutes,
  sellerReservationRoutes,
} from '@/features/reservations/routes';
import { listingWorkspaceRoutes } from '@/features/listings/routes';
import { publicStoreRoutes, sellerStoreRoutes } from '@/features/stores/routes';
import { publicVoucherRoutes, userVoucherRoutes } from '@/features/vouchers/routes';
import { AdminSellerApplicationsPage } from '@/features/admin/pages/AdminSellerApplicationsPage';
import { AdminDashboardPage } from '@/features/admin/pages/AdminDashboardPage';
import { AdminAuditLogsPage } from '@/features/admin/pages/AdminAuditLogsPage';
import { AdminOrderLogsPage } from '@/features/admin/pages/AdminOrderLogsPage';
import { AdminUsersPage } from '@/features/admin/pages/AdminUsersPage';
import { AdminVouchersPage } from '@/features/admin/pages/AdminVouchersPage';

import { NotFoundPage } from './NotFoundPage';
import { ProtectedRoute } from './ProtectedRoute';
import { RouteErrorBoundary } from '@/shared/components/ErrorBoundary';

const accountRoutes: RouteObject = {
  element: <ProtectedRoute />,
  children: [
    ...reservationCartRoutes,
    ...checkoutRoutes,
    ...buyerReservationRoutes,
    ...collectionRoutes,
    ...notificationRoutes,
    ...profileRoutes,
    ...userVoucherRoutes,
  ],
};

const workspaceRoute: RouteObject = {
  path: '/workspace',
  element: <ProtectedRoute requiredSeller />,
  children: [
    {
      element: <WorkspaceLayout />,
      children: [...listingWorkspaceRoutes, ...sellerReservationRoutes, ...sellerStoreRoutes, ...sellerAuctionRoutes],
    },
  ],
};

const adminRoute: RouteObject = {
  path: '/admin',
  element: <ProtectedRoute requiredRole="ADMIN" />,
  children: [{
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'vouchers', element: <AdminVouchersPage /> },
      { path: 'seller-applications', element: <AdminSellerApplicationsPage /> },
      { path: 'audit-logs', element: <AdminAuditLogsPage /> },
      { path: 'orders', element: <AdminOrderLogsPage /> },
      { path: 'users', element: <AdminUsersPage /> },
      ...adminAuctionRoutes,
    ],
  }],
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      ...discoveryRoutes,
      ...buyerAuctionRoutes,
      ...authRoutes,
      ...publicStoreRoutes,
      ...publicCollectionRoutes,
      ...publicVoucherRoutes,
      accountRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  workspaceRoute,
  adminRoute,
]);

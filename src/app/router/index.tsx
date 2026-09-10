import { createBrowserRouter, type RouteObject } from 'react-router-dom';

import { PublicLayout } from '@/app/layouts/PublicLayout';
import { WorkspaceLayout } from '@/app/layouts/WorkspaceLayout';
import { authRoutes } from '@/features/auth/routes';
import { collectionRoutes } from '@/features/collection/routes';
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

import { NotFoundPage } from './NotFoundPage';
import { ProtectedRoute } from './ProtectedRoute';

const accountRoutes: RouteObject = {
  element: <ProtectedRoute />,
  children: [
    ...reservationCartRoutes,
    ...checkoutRoutes,
    ...buyerReservationRoutes,
    ...collectionRoutes,
    ...notificationRoutes,
    ...profileRoutes,
  ],
};

const workspaceRoute: RouteObject = {
  path: '/workspace',
  element: <ProtectedRoute requiredSeller />,
  children: [
    {
      element: <WorkspaceLayout />,
      children: [...listingWorkspaceRoutes, ...sellerReservationRoutes, ...sellerStoreRoutes],
    },
  ],
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      ...discoveryRoutes,
      ...authRoutes,
      ...publicStoreRoutes,
      accountRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  workspaceRoute,
]);

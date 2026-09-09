import { createBrowserRouter, type RouteObject } from 'react-router-dom';

import { PublicLayout } from '@/app/layouts/PublicLayout';
import { WorkspaceLayout } from '@/app/layouts/WorkspaceLayout';
import { authRoutes } from '@/features/auth/routes';
import { collectionRoutes } from '@/features/collection/routes';
import { discoveryRoutes } from '@/features/discovery/routes';
import { notificationRoutes } from '@/features/notifications/routes';
import { profileRoutes } from '@/features/profile/routes';
import { reservationCartRoutes } from '@/features/reservation-cart/routes';
import {
  buyerReservationRoutes,
  sellerReservationRoutes,
} from '@/features/reservations/routes';
import { listingWorkspaceRoutes } from '@/features/listings/routes';

import { NotFoundPage } from './NotFoundPage';
import { ProtectedRoute } from './ProtectedRoute';

const accountRoutes: RouteObject = {
  element: <ProtectedRoute />,
  children: [
    ...reservationCartRoutes,
    ...buyerReservationRoutes,
    ...collectionRoutes,
    ...notificationRoutes,
    ...profileRoutes,
  ],
};

const workspaceRoute: RouteObject = {
  path: '/workspace',
  element: <ProtectedRoute requiredRole="SELLER" />,
  children: [
    {
      element: <WorkspaceLayout />,
      children: [...listingWorkspaceRoutes, ...sellerReservationRoutes],
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
      accountRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  workspaceRoute,
]);

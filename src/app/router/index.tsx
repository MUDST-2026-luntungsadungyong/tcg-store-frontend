import { createBrowserRouter, type RouteObject } from 'react-router-dom';

import { PlatformAdminLayout } from '@/app/layouts/PlatformAdminLayout';
import { SellerLayout } from '@/app/layouts/SellerLayout';
import { StoreLayout } from '@/app/layouts/StoreLayout';
import { adminRoutes } from '@/features/admin/routes';
import { authRoutes } from '@/features/auth/routes';
import { cartRoutes } from '@/features/cart/routes';
import { catalogRoutes } from '@/features/catalog/routes';
import { checkoutRoutes } from '@/features/checkout/routes';
import { orderRoutes } from '@/features/orders/routes';
import { profileRoutes } from '@/features/profile/routes';
import { collectionRoutes } from '@/features/collection/routes';
import { sellerPortalRoutes, sellerPublicRoutes } from '@/features/seller/routes';

import { NotFoundPage } from './NotFoundPage';
import { ProtectedRoute } from './ProtectedRoute';

const accountRoutes: RouteObject = {
  element: <ProtectedRoute />,
  children: [...profileRoutes, ...orderRoutes, ...collectionRoutes],
};

const sellerRoute: RouteObject = {
  path: '/seller',
  element: <ProtectedRoute requiredRole="SELLER" />,
  children: [{ element: <SellerLayout />, children: sellerPortalRoutes }],
};

const adminRoute: RouteObject = {
  path: '/platform-admin',
  element: <ProtectedRoute requiredRole="ADMIN" />,
  children: [{ element: <PlatformAdminLayout />, children: adminRoutes }],
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <StoreLayout />,
    children: [
      ...catalogRoutes,
      ...sellerPublicRoutes,
      ...cartRoutes,
      ...checkoutRoutes,
      ...authRoutes,
      accountRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  sellerRoute,
  adminRoute,
]);

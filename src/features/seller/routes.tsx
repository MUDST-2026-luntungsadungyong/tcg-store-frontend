import { Navigate, type RouteObject } from 'react-router-dom';

import { PlaceholderPage } from '@/shared/components/PlaceholderPage';

export const sellerPublicRoutes: RouteObject[] = [
  { path: 'stores/:sellerId', element: <PlaceholderPage title="Seller Storefront" /> },
];

export const sellerPortalRoutes: RouteObject[] = [
  { index: true, element: <Navigate to="inventory" replace /> },
  { path: 'dashboard', element: <PlaceholderPage title="Seller Dashboard" /> },
  {
    path: 'inventory',
    lazy: async () => ({ Component: (await import('./pages/ProductManagementPage')).ProductManagementPage }),
  },
  { path: 'products', element: <Navigate to="/seller/inventory" replace /> },
  { path: 'listings', element: <Navigate to="/seller/inventory" replace /> },
  { path: 'orders', element: <PlaceholderPage title="Seller Orders" /> },
  { path: 'orders/:id', element: <PlaceholderPage title="Seller Order Details" /> },
  { path: 'collection', element: <PlaceholderPage title="My Collection" /> },
  { path: 'payouts', element: <PlaceholderPage title="Payouts" /> },
  { path: 'store-profile', element: <PlaceholderPage title="Store Profile" /> },
];

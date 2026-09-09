import type { RouteObject } from 'react-router-dom';
import { PublicStorePage } from './pages/PublicStorePage';
import { StoreSettingsPage } from './pages/StoreSettingsPage';

export const publicStoreRoutes: RouteObject[] = [
  { path: 'stores/:sellerId', element: <PublicStorePage /> },
];
export const sellerStoreRoutes: RouteObject[] = [
  { path: 'store-settings', element: <StoreSettingsPage /> },
];

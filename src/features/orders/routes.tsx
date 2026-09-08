import type { RouteObject } from 'react-router-dom';

import { PlaceholderPage } from '@/shared/components/PlaceholderPage';

export const orderRoutes: RouteObject[] = [
  { path: 'orders', element: <PlaceholderPage title="My Orders" /> },
  { path: 'orders/:id', element: <PlaceholderPage title="Order Details" /> },
];

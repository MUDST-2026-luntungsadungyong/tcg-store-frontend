import type { RouteObject } from 'react-router-dom';

import { PlaceholderPage } from '@/shared/components/PlaceholderPage';

export const checkoutRoutes: RouteObject[] = [
  { path: 'checkout', element: <PlaceholderPage title="Order Review" /> },
];

import type { RouteObject } from 'react-router-dom';
import { PlaceholderPage } from '@/shared/components/PlaceholderPage';

export const buyerReservationRoutes: RouteObject[] = [
  { path: 'orders', element: <PlaceholderPage title="My Reservation Orders" /> },
];

export const sellerReservationRoutes: RouteObject[] = [
  { path: 'orders', element: <PlaceholderPage title="Reservation Order Management" /> },
];

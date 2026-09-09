import type { RouteObject } from 'react-router-dom';
import { PlaceholderPage } from '@/shared/components/PlaceholderPage';

export const reservationCartRoutes: RouteObject[] = [
  { path: 'cart', element: <PlaceholderPage title="Reservation Cart" /> },
];

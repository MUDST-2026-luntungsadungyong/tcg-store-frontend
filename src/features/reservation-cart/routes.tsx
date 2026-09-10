import type { RouteObject } from 'react-router-dom';
import { ReservationCartPage } from './pages/ReservationCartPage';

export const reservationCartRoutes: RouteObject[] = [
  { path: 'cart', element: <ReservationCartPage /> },
];

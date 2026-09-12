import type { RouteObject } from 'react-router-dom';

import { CheckoutPage } from './pages/CheckoutPage';
import { ReservationConfirmationPage } from './pages/ReservationConfirmationPage';

export const checkoutRoutes: RouteObject[] = [
  { path: 'checkout', element: <CheckoutPage /> },
  { path: 'checkout/confirmation', element: <ReservationConfirmationPage /> },
];

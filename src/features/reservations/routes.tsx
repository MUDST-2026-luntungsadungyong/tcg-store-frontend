import type { RouteObject } from 'react-router-dom';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { SellerOrdersPage } from './pages/SellerOrdersPage';

export const buyerReservationRoutes: RouteObject[] = [
  { path: 'orders', element: <MyOrdersPage /> },
  { path: 'orders/:orderId', element: <MyOrdersPage /> },
];

export const sellerReservationRoutes: RouteObject[] = [
  { path: 'orders', element: <SellerOrdersPage /> },
];

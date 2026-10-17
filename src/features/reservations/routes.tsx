import type { RouteObject } from 'react-router-dom';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { SellerOrdersPage } from './pages/SellerOrdersPage';

export const buyerReservationRoutes: RouteObject[] = [
  { path: 'orders', element: <MyOrdersPage /> },
  { path: 'orders/:orderId', element: <OrderDetailPage /> },
];

export const sellerReservationRoutes: RouteObject[] = [
  { path: 'orders', element: <SellerOrdersPage /> },
];

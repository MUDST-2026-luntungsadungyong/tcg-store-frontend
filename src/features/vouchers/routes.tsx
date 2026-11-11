import type { RouteObject } from 'react-router-dom';
import { VoucherCenterPage } from './pages/VoucherCenterPage';
import { MyVouchersPage } from './pages/MyVouchersPage';

export const publicVoucherRoutes: RouteObject[] = [
  {
    path: '/vouchers',
    element: <VoucherCenterPage />,
  },
];

export const userVoucherRoutes: RouteObject[] = [
  {
    path: '/profile/vouchers',
    element: <MyVouchersPage />,
  },
];

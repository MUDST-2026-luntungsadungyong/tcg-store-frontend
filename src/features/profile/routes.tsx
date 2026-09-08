import type { RouteObject } from 'react-router-dom';

import { PlaceholderPage } from '@/shared/components/PlaceholderPage';

export const profileRoutes: RouteObject[] = [
  {
    path: 'profile',
    lazy: async () => ({ Component: (await import('./pages/ProfileSettingsPage')).ProfileSettingsPage }),
  },
  {
    path: 'profile/edit/personal',
    lazy: async () => ({ Component: (await import('./pages/EditPersonalInfoPage')).EditPersonalInfoPage }),
  },
  {
    path: 'profile/edit/address',
    lazy: async () => ({ Component: (await import('./pages/EditShippingAddressPage')).EditShippingAddressPage }),
  },
  {
    path: 'profile/edit/payment',
    lazy: async () => ({ Component: (await import('./pages/EditPaymentMethodPage')).EditPaymentMethodPage }),
  },
  { path: 'become-a-seller', element: <PlaceholderPage title="Become a Seller" /> },
];

import type { RouteObject } from 'react-router-dom';
import { ProfilePage } from './pages/ProfilePage';import { EditProfilePage } from './pages/EditProfilePage';import { EditContactInformationPage } from './pages/EditContactInformationPage';import { SellerApplicationPage } from './pages/SellerApplicationPage';

export const profileRoutes: RouteObject[] = [
  { path: 'profile', element: <ProfilePage /> },
  { path: 'profile/edit', element: <EditProfilePage /> },
  { path: 'profile/edit/contact', element: <EditContactInformationPage /> },
  { path: 'profile/seller-application', element: <SellerApplicationPage /> },
];

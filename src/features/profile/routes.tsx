import type { RouteObject } from 'react-router-dom';
import { PlaceholderPage } from '@/shared/components/PlaceholderPage';

export const profileRoutes: RouteObject[] = [
  { path: 'profile', element: <PlaceholderPage title="Profile" /> },
  { path: 'profile/edit', element: <PlaceholderPage title="Edit Profile" /> },
];

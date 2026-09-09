import type { RouteObject } from 'react-router-dom';
import { PlaceholderPage } from '@/shared/components/PlaceholderPage';

export const notificationRoutes: RouteObject[] = [
  { path: 'notifications', element: <PlaceholderPage title="Notifications" /> },
];

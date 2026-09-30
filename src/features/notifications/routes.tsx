import type { RouteObject } from 'react-router-dom';
import { NotificationsPage } from './pages/NotificationsPage';

export const notificationRoutes: RouteObject[] = [
  { path: 'notifications', element: <NotificationsPage /> },
];

import { Navigate, type RouteObject } from 'react-router-dom';

import { PlaceholderPage } from '@/shared/components/PlaceholderPage';

export const adminRoutes: RouteObject[] = [
  { index: true, element: <Navigate to="monitoring" replace /> },
  { path: 'monitoring', element: <PlaceholderPage title="Admin Monitoring" /> },
  { path: 'dashboard', element: <Navigate to="/platform-admin/monitoring" replace /> },
  { path: 'users', element: <PlaceholderPage title="Manage Users" /> },
  { path: 'qc-hub', element: <PlaceholderPage title="QC Hub" /> },
  { path: 'escrow', element: <PlaceholderPage title="Escrow Management" /> },
];

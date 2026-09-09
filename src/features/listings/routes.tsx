import { Navigate, type RouteObject } from 'react-router-dom';

export const listingWorkspaceRoutes: RouteObject[] = [
  { index: true, element: <Navigate to="listings" replace /> },
  {
    path: 'listings',
    lazy: async () => ({
      Component: (await import('./pages/ListingManagementPage'))
        .ListingManagementPage,
    }),
  },
];

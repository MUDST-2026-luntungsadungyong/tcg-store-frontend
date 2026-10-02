import type { RouteObject } from 'react-router-dom';

export const discoveryRoutes: RouteObject[] = [
  {
    index: true,
    lazy: async () => ({ Component: (await import('./pages/HomePage')).HomePage }),
  },
  {
    path: 'cards',
    // --- FOR TESTING ROUTE ERROR BOUNDARY (CASE 3) ---
    // UNCOMMENT THE LOADER BELOW TO TEST THE ROUTE ERROR BOUNDARY
    // loader: () => { throw new Error("Test RouteErrorBoundary (Case 3): Simulated route crash"); },
    // -------------------------------------------------
    lazy: async () => ({ Component: (await import('./pages/CardDiscoveryPage')).CardDiscoveryPage }),
  },
  {
    path: 'marketplace',
    lazy: async () => ({ Component: (await import('./pages/CardDiscoveryPage')).CardDiscoveryPage }),
  },
  {
    path: 'cards/:id',
    lazy: async () => ({ Component: (await import('./pages/CardDetailPage')).CardDetailPage }),
  },
];

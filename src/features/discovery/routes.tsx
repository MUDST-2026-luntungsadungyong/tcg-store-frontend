import type { RouteObject } from 'react-router-dom';

export const discoveryRoutes: RouteObject[] = [
  {
    index: true,
    lazy: async () => ({ Component: (await import('./pages/HomePage')).HomePage }),
  },
  {
    path: 'cards',
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

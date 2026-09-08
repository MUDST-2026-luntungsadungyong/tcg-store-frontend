import type { RouteObject } from 'react-router-dom';

export const catalogRoutes: RouteObject[] = [
  {
    index: true,
    lazy: async () => ({ Component: (await import('./pages/HomePage')).HomePage }),
  },
  {
    path: 'browse',
    lazy: async () => ({ Component: (await import('./pages/BrowsePage')).BrowsePage }),
  },
  {
    path: 'products/:id',
    lazy: async () => ({ Component: (await import('./pages/ProductDetailPage')).ProductDetailPage }),
  },
];

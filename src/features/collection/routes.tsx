import type { RouteObject } from 'react-router-dom';

export const collectionRoutes: RouteObject[] = [
  {
    path: 'collection',
    lazy: async () => ({ Component: (await import('./pages/MyCollectionPage')).MyCollectionPage }),
  },
];

export const publicCollectionRoutes: RouteObject[] = [
  {
    path: 'collections/:userId',
    lazy: async () => ({ Component: (await import('./pages/PublicCollectionPage')).PublicCollectionPage }),
  },
];

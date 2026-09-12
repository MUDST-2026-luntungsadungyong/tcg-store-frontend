import type { RouteObject } from 'react-router-dom';

export const collectionRoutes: RouteObject[] = [
  {
    path: 'collection',
    lazy: async () => ({ Component: (await import('./pages/MyCollectionPage')).MyCollectionPage }),
  },
];

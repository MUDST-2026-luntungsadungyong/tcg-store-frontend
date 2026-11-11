import type { RouteObject } from 'react-router-dom';

export const collectionRoutes: RouteObject[] = [
  {
    path: 'collection',
    lazy: async () => ({ Component: (await import('./pages/MyCollectionPage')).MyCollectionPage }),
  },
  {
    path: 'my-collection',
    lazy: async () => ({ Component: (await import('./pages/MyCollectionPage')).MyCollectionPage }),
  },
];

export const publicCollectionRoutes: RouteObject[] = [
  {
    path: 'collections',
    lazy: async () => ({ Component: (await import('./pages/PublicCollectionsExplorePage')).PublicCollectionsExplorePage }),
  },
  {
    path: 'collections/:userId',
    lazy: async () => ({ Component: (await import('./pages/PublicCollectionPage')).PublicCollectionPage }),
  },
];

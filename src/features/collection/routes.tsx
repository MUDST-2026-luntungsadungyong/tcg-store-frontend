import type { RouteObject } from 'react-router-dom';
import { PlaceholderPage } from '@/shared/components/PlaceholderPage';

export const collectionRoutes: RouteObject[] = [
  { path: 'collection', element: <PlaceholderPage title="My Collection" /> },
];

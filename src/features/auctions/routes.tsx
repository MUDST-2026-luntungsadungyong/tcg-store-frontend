import type { RouteObject } from 'react-router-dom';
const auctionWizard = async () => ({ Component: (await import('./pages/AuctionWizardPage')).AuctionWizardPage });

export const sellerAuctionRoutes: RouteObject[] = [
  { path: 'auctions', lazy: async () => ({ Component: (await import('./pages/MyAuctionsPage')).MyAuctionsPage }) },
  { path: 'auctions/new', lazy: auctionWizard },
  { path: 'auctions/:auctionId', lazy: async () => ({ Component: (await import('./pages/AuctionDetailsPage')).AuctionDetailsPage }) },
  { path: 'auctions/:auctionId/edit', lazy: auctionWizard },
];

export const adminAuctionRoutes: RouteObject[] = [
  {
    path: 'auction-cancellation-requests',
    lazy: async () => ({ Component: (await import('./pages/AdminAuctionCancellationsPage')).AdminAuctionCancellationsPage }),
  },
  {
    path: 'auction-cancellation-requests/:requestId',
    lazy: async () => ({ Component: (await import('./pages/AdminAuctionCancellationsPage')).AdminAuctionCancellationReviewPage }),
  },
];

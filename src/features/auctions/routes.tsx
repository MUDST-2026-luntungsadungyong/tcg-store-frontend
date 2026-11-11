import type { RouteObject } from 'react-router-dom';
const auctionWizard = async () => ({ Component: (await import('./pages/AuctionWizardPage')).AuctionWizardPage });

export const buyerAuctionRoutes: RouteObject[] = [
  { path: 'auctions', lazy: async () => ({ Component: (await import('./pages/BuyerAuctionsPage')).BuyerAuctionsPage }) },
  { path: 'auctions/:auctionId', lazy: async () => ({ Component: (await import('./pages/BuyerAuctionDetailPage')).BuyerAuctionDetailPage }) },
  { path: 'auctions/me', lazy: async () => ({ Component: (await import('./pages/AuctionPortfolioPage')).AuctionPortfolioPage }) },
];

export const sellerAuctionRoutes: RouteObject[] = [
  { path: 'auctions', lazy: async () => ({ Component: (await import('./pages/MyAuctionsPage')).MyAuctionsPage }) },
  { path: 'auctions/new', lazy: auctionWizard },
  { path: 'auctions/default-cases', lazy: async () => ({ Component: (await import('./pages/DefaultCasesPage')).SellerDefaultCasesPage }) },
  { path: 'auctions/analytics', lazy: async () => ({ Component: (await import('./pages/AuctionAnalyticsPage')).AuctionAnalyticsPage }) },
  { path: 'auctions/:auctionId', lazy: async () => ({ Component: (await import('./pages/AuctionDetailsPage')).AuctionDetailsPage }) },
  { path: 'auctions/:auctionId/edit', lazy: auctionWizard },
];

export const adminAuctionRoutes: RouteObject[] = [
  { path: 'auction-default-cases', lazy: async () => ({ Component: (await import('./pages/DefaultCasesPage')).AdminDefaultCasesPage }) },
  { path: 'auction-commission', lazy: async () => ({ Component: (await import('./pages/AuctionCommissionPage')).AuctionCommissionPage }) },
  {
    path: 'auction-cancellation-requests',
    lazy: async () => ({ Component: (await import('./pages/AdminAuctionCancellationsPage')).AdminAuctionCancellationsPage }),
  },
  {
    path: 'auction-cancellation-requests/:requestId',
    lazy: async () => ({ Component: (await import('./pages/AdminAuctionCancellationsPage')).AdminAuctionCancellationReviewPage }),
  },
];

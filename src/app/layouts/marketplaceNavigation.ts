import { Gavel, Home, Layers3, Library, Package, Search, Tag } from 'lucide-react';
import { matchPath } from 'react-router-dom';

export const marketplaceLinks = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/cards', label: 'Cards', icon: Search },
  { to: '/collections', label: 'Collections', icon: Layers3 },
  { to: '/auctions', label: 'Auctions', icon: Gavel },
  { to: '/vouchers', label: 'Voucher Center', icon: Tag },
] as const;

export const workspaceLink = { to: '/workspace/listings', label: 'Workspace', icon: Layers3 };

export const accountLinks = [
  { to: '/orders', label: 'My Orders', icon: Package },
  { to: '/profile/vouchers', label: 'My Vouchers', icon: Tag },
  { to: '/collection', label: 'My Collection', icon: Library },
];

export const sellerLinks = [
  { to: '/workspace/listings', label: 'Card Listings', icon: Layers3 },
  { to: '/workspace/orders', label: 'Seller Orders', icon: Package },
];

export function isMarketplaceLinkActive(to: string, pathname: string) {
  if (to === workspaceLink.to) return Boolean(matchPath('/workspace/*', pathname));
  return Boolean(matchPath({ path: to, end: to === '/' }, pathname));
}

import { Link, matchPath, useLocation } from 'react-router-dom';
import { ClipboardList, CreditCard, House, LayoutGrid, PanelTop } from 'lucide-react';
import { cn } from '@/shared/lib';

const sellerLinks = [
  {
    name: 'Dashboard',
    to: '/seller/dashboard',
    icon: LayoutGrid,
    activePaths: ['/seller', '/seller/dashboard'],
  },
  {
    name: 'Products',
    to: '/seller/inventory',
    icon: PanelTop,
    activePaths: ['/seller/products', '/seller/listings', '/seller/inventory'],
  },
  {
    name: 'Orders',
    to: '/seller/orders',
    icon: ClipboardList,
    activePaths: ['/seller/orders'],
  },
  {
    name: 'Payouts',
    to: '/seller/payouts',
    icon: CreditCard,
    activePaths: ['/seller/payouts'],
  },
  {
    name: 'Store Profile',
    to: '/seller/store-profile',
    icon: House,
    activePaths: ['/seller/store-profile'],
  },
] as const;

export function SellerSidebar() {
  const { pathname } = useLocation();

  return (
    <aside
      aria-label="Seller sidebar"
      className="hidden min-h-[calc(100vh-4rem)] w-[220px] shrink-0 flex-col bg-[#192338] font-sans shadow-[inset_0_0_0_1px_#31405A] md:flex"
    >
      {/* Reference at 2x: 220px sidebar, 44px rows, 12px side / 24px top inset. */}
      <nav aria-label="Seller navigation" className="flex flex-col gap-1 px-3 pb-6 pt-6">
        {sellerLinks.map((link) => {
          const Icon = link.icon;
          const isActive = link.activePaths.some((path) =>
            Boolean(matchPath({ path, end: path === '/seller' }, pathname)),
          );

          return (
            <Link
              key={link.to}
              to={link.to}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex h-11 w-full shrink-0 items-center gap-4 rounded-[10px] px-4 text-[15px] leading-5 text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#72A8FF]',
                isActive
                  ? 'bg-[#243350] font-bold'
                  : 'font-medium hover:bg-[#243350]/60',
              )}
            >
              <Icon
                aria-hidden="true"
                focusable="false"
                size={20}
                strokeWidth={1.5}
                fill={link.name === 'Dashboard' ? 'currentColor' : 'none'}
                className={cn('shrink-0', isActive ? 'text-white' : 'text-[#72A8FF]')}
              />
              <span className="whitespace-nowrap">{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

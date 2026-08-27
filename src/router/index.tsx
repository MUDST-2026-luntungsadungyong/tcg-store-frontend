import { createBrowserRouter, Outlet } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SellerLayout } from '@/components/layout/SellerLayout';
import { PlatformAdminLayout } from '@/components/layout/PlatformAdminLayout';

// Module 3 Pages
import { HomePage } from '@/pages/customer/HomePage';
import { BrowsePage } from '@/pages/customer/BrowsePage';
import { ProductDetailPage } from '@/pages/customer/ProductDetailPage';

// Base layout for customer-facing pages
function StoreLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-base text-white">
      <Navbar />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

// Temporary placeholder component
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="max-w-[1440px] mx-auto px-8 py-7 w-full flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-3xl font-bold text-white mb-4">{title}</h1>
      <p className="text-gray-400">This page is under construction.</p>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <StoreLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'browse', element: <BrowsePage /> },
      { path: 'products/:id', element: <ProductDetailPage /> },
      { path: 'cart', element: <PlaceholderPage title="Shopping Cart" /> },
      { path: 'checkout', element: <PlaceholderPage title="Checkout" /> },
      { path: 'login', element: <PlaceholderPage title="Login" /> },
      { path: 'register', element: <PlaceholderPage title="Register" /> },
      { path: 'profile', element: <PlaceholderPage title="My Profile" /> },
      { path: 'orders', element: <PlaceholderPage title="My Orders" /> },
    ],
  },
  {
    path: '/seller',
    element: <SellerLayout />,
    children: [
      { index: true, element: <PlaceholderPage title="Seller Dashboard" /> },
      { path: 'dashboard', element: <PlaceholderPage title="Seller Dashboard" /> },
      { path: 'listings', element: <PlaceholderPage title="Manage Listings" /> },
      { path: 'inventory', element: <PlaceholderPage title="Inventory Management" /> },
      { path: 'payouts', element: <PlaceholderPage title="Payouts" /> },
    ],
  },
  {
    path: '/platform-admin',
    element: <PlatformAdminLayout />,
    children: [
      { index: true, element: <PlaceholderPage title="Platform Admin" /> },
      { path: 'dashboard', element: <PlaceholderPage title="Platform Admin" /> },
      { path: 'users', element: <PlaceholderPage title="Manage Users" /> },
      { path: 'qc-hub', element: <PlaceholderPage title="QC Hub" /> },
      { path: 'escrow', element: <PlaceholderPage title="Escrow Management" /> },
    ],
  },
]);

import { createBrowserRouter, Outlet } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AdminLayout } from '@/components/layout/AdminLayout';

// Module 3 Pages
import { HomePage } from '@/pages/customer/HomePage';
import { BrowsePage } from '@/pages/customer/BrowsePage';
import { ProductDetailPage } from '@/pages/customer/ProductDetailPage';
import { LoginPage } from '@/pages/customer/LoginPage';
import { SignUpPage } from '@/pages/customer/SignUpPage';
import { ForgotPasswordPage } from '@/pages/customer/ForgotPasswordPage';
import { CheckEmailPage } from '@/pages/customer/CheckEmailPage';
import { ResetPasswordPage } from '@/pages/customer/ResetPasswordPage';
import { ResetSuccessPage } from '@/pages/customer/ResetSuccessPage';

// Base layout for customer-facing pages
function StoreLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-base">
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
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <SignUpPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'check-email', element: <CheckEmailPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      { path: 'reset-success', element: <ResetSuccessPage /> },
      { path: 'profile', element: <PlaceholderPage title="My Profile" /> },
      { path: 'orders', element: <PlaceholderPage title="My Orders" /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <PlaceholderPage title="Admin Dashboard" /> },
      { path: 'dashboard', element: <PlaceholderPage title="Admin Dashboard" /> },
      { path: 'products', element: <PlaceholderPage title="Manage Products" /> },
      { path: 'orders', element: <PlaceholderPage title="Manage Orders" /> },
      { path: 'settings', element: <PlaceholderPage title="Settings" /> },
    ],
  },
]);

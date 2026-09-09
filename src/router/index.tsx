import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SellerLayout } from '@/components/layout/SellerLayout';
import { PlatformAdminLayout } from '@/components/layout/PlatformAdminLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

// Module 3 Pages
import { HomePage } from '@/pages/customer/HomePage';
import { BrowsePage } from '@/pages/customer/BrowsePage';
import { ProductDetailPage } from '@/pages/customer/ProductDetailPage';
import { CartPage } from '@/pages/customer/CartPage';
import { LoginPage } from '@/pages/customer/LoginPage';
import { SignUpPage } from '@/pages/customer/SignUpPage';
import { ForgotPasswordPage } from '@/pages/customer/ForgotPasswordPage';
import { CheckEmailPage } from '@/pages/customer/CheckEmailPage';
import { ResetPasswordPage } from '@/pages/customer/ResetPasswordPage';
import { ResetSuccessPage } from '@/pages/customer/ResetSuccessPage';
import { ProfileSettingsPage } from '@/pages/customer/ProfileSettingsPage';
import { EditPersonalInfoPage } from '@/pages/customer/EditPersonalInfoPage';
import { EditContactInformationPage } from '@/pages/customer/EditContactInformationPage';
import { SellerVerificationPage } from '@/pages/customer/SellerVerificationPage';
import { ProductManagementPage } from '@/pages/seller/ProductManagementPage';
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
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <PlaceholderPage title="Checkout" /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <SignUpPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'check-email', element: <CheckEmailPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      { path: 'reset-success', element: <ResetSuccessPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'profile', element: <ProfileSettingsPage /> },
          { path: 'profile/edit/personal', element: <EditPersonalInfoPage /> },
          { path: 'profile/edit/contact', element: <EditContactInformationPage /> },
          { path: 'seller/apply', element: <SellerVerificationPage /> },
          { path: 'orders', element: <PlaceholderPage title="My Orders" /> },
        ],
      },
    ],
  },
  {
    path: '/seller',
    element: <ProtectedRoute requiredRole="SELLER" />,
    children: [
      {
        element: <SellerLayout />,
        children: [
          { index: true, element: <Navigate to="inventory" replace /> },
          {
            path: 'dashboard',
            element: <PlaceholderPage title="Seller Dashboard" />,
          },
          { path: 'inventory', element: <ProductManagementPage /> },
          {
            path: 'products',
            element: <Navigate to="/seller/inventory" replace />,
          },
          {
            path: 'listings',
            element: <Navigate to="/seller/inventory" replace />,
          },
          {
            path: 'orders',
            element: <PlaceholderPage title="Seller Orders" />,
          },
          { path: 'payouts', element: <PlaceholderPage title="Payouts" /> },
          {
            path: 'store-profile',
            element: <PlaceholderPage title="Store Profile" />,
          },
        ],
      },
    ],
  },
  {
    path: '/platform-admin',
    element: <ProtectedRoute requiredRole="ADMIN" />,
    children: [
      {
        element: <PlatformAdminLayout />,
        children: [
          { index: true, element: <PlaceholderPage title="Platform Admin" /> },
          { path: 'dashboard', element: <PlaceholderPage title="Platform Admin" /> },
          { path: 'users', element: <PlaceholderPage title="Manage Users" /> },
          { path: 'qc-hub', element: <PlaceholderPage title="QC Hub" /> },
          { path: 'escrow', element: <PlaceholderPage title="Escrow Management" /> },
        ],
      },
    ],
  },
]);

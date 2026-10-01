import { Outlet } from 'react-router-dom';

import { AdminSidebar } from '@/features/admin/layouts/AdminSidebar';
import { Navbar } from './Navbar';
import { ScrollToTop } from '@/shared/components/ScrollToTop';

export function AdminLayout() {
  return (
    <div className="flex h-screen flex-col bg-bg-base text-white overflow-hidden">
      <ScrollToTop />
      <Navbar />
      <div className="flex min-h-0 flex-1 min-w-0 overflow-hidden">
        <AdminSidebar />
        <div data-route-scroll-container className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

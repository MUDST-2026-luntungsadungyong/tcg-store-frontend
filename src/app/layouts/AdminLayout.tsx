import { Outlet } from 'react-router-dom';

import { AdminSidebar } from '@/features/admin/layouts/AdminSidebar';
import { Navbar } from './Navbar';
import { ScrollToTop } from '@/shared/components/ScrollToTop';

export function AdminLayout() {
  return <div className="flex min-h-screen flex-col bg-bg-base text-white"><ScrollToTop /><Navbar /><div className="flex min-h-0 flex-1"><AdminSidebar /><div data-route-scroll-container className="min-w-0 flex-1 overflow-y-auto"><Outlet /></div></div></div>;
}

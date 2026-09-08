import { Outlet } from 'react-router-dom';
import { SellerSidebar } from '@/features/seller/layouts/SellerSidebar';
import { Navbar } from '@/app/layouts/Navbar';

export function SellerLayout() {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col text-white">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <SellerSidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

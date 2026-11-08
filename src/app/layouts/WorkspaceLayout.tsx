import { Outlet } from 'react-router-dom';
import { WorkspaceSidebar } from '@/features/listings/layouts/WorkspaceSidebar';
import { Navbar } from '@/app/layouts/Navbar';
import { ScrollToTop } from '@/shared/components/ScrollToTop';

export function WorkspaceLayout() {
  return (
    <div className="min-h-screen pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0 bg-bg-base flex flex-col text-white">
      <ScrollToTop />
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <WorkspaceSidebar />
        <main data-route-scroll-container className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

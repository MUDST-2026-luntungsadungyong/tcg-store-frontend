import { Outlet } from 'react-router-dom';
import { PlatformAdminSidebar } from './PlatformAdminSidebar';
import { Navbar } from './Navbar';

export function PlatformAdminLayout() {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col text-white">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <PlatformAdminSidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

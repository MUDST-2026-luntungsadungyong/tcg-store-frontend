import { Outlet } from 'react-router-dom';

import { Footer } from './Footer';
import { Navbar } from './Navbar';
import { ScrollToTop } from '@/shared/components/ScrollToTop';

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-base text-white">
      <ScrollToTop />
      <Navbar />
      <main className="w-full flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

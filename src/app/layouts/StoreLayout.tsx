import { Outlet } from 'react-router-dom';

import { Footer } from './Footer';
import { Navbar } from './Navbar';

export function StoreLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-base text-white">
      <Navbar />
      <main className="w-full flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

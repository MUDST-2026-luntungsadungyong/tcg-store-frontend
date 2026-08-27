import { NavLink } from 'react-router-dom';
import { cn } from '@/utils';
import { LayoutDashboard, Package, ShoppingBag, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/common/Button';

const platformLinks = [
  { name: 'Dashboard', to: '/platform-admin/dashboard', icon: LayoutDashboard },
  { name: 'Users', to: '/platform-admin/users', icon: Package },
  { name: 'QC Hub', to: '/platform-admin/qc-hub', icon: ShoppingBag },
  { name: 'Escrow', to: '/platform-admin/escrow', icon: Settings },
];

export function PlatformAdminSidebar() {
  return (
    <aside className="w-64 flex-shrink-0 bg-bg-surface border-r border-white/5 hidden md:flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="p-6">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
          Platform Admin
        </h2>
        <nav className="space-y-1">
          {platformLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.name}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive 
                      ? 'bg-brand-blue/10 text-brand-blue' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  )
                }
              >
                <Icon size={18} />
                {link.name}
              </NavLink>
            );
          })}
        </nav>
      </div>
      
      <div className="p-6 mt-auto border-t border-white/5">
        <Button variant="ghost" className="w-full justify-start gap-3 text-status-danger hover:text-status-danger hover:bg-status-danger/10">
          <LogOut size={18} />
          Exit Admin
        </Button>
      </div>
    </aside>
  );
}

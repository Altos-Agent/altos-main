'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Zap, 
  Plug, 
  Settings, 
  Terminal,
  Activity 
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/automate', label: 'Automations', icon: Zap },
  { path: '/channels', label: 'Channels', icon: Plug },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-altos-card border-r border-altos-border flex flex-col">
      <div className="p-6 border-b border-altos-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-altos-primary flex items-center justify-center">
            <Terminal className="text-white" size={18} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-altos-text">Altos</h1>
            <p className="text-xs text-altos-muted">AI Agent Platform</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              href={item.path}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors',
                isActive 
                  ? 'bg-altos-primary/10 text-altos-primary' 
                  : 'text-altos-muted hover:text-altos-text hover:bg-altos-border'
              )}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-altos-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Activity size={18} className="text-altos-success" />
          <div className="flex-1">
            <p className="text-xs text-altos-muted">System Status</p>
            <p className="text-sm text-altos-success">All systems operational</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

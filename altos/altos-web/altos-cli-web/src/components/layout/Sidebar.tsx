import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { 
  LayoutDashboard, 
  Cpu, 
  Boxes, 
  Users, 
  Plug, 
  Zap, 
  FileText, 
  Settings,
  Terminal
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/providers', label: 'Providers', icon: Cpu },
  { path: '/models', label: 'Models', icon: Boxes },
  { path: '/agents', label: 'Agents', icon: Users },
  { path: '/channels', label: 'Channels', icon: Plug },
  { path: '/automations', label: 'Automations', icon: Zap },
  { path: '/logs', label: 'Activity', icon: FileText },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-altos-surface border-r border-altos-border flex flex-col">
      <div className="p-6 border-b border-altos-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-glow">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-altos-text">Altos</h1>
            <p className="text-xs text-altos-muted">Local AI Platform</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'sidebar-link',
                isActive && 'sidebar-link-active'
              )
            }
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-altos-border">
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="status-dot status-dot-success" />
            <span className="text-sm font-medium text-altos-text">Local Runtime</span>
          </div>
          <p className="text-xs text-altos-muted">Altos CLI v0.2.0</p>
        </div>
      </div>
    </aside>
  );
}

import { clsx } from 'clsx';

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'error' | 'warning' | 'pending';
  children?: React.ReactNode;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, children, size = 'md' }: StatusBadgeProps) {
  const styles = {
    online: 'badge-success',
    offline: 'badge-neutral',
    error: 'badge-error',
    warning: 'badge-warning',
    pending: 'badge-info',
  };

  const icons = {
    online: '●',
    offline: '○',
    error: '✕',
    warning: '◐',
    pending: '◑',
  };

  return (
    <span className={clsx('badge', styles[status])}>
      <span className="mr-1">{icons[status]}</span>
      {children}
    </span>
  );
}

interface StatusDotProps {
  status: 'online' | 'offline' | 'error' | 'warning';
  className?: string;
}

export function StatusDot({ status, className }: StatusDotProps) {
  const styles = {
    online: 'bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.5)]',
    offline: 'bg-gray-400',
    error: 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]',
    warning: 'bg-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
  };

  return (
    <span 
      className={clsx('status-dot', styles[status], className)} 
    />
  );
}

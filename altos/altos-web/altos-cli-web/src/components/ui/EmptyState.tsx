import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface EmptyStateProps {
  icon?: string | ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={clsx('empty-state', className)}>
      {icon && (
        <div className="empty-state-icon">
          {typeof icon === 'string' ? icon : icon}
        </div>
      )}
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

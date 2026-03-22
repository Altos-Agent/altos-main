import { clsx } from 'clsx';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover = false, onClick }: CardProps) {
  const Component = onClick ? 'button' : 'div';
  
  return (
    <Component
      onClick={onClick}
      className={clsx(
        'glass-card',
        hover && 'cursor-pointer hover:border-indigo-500/30 hover:shadow-glow transition-all duration-200',
        className
      )}
    >
      {children}
    </Component>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { value: number; positive: boolean };
  className?: string;
}

export function MetricCard({ label, value, icon, trend, className }: MetricCardProps) {
  return (
    <Card className={clsx('metric-card', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="metric-label">{label}</p>
          <p className="metric-value">{value}</p>
          {trend && (
            <p className={clsx(
              'text-xs mt-1',
              trend.positive ? 'text-green-400' : 'text-red-400'
            )}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className="text-2xl opacity-50">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

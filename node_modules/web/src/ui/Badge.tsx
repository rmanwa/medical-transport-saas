import { forwardRef } from 'react';
import { cn } from './cn';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: React.ReactNode;
};

const variantClasses = {
  default: 'bg-slate-100 text-slate-700 border-slate-200',
  primary: 'bg-blue-100 text-blue-700 border-blue-200',
  success: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  danger: 'bg-red-100 text-red-700 border-red-200',
  info: 'bg-cyan-100 text-cyan-700 border-cyan-200',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot, icon, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 font-semibold rounded-full border whitespace-nowrap',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              variant === 'primary' && 'bg-blue-500',
              variant === 'success' && 'bg-green-500',
              variant === 'warning' && 'bg-amber-500',
              variant === 'danger' && 'bg-red-500',
              variant === 'info' && 'bg-cyan-500',
              variant === 'default' && 'bg-slate-500'
            )}
          />
        )}
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
import { forwardRef } from 'react';
import { cn } from './cn';

type SelectSize = 'sm' | 'md' | 'lg';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  helperText?: string;
  selectSize?: SelectSize;
  fullWidth?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      selectSize = 'md',
      fullWidth = true,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-11 px-4 text-sm',
      lg: 'h-13 px-5 text-base',
    };

    return (
      <div className={cn('space-y-1.5', fullWidth && 'w-full')}>
        {label && (
          <label className="block text-sm font-semibold text-slate-700">
            {label}
            {props.required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full appearance-none rounded-xl border border-slate-200 bg-white outline-none transition-all duration-200',
              'focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10',
              'disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-slate-50',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/10',
              sizeClasses[selectSize],
              'pr-10', // Space for dropdown icon
              className
            )}
            {...props}
          >
            {children}
          </select>

          {/* Dropdown Icon */}
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {(error || helperText) && (
          <p className={cn('text-xs', error ? 'text-red-600' : 'text-slate-500')}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
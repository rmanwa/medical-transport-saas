import { cn } from './cn';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
};

export function Button({ className, variant = 'primary', ...props }: Props) {
  const styles =
    variant === 'primary'
      ? 'bg-slate-900 text-white hover:bg-slate-800'
      : variant === 'secondary'
      ? 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50'
      : variant === 'ghost'
      ? 'bg-transparent text-slate-700 hover:bg-slate-100'
      : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50';

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed',
        styles,
        className,
      )}
      {...props}
    />
  );
}